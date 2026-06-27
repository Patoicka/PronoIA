"""
Cliente para The Odds API (https://the-odds-api.com)
Free tier: 500 requests/mes — UNA llamada devuelve TODOS los partidos + TODOS los mercados.
Agrega cuotas de bet365, DraftKings (misma empresa que Draftea), Betfair y otras.
"""
import os
import time
import logging
from difflib import get_close_matches

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

ODDS_API_KEY  = os.getenv("ODDS_API_KEY", "")
ODDS_API_BASE = "https://api.the-odds-api.com/v4"

SPORT_KEY_MAP: dict[str, str] = {
    "WC":  "soccer_fifa_world_cup",
    "PL":  "soccer_epl",
    "PD":  "soccer_spain_la_liga",
    "SA":  "soccer_italy_serie_a",
    "BL1": "soccer_germany_bundesliga",
    "FL1": "soccer_france_ligue_one",
    "CL":  "soccer_uefa_champs_league",
    "EL":  "soccer_uefa_europa_league",
}

# DraftKings = misma plataforma que Draftea en Latam
PREFERRED_BOOKMAKERS = [
    "draftkings", "fanduel", "betmgm",
    "bet365", "williamhill", "unibet", "betfair_ex_eu", "pinnacle",
]

_odds_cache: dict[str, tuple[float, list]] = {}
CACHE_TTL = 900  # 15 min


def _norm(s: str) -> str:
    return s.lower().strip()


def _preferred_bm(bookmakers: list[dict]) -> dict | None:
    bm_map = {b["key"]: b for b in bookmakers}
    return next((bm_map[k] for k in PREFERRED_BOOKMAKERS if k in bm_map),
                bookmakers[0] if bookmakers else None)


def _normalize_pair(odd_a: float, odd_b: float) -> tuple[float, float]:
    """Elimina el margen de la casa dividiendo entre la suma de probabilidades implícitas."""
    if not (odd_a and odd_b and odd_a > 0 and odd_b > 0):
        return 50.0, 50.0
    ra = 1 / odd_a
    rb = 1 / odd_b
    t  = ra + rb
    return round(ra / t * 100, 2), round(rb / t * 100, 2)


def fetch_sport_odds(sport_key: str) -> list[dict]:
    """
    Descarga cuotas de h2h + totales + btts en UNA sola llamada.
    Con caché de 15 min → no consume requests repetidamente.
    """
    if not ODDS_API_KEY:
        return []

    cached = _odds_cache.get(sport_key)
    if cached and (time.time() - cached[0]) < CACHE_TTL:
        return cached[1]

    # Intentar con todos los mercados, luego degradar si alguno no está disponible
    for markets in ("h2h,totals,btts", "h2h,totals", "h2h"):
        try:
            resp = requests.get(
                f"{ODDS_API_BASE}/sports/{sport_key}/odds",
                params={
                    "apiKey":     ODDS_API_KEY,
                    "regions":    "us,us2,eu,uk",
                    "markets":    markets,
                    "oddsFormat": "decimal",
                    "dateFormat": "iso",
                },
                timeout=15,
            )
            if resp.status_code == 401:
                logger.error("[OddsAPI] API key inválida — verifica ODDS_API_KEY en .env")
                return []
            if resp.status_code == 429:
                logger.warning("[OddsAPI] Cuota mensual agotada (500 requests/mes)")
                return []
            if resp.status_code == 422:
                logger.warning("[OddsAPI] Mercados no soportados (%s) para %s, reintentando...", markets, sport_key)
                continue
            resp.raise_for_status()
            data = resp.json()
            remaining = resp.headers.get("x-requests-remaining", "?")
            used      = resp.headers.get("x-requests-used", "?")
            logger.info("[OddsAPI] %s (markets=%s) — %d partidos · usados: %s · restantes: %s",
                        sport_key, markets, len(data), used, remaining)
            _odds_cache[sport_key] = (time.time(), data)
            return data
        except Exception as exc:
            logger.warning("[OddsAPI] Error al obtener %s: %s", sport_key, exc)
            return []
    return []


def find_match_odds(home_name: str, away_name: str,
                    odds_list: list[dict]) -> tuple[dict, bool] | tuple[None, bool]:
    """
    Busca el partido en la lista (exacto → fuzzy).
    Retorna (game, swapped) donde swapped=True indica que el orden home/away
    está invertido respecto a lo solicitado (frecuente en partidos neutrales).
    """
    h, a = _norm(home_name), _norm(away_name)

    def match(s1: str, s2: str) -> bool:
        return s1 == s2 or bool(get_close_matches(s1, [s2], n=1, cutoff=0.75))

    for game in odds_list:
        gh = _norm(game.get("home_team", ""))
        ga = _norm(game.get("away_team", ""))
        if match(h, gh) and match(a, ga):
            return game, False
        if match(h, ga) and match(a, gh):
            return game, True   # encontrado con equipos invertidos
    return None, False


def extract_1x2(game: dict, swapped: bool = False) -> dict | None:
    """
    Probabilidades 1X2 normalizadas + cuotas decimales originales.
    Si swapped=True los equipos están invertidos en el juego → intercambia home/away.
    """
    bm = _preferred_bm(game.get("bookmakers", []))
    if not bm:
        return None
    h2h = next((m for m in bm.get("markets", []) if m["key"] == "h2h"), None)
    if not h2h:
        return None

    outcomes: dict[str, float] = {o["name"]: float(o["price"]) for o in h2h.get("outcomes", [])}
    # En el juego encontrado: "home_team" puede ser el away real si está swapped
    api_home = game["home_team"]
    api_away = game["away_team"]
    api_home_odd = outcomes.get(api_home)
    api_away_odd = outcomes.get(api_away)
    draw_odd     = outcomes.get("Draw")
    if not (api_home_odd and api_away_odd and draw_odd):
        return None

    # Si está invertido, home real = api_away, away real = api_home
    if swapped:
        home_odd, away_odd = api_away_odd, api_home_odd
    else:
        home_odd, away_odd = api_home_odd, api_away_odd

    rh, rd, ra = 1/home_odd, 1/draw_odd, 1/away_odd
    t = rh + rd + ra
    return {
        "home": round(rh/t*100, 2),
        "draw": round(rd/t*100, 2),
        "away": round(ra/t*100, 2),
        "home_odd": home_odd,
        "draw_odd": draw_odd,
        "away_odd": away_odd,
        "bookmaker": bm.get("title", bm.get("key", "?")),
    }


def extract_totals(game: dict) -> dict:
    """
    Probabilidades over/under para líneas de goles (1.5, 2.5, 3.5, 4.5).
    Normaliza eliminando el margen de la casa.
    Retorna {over15, under15, over25, under25, over35, over45} como porcentajes.
    """
    bm = _preferred_bm(game.get("bookmakers", []))
    if not bm:
        return {}

    totals = next((m for m in bm.get("markets", []) if m["key"] == "totals"), None)
    if not totals:
        return {}

    # Agrupar por punto: {2.5: {"Over": odd, "Under": odd}, ...}
    lines: dict[float, dict[str, float]] = {}
    for o in totals.get("outcomes", []):
        pt   = float(o.get("point", 0))
        name = o.get("name", "")
        price = float(o.get("price", 0))
        if pt not in lines:
            lines[pt] = {}
        lines[pt][name] = price

    result: dict[str, float] = {}
    for pt, sides in lines.items():
        over_odd  = sides.get("Over", 0)
        under_odd = sides.get("Under", 0)
        if not (over_odd and under_odd):
            continue
        prob_over, prob_under = _normalize_pair(over_odd, under_odd)
        key = str(pt).replace(".", "")
        result[f"over{key}"]  = prob_over
        result[f"under{key}"] = prob_under
        # Guardar cuotas originales para mostrarlas en el frontend
        result[f"odd_over{key}"]  = over_odd
        result[f"odd_under{key}"] = under_odd

    return result


def extract_btts(game: dict) -> dict | None:
    """
    Probabilidad de que ambos equipos anoten (BTTS Yes).
    Retorna {btts_yes, btts_no, odd_yes, odd_no} o None.
    """
    bm = _preferred_bm(game.get("bookmakers", []))
    if not bm:
        return None

    btts_mkt = next((m for m in bm.get("markets", []) if m["key"] == "btts"), None)
    if not btts_mkt:
        return None

    outcomes: dict[str, float] = {o["name"]: float(o["price"]) for o in btts_mkt.get("outcomes", [])}
    yes_odd = outcomes.get("Yes")
    no_odd  = outcomes.get("No")
    if not (yes_odd and no_odd):
        return None

    prob_yes, prob_no = _normalize_pair(yes_odd, no_odd)
    return {
        "btts_yes": prob_yes,
        "btts_no":  prob_no,
        "odd_yes":  yes_odd,
        "odd_no":   no_odd,
    }


def get_all_markets_from_odds(competition_code: str, home_name: str, away_name: str,
                               odds_list: list[dict]) -> dict:
    """
    Retorna todos los mercados disponibles para un partido de una lista pre-cargada.
    {
      "x12":    {...} | None,
      "totals": {...} | {},
      "btts":   {...} | None,
    }
    """
    game, swapped = find_match_odds(home_name, away_name, odds_list)
    if not game:
        return {"x12": None, "totals": {}, "btts": None}

    return {
        "x12":    extract_1x2(game, swapped=swapped),
        "totals": extract_totals(game),
        "btts":   extract_btts(game),
    }
