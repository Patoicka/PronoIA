import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from difflib import get_close_matches

import joblib
import numpy as np
import pandas as pd
import requests
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session

import models
from api_client import (
    fetch_upcoming_matches,
    get_total_rounds,
    normalize_match,
    LEAGUE_ID_TO_CODE,
    test_connection,
)
from odds_client import fetch_sport_odds, get_all_markets_from_odds, SPORT_KEY_MAP
from database import get_db

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# DeepSeek
# ---------------------------------------------------------------------------
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE    = "https://api.deepseek.com/v1"

# Cache en memoria: evita llamar a DeepSeek dos veces por el mismo partido
_deepseek_cache: dict[int, str] = {}


def _call_deepseek(match_id: int, home_name: str, away_name: str, data_summary: str) -> str:
    """Llama a DeepSeek Chat para generar análisis narrativo. Retorna '' si falla."""
    if not DEEPSEEK_API_KEY:
        return ""
    if match_id in _deepseek_cache:
        return _deepseek_cache[match_id]

    prompt = (
        f"Eres un analista de fútbol experto. Genera UN párrafo conciso (3-4 oraciones) en español "
        f"analizando este partido para apostadores deportivos.\n\n"
        f"Partido: {home_name} (local) vs {away_name} (visitante)\n"
        f"Datos del modelo IA:\n{data_summary}\n\n"
        f"Instrucciones:\n"
        f"- Usa los datos como base PERO añade contexto real si lo conoces (títulos recientes, figura del equipo, rivalidades históricas)\n"
        f"- Sé directo y convincente, como un experto dando su opinión clara\n"
        f"- Traduce los datos técnicos a lenguaje natural (no digas 'Elo', di 'nivel histórico' o 'jerarquía')\n"
        f"- Máximo 90 palabras\n"
        f"- Solo el párrafo, sin títulos ni listas"
    )

    try:
        resp = requests.post(
            f"{DEEPSEEK_BASE}/chat/completions",
            headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 220,
                "temperature": 0.65,
            },
            timeout=18,
        )
        resp.raise_for_status()
        text = resp.json()["choices"][0]["message"]["content"].strip()
        _deepseek_cache[match_id] = text
        return text
    except Exception as e:
        logger.warning("[DeepSeek] Error para %s vs %s: %s", home_name, away_name, e)
        return ""

# ---------------------------------------------------------------------------
# Constantes de predicción
# ---------------------------------------------------------------------------
HOME_ADVANTAGE = 65
FEATURE_COLS = [
    "home_elo", "away_elo", "elo_diff",
    "home_rest_days", "away_rest_days",
    "home_form", "away_form",
    "home_gs_avg", "away_gs_avg",
    "home_gc_avg", "away_gc_avg",
    "h2h_home_win_rate",
]
NEUTRAL_FEATURES = np.array(
    [[1500.0, 1500.0, HOME_ADVANTAGE, 7, 7, 1.0, 1.0, 1.3, 1.3, 1.3, 1.3, 0.33]]
)


# ---------------------------------------------------------------------------
# Carga de modelos ML
# ---------------------------------------------------------------------------
models_dict: dict = {}
for _name in ["1x2", "over15", "over25", "btts", "dc_1x", "dc_x2"]:
    _path = f"data/processed/models/xgb_{_name}.pkl"
    if os.path.exists(_path):
        models_dict[_name] = joblib.load(_path)
    else:
        logger.warning("Modelo %s no encontrado en %s", _name, _path)


# ---------------------------------------------------------------------------
# Estado de equipos (Elo + rachas, persistido por feature_engineering.py)
# ---------------------------------------------------------------------------
_TEAM_STATE_PATH = "data/processed/team_state.json"
_team_state: dict = {}   # {"normalized_name": { elo, last_date, points, gs, gc }}
_h2h_state: dict = {}    # {"name1||name2": [winner_name, ...]}

if os.path.exists(_TEAM_STATE_PATH):
    with open(_TEAM_STATE_PATH, encoding="utf-8") as _f:
        _raw_state = json.load(_f)
        _team_state = _raw_state.get("teams", {})
        _h2h_state = _raw_state.get("h2h", {})
    logger.warning("[startup] team_state cargado: %d equipos", len(_team_state))
else:
    logger.warning(
        "[startup] team_state.json no encontrado — se usarán features neutras. "
        "Ejecuta feature_engineering.py tras el ETL para activar predicciones reales."
    )


def _normalize_name(name: str) -> str:
    for suffix in [" FC", " CF", " SC", " AC", " AS", " SL", " SAD", " F.C.", " C.F."]:
        if name.endswith(suffix):
            name = name[: -len(suffix)]
    return name.strip().lower()


# ---------------------------------------------------------------------------
# Elo de selecciones nacionales (fuente: eloratings.net, junio 2026)
# Cubre los 48 clasificados al Mundial 2026 + variantes de nombre
# ---------------------------------------------------------------------------
NATIONAL_TEAM_ELO: dict[str, float] = {
    # Élite mundial (>1900)
    "argentina":            2070,
    "france":               2000,
    "england":              1960,
    "brazil":               1950,
    "spain":                1940,
    "germany":              1890,
    "portugal":             1880,
    "netherlands":          1870,
    "holland":              1870,
    # Segundo nivel (1750–1900)
    "uruguay":              1830,
    "belgium":              1810,
    "italy":                1800,
    "colombia":             1790,
    "croatia":              1760,
    "mexico":               1755,
    "denmark":              1750,
    # Tercer nivel (1630–1750)
    "morocco":              1740,
    "switzerland":          1720,
    "senegal":              1710,
    "japan":                1700,
    "united states":        1690,
    "usa":                  1690,
    "ecuador":              1680,
    "austria":              1670,
    "turkey":               1660,
    "nigeria":              1650,
    "south korea":          1645,
    "korea republic":       1645,
    "australia":            1635,
    "canada":               1630,
    # Cuarto nivel (1530–1630)
    "serbia":               1625,
    "scotland":             1620,
    "ukraine":              1615,
    "poland":               1610,
    "hungary":              1600,
    "ghana":                1590,
    "egypt":                1585,
    "ivory coast":          1585,
    "cote d'ivoire":        1585,
    "iran":                 1580,
    "venezuela":            1575,
    "paraguay":             1565,
    "czech republic":       1560,
    "romania":              1555,
    "saudi arabia":         1550,
    "cameroon":             1545,
    "new zealand":          1540,
    "jamaica":              1535,
    "costa rica":           1530,
    # Quinto nivel (<1530)
    "dr congo":             1525,
    "democratic republic of congo": 1525,
    "mali":                 1520,
    "south africa":         1515,
    "algeria":              1510,
    "peru":                 1505,
    "chile":                1500,
    "tunisia":              1495,
    "ukraine":              1490,
    "slovakia":             1485,
    "albania":              1480,
    "slovenia":             1475,
    "iraq":                 1465,
    "honduras":             1455,
    "el salvador":          1445,
    "panama":               1440,
    "qatar":                1435,
    "uzbekistan":           1430,
    "jordan":               1425,
    "oman":                 1415,
    "bahrain":              1410,
    "trinidad and tobago":  1405,
    "cuba":                 1395,
    "new caledonia":        1350,
    "bolivia":              1345,
    "northern ireland":     1480,
    "norway":               1550,
    "sweden":               1555,
    "greece":               1470,
}


def _static_nat_state(elo: float) -> dict:
    """Estado estimado para una selección cuando no hay datos del torneo."""
    if elo >= 1900:
        pts, gs, gc = 2.2, 2.3, 0.7
    elif elo >= 1800:
        pts, gs, gc = 2.0, 2.0, 0.9
    elif elo >= 1700:
        pts, gs, gc = 1.7, 1.6, 1.1
    elif elo >= 1600:
        pts, gs, gc = 1.4, 1.3, 1.4
    elif elo >= 1500:
        pts, gs, gc = 1.1, 1.1, 1.6
    else:
        pts, gs, gc = 0.8, 0.8, 1.9
    return {"elo": elo, "last_date": None, "points": [pts]*5, "gs": [gs]*5, "gc": [gc]*5}


# ---------------------------------------------------------------------------
# Perfiles dinámicos: Elo + stats reales de los partidos ya jugados del torneo
# ---------------------------------------------------------------------------
_live_profiles: dict[str, dict] = {}   # {norm_name: {elo, points, gs, gc, last_date}}
_live_profiles_ts: float = 0.0
_LIVE_COMPETITION_CODE = "WC"          # Torneo activo cuyo Elo se actualiza en vivo
_ELO_K_TOURNAMENT = 60                 # Factor K para torneos internacionales de élite


def _find_nat_key(name: str, pool: dict) -> str | None:
    """Busca el nombre normalizado en pool (exacto → fuzzy)."""
    k = _normalize_name(name)
    if k in pool:
        return k
    m = get_close_matches(k, pool.keys(), n=1, cutoff=0.70)
    return m[0] if m else None


def _build_live_profiles() -> dict[str, dict]:
    """
    Descarga los partidos FINISHED del torneo activo y actualiza los Elos base
    con los resultados reales. También registra goles y puntos por partido.
    Retorna dict {norm_name: {elo, points, gs, gc}}.
    """
    from api_client import _headers, FOOTBALL_DATA_BASE

    base = {k: float(v) for k, v in NATIONAL_TEAM_ELO.items()}
    profiles: dict[str, dict] = {}

    def _ensure(key: str, elo: float):
        if key not in profiles:
            profiles[key] = {"elo": elo, "points": [], "gs": [], "gc": []}

    try:
        resp = requests.get(
            f"{FOOTBALL_DATA_BASE}/competitions/{_LIVE_COMPETITION_CODE}/matches",
            headers=_headers(),
            params={"status": "FINISHED"},
            timeout=15,
        )
        if not resp.ok:
            return {}
        raw_matches = resp.json().get("matches", [])
    except Exception as exc:
        logger.warning("[live_profiles] No se pudo obtener resultados del torneo: %s", exc)
        return {}

    for m in raw_matches:
        h_name = (m.get("homeTeam") or {}).get("name", "")
        a_name = (m.get("awayTeam") or {}).get("name", "")
        score  = (m.get("score") or {}).get("fullTime") or {}
        h_g    = score.get("home")
        a_g    = score.get("away")

        if h_g is None or a_g is None:
            continue

        hk = _find_nat_key(h_name, base)
        ak = _find_nat_key(a_name, base)
        if not hk or not ak:
            continue

        _ensure(hk, base[hk])
        _ensure(ak, base[ak])

        h_elo = profiles[hk]["elo"]
        a_elo = profiles[ak]["elo"]

        # Resultado
        if h_g > a_g:
            s_h, s_a, pts_h, pts_a = 1.0, 0.0, 3, 0
        elif h_g == a_g:
            s_h, s_a, pts_h, pts_a = 0.5, 0.5, 1, 1
        else:
            s_h, s_a, pts_h, pts_a = 0.0, 1.0, 0, 3

        # Elo esperado (sin ventaja local en torneos en campo neutral)
        e_h = 1 / (1 + 10 ** ((a_elo - h_elo) / 400))

        # Actualizar Elo
        profiles[hk]["elo"] = h_elo + _ELO_K_TOURNAMENT * (s_h - e_h)
        profiles[ak]["elo"] = a_elo + _ELO_K_TOURNAMENT * (s_a - (1 - e_h))

        # Acumular stats reales
        profiles[hk]["points"].append(pts_h)
        profiles[hk]["gs"].append(h_g)
        profiles[hk]["gc"].append(a_g)
        profiles[ak]["points"].append(pts_a)
        profiles[ak]["gs"].append(a_g)
        profiles[ak]["gc"].append(h_g)

    logger.info("[live_profiles] Perfiles calculados para %d selecciones (%d partidos).",
                len(profiles), len(raw_matches))
    return profiles


def _get_live_profiles() -> dict[str, dict]:
    """Devuelve perfiles cacheados; refresca cada 30 min."""
    import time
    global _live_profiles, _live_profiles_ts
    if time.time() - _live_profiles_ts > 1800:
        built = _build_live_profiles()
        if built:
            _live_profiles = built
            _live_profiles_ts = time.time()
    return _live_profiles


def _find_team(query: str) -> dict | None:
    """
    Busca estado del equipo:
      1. team_state.json (clubes europeos)
      2. Perfiles dinámicos del torneo en curso (Elo + stats reales)
      3. Elo estático de selecciones → estimación de stats
    """
    key = _normalize_name(query)

    # 1) Clubes
    if key in _team_state:
        return _team_state[key]
    club_m = get_close_matches(key, _team_state.keys(), n=1, cutoff=0.6)
    if club_m:
        return _team_state[club_m[0]]

    # 2) Perfil dinámico del torneo (tiene Elo + datos reales de partidos jugados)
    live = _get_live_profiles()
    nat_key = _find_nat_key(query, live) if live else None
    if nat_key:
        p = live[nat_key]
        live_elo = p["elo"]
        # Si tiene menos de 3 partidos reales, rellenamos con estimación estática
        base_state = _static_nat_state(live_elo)
        real_pts = p["points"]
        real_gs  = p["gs"]
        real_gc  = p["gc"]
        # Combinar: datos reales primero, luego estimados para completar a 5 valores
        fill_pts = (base_state["points"] * 5)[: max(0, 5 - len(real_pts))]
        fill_gs  = (base_state["gs"]     * 5)[: max(0, 5 - len(real_gs))]
        fill_gc  = (base_state["gc"]     * 5)[: max(0, 5 - len(real_gc))]
        return {
            "elo":       live_elo,
            "last_date": None,
            "points":    fill_pts + real_pts,
            "gs":        fill_gs  + real_gs,
            "gc":        fill_gc  + real_gc,
        }

    # 3) Elo estático → estimación
    nat_base = _find_nat_key(query, NATIONAL_TEAM_ELO)
    if nat_base:
        return _static_nat_state(NATIONAL_TEAM_ELO[nat_base])

    return None


def _compute_features(home_name: str, away_name: str) -> np.ndarray:
    """Calcula el vector de features real para un partido en vivo."""
    home = _find_team(home_name)
    away = _find_team(away_name)

    if not home or not away:
        return NEUTRAL_FEATURES.copy()

    now_date = datetime.now(timezone.utc).date()

    def rest_days(state: dict) -> int:
        if state.get("last_date"):
            delta = (now_date - datetime.fromisoformat(state["last_date"]).date()).days
            return min(14, max(0, delta))
        return 7

    def avg_last5(lst: list, default: float) -> float:
        recent = lst[-5:]
        return sum(recent) / len(recent) if len(recent) >= 1 else default

    home_elo = home["elo"]
    away_elo = away["elo"]
    elo_diff = (home_elo + HOME_ADVANTAGE) - away_elo

    home_rest = rest_days(home)
    away_rest = rest_days(away)

    home_form = avg_last5(home.get("points", []), 1.0)
    away_form = avg_last5(away.get("points", []), 1.0)
    home_gs = avg_last5(home.get("gs", []), 1.3)
    away_gs = avg_last5(away.get("gs", []), 1.3)
    home_gc = avg_last5(home.get("gc", []), 1.3)
    away_gc = avg_last5(away.get("gc", []), 1.3)

    # H2H
    names = sorted([_normalize_name(home_name), _normalize_name(away_name)])
    history = _h2h_state.get("||".join(names), [])
    if history:
        norm_home = _normalize_name(home_name)
        h2h_rate = sum(1 for w in history[-5:] if w == norm_home) / min(len(history), 5)
    else:
        h2h_rate = 0.33

    return np.array([[
        home_elo, away_elo, elo_diff,
        home_rest, away_rest,
        home_form, away_form,
        home_gs, away_gs,
        home_gc, away_gc,
        h2h_rate,
    ]])


def _generate_analysis(home_name: str, away_name: str, markets: dict) -> tuple[str, str]:
    """Devuelve (rule_based_text, data_summary_para_llm)."""
    home = _find_team(home_name)
    away = _find_team(away_name)

    x12    = markets.get("1x2", {})
    h_pct  = x12.get("home", 33.33)
    d_pct  = x12.get("draw", 33.33)
    a_pct  = x12.get("away", 33.33)
    over25 = markets.get("over25", 50.0)
    btts   = markets.get("btts",   50.0)

    lines: list[str] = []

    top = max(h_pct, d_pct, a_pct)
    if top == h_pct and h_pct > 42:
        lines.append(f"{home_name} parte como favorito con un {h_pct:.0f}% de probabilidad de victoria.")
    elif top == a_pct and a_pct > 42:
        lines.append(f"{away_name} llega como favorito con un {a_pct:.0f}% de probabilidad de victoria.")
    else:
        lines.append(f"Duelo muy igualado: {home_name} {h_pct:.0f}% · Empate {d_pct:.0f}% · {away_name} {a_pct:.0f}%.")

    if not home or not away:
        rule_text = " ".join(lines)
        summary   = f"Probabilidades: {home_name} {h_pct:.0f}%, Empate {d_pct:.0f}%, {away_name} {a_pct:.0f}%. Datos históricos no disponibles."
        return rule_text, summary

    def avg5(lst: list, default: float) -> float:
        r = lst[-5:]
        return sum(r) / len(r) if r else default

    home_elo  = home["elo"]
    away_elo  = away["elo"]
    elo_diff  = abs(home_elo - away_elo)
    home_form = avg5(home.get("points", []), 1.0)
    away_form = avg5(away.get("points", []), 1.0)
    home_gs   = avg5(home.get("gs",     []), 1.3)
    away_gs   = avg5(away.get("gs",     []), 1.3)
    home_gc   = avg5(home.get("gc",     []), 1.3)
    away_gc   = avg5(away.get("gc",     []), 1.3)

    stronger = home_name if home_elo >= away_elo else away_name
    weaker   = away_name if home_elo >= away_elo else home_name
    if elo_diff > 250:
        lines.append(
            f"La diferencia de jerarquía histórica es notable: {stronger} ({max(home_elo, away_elo):.0f}) "
            f"supera en {elo_diff:.0f} puntos a {weaker} ({min(home_elo, away_elo):.0f})."
        )
    elif elo_diff > 80:
        lines.append(f"{stronger} llega con ventaja histórica ({max(home_elo, away_elo):.0f} vs {min(home_elo, away_elo):.0f}).")
    else:
        lines.append(f"Nivel histórico similar entre ambos ({home_elo:.0f} vs {away_elo:.0f}).")

    if home_form > away_form + 0.4:
        lines.append(f"{home_name} llega en mejor forma ({home_form:.1f} pts/partido vs {away_form:.1f} de {away_name}).")
    elif away_form > home_form + 0.4:
        lines.append(f"{away_name} llega en mejor momento ({away_form:.1f} pts/partido vs {home_form:.1f} de {home_name}).")

    if home_gs > 2.1:
        lines.append(f"{home_name} promedia {home_gs:.1f} goles por partido en ataque.")
    if away_gc > 1.9:
        lines.append(f"{away_name} ha concedido {away_gc:.1f} goles por encuentro en defensa.")
    elif home_gc < 0.9:
        lines.append(f"{home_name} llega con una defensa sólida: {home_gc:.1f} goles encajados por partido.")

    key_names = sorted([_normalize_name(home_name), _normalize_name(away_name)])
    history   = _h2h_state.get("||".join(key_names), [])
    h2h_line  = ""
    if len(history) >= 3:
        norm_home = _normalize_name(home_name)
        last5     = history[-5:]
        home_wins = sum(1 for w in last5 if w == norm_home)
        away_wins = sum(1 for w in last5 if w != norm_home and w != "draw")
        total_h2h = len(last5)
        if home_wins >= 4:
            h2h_line = f"{home_name} domina el historial: {home_wins} victorias en los últimos {total_h2h} cruces."
        elif away_wins >= 4:
            h2h_line = f"El historial favorece a {away_name}: {away_wins} victorias en los últimos {total_h2h} cruces."
        elif home_wins == away_wins:
            h2h_line = f"Historial directo muy parejo: {home_wins}V–{away_wins}V en los últimos {total_h2h} partidos."
        if h2h_line:
            lines.append(h2h_line)

    if over25 > 65:
        lines.append(f"Se esperan goles: {over25:.0f}% de probabilidad de más de 2.5.")
    elif over25 < 35:
        lines.append(f"Partido cerrado esperado ({over25:.0f}% de +2.5 goles).")
    if btts > 62:
        lines.append(f"Ambos equipos tienen alta probabilidad de marcar ({btts:.0f}% BTTS).")

    rule_text = " ".join(lines)

    # Data summary estructurado para enviar al LLM
    summary = (
        f"Probabilidades modelo: {home_name} {h_pct:.0f}% · Empate {d_pct:.0f}% · {away_name} {a_pct:.0f}%\n"
        f"Nivel histórico (Elo): {home_name} {home_elo:.0f} vs {away_name} {away_elo:.0f} (diferencia {elo_diff:.0f})\n"
        f"Forma reciente (pts/partido): {home_name} {home_form:.1f} vs {away_name} {away_form:.1f}\n"
        f"Goles anotados/encajados promedio: {home_name} anota {home_gs:.1f} y encaja {home_gc:.1f} · "
        f"{away_name} anota {away_gs:.1f} y encaja {away_gc:.1f}\n"
        f"Mercados: +2.5 goles {over25:.0f}% · Ambos anotan {btts:.0f}%"
    )
    if h2h_line:
        summary += f"\nH2H: {h2h_line}"

    return rule_text, summary


def _neutral_stub_markets() -> dict:
    return {
        "1x2": {"home": 33.33, "draw": 33.33, "away": 33.34},
        "over15": 50.0,
        "over25": 50.0,
        "btts": 50.0,
        "dc_1x": 50.0,
        "dc_x2": 50.0,
    }


def _elo_1x2(home_elo: float, away_elo: float, neutral: bool = True) -> tuple[float, float, float]:
    """
    Probabilidades 1X2 basadas en Elo, calibradas para fútbol internacional.
    - Divisor 600 (vs 400 del ajedrez): mejor calibrado para fútbol.
    - draw decrece con la diferencia; mínimo 12% (copas del mundo son impredecibles).
    - Interpretación Elo: e = P(win) + 0.5*P(draw).

    Validado: England 1960 vs Panama 1440 → ~82% / 12% / 6%  (Draftea: 1.16 / 7.88 / 16.14)
    """
    ha = 0 if neutral else 100
    diff = (home_elo + ha) - away_elo

    e = 1 / (1 + 10 ** (-diff / 600))
    draw = max(0.12, min(0.30, 0.30 - 0.000346 * abs(diff)))

    # Piso 5%: en WC ningún equipo clasificado baja de x20 en el modelo.
    # Validado: Jordan vs Argentina → ~5% / 11% / 84% (Draftea: x17 / x7 / x1.15)
    win_h = max(0.05, e - draw / 2)
    win_a = max(0.05, (1 - e) - draw / 2)

    total = win_h + draw + win_a
    return (
        round(win_h / total * 100, 2),
        round(draw / total * 100, 2),
        round(win_a / total * 100, 2),
    )


# Competencias de selecciones nacionales que usan _elo_1x2 en lugar de XGBoost
_NAT_COMPS = {"WC", "EC", "CA", "WCQ", "EURO", "AFCON", "ACN", "GC", "CONC"}


def _predict_markets(features: np.ndarray) -> dict:
    """Aplica los 6 modelos XGBoost y devuelve el diccionario de mercados."""
    if "1x2" not in models_dict:
        return _neutral_stub_markets()

    probs_1x2 = models_dict["1x2"].predict_proba(features)[0]
    markets = {
        "1x2": {
            "home": round(float(probs_1x2[0]) * 100, 2),
            "draw": round(float(probs_1x2[1]) * 100, 2),
            "away": round(float(probs_1x2[2]) * 100, 2),
        }
    }
    for mkt in ["over15", "over25", "btts", "dc_1x", "dc_x2"]:
        if mkt in models_dict:
            p = models_dict[mkt].predict_proba(features)[0]
            markets[mkt] = round(float(p[1]) * 100, 2)
        else:
            markets[mkt] = 50.0

    return markets


def _estimate_ext_markets(home_name: str, away_name: str) -> dict:
    """Estima mercados adicionales (corners, tarjetas, goles por equipo) con Poisson."""
    import math

    def avg5(lst: list, default: float) -> float:
        r = lst[-5:]
        return sum(r) / len(r) if r else default

    def poisson_over(lam: float, k: int) -> float:
        """P(X > k) usando distribución de Poisson."""
        p_under = sum(
            math.exp(-lam) * (lam ** i) / math.factorial(i)
            for i in range(k + 1)
        )
        return round(max(0.0, min(100.0, (1 - p_under) * 100)), 1)

    def fair_odd(prob_pct: float, vig: float = 0.07) -> float:
        """Convierte probabilidad % en cuota decimal con margen de casa (~7%)."""
        p = max(1.0, min(99.0, prob_pct))
        return round(100 / p * (1 - vig), 2)

    home = _find_team(home_name)
    away = _find_team(away_name)

    if home and away:
        home_elo = home["elo"]
        away_elo = away["elo"]
        home_gs  = avg5(home.get("gs", []), 1.3)
        away_gs  = avg5(away.get("gs", []), 1.3)
        home_gc  = avg5(home.get("gc", []), 1.3)
        away_gc  = avg5(away.get("gc", []), 1.3)
        elo_diff = abs(home_elo - away_elo)
    else:
        home_elo = away_elo = 1500.0
        home_gs = away_gs = home_gc = away_gc = 1.3
        elo_diff = 0.0

    # Goles esperados por equipo (xG)
    xg_home = (home_gs + away_gc) / 2
    xg_away = (away_gs + home_gc) / 2
    xg_total = xg_home + xg_away

    # Corners (aprox: 3.8 corners por xG + base de 2.2)
    corn_h = round(xg_home * 3.8 + 2.2, 1)
    corn_a = round(xg_away * 3.4 + 2.0, 1)
    corn_t = round(corn_h + corn_a, 1)

    # Tarjetas (base ~3.5, más si es partido igualado)
    competitiveness = max(0.0, 1.0 - elo_diff / 700.0)
    cards_t = round(2.5 + competitiveness * 2.2, 1)
    cards_h = round(cards_t * 0.47, 1)
    cards_a = round(cards_t * 0.53, 1)

    c_over85  = poisson_over(corn_t, 8)
    c_over95  = poisson_over(corn_t, 9)
    c_over105 = poisson_over(corn_t, 10)
    k_over25  = poisson_over(cards_t, 2)
    k_over35  = poisson_over(cards_t, 3)
    k_over45  = poisson_over(cards_t, 4)

    gh_over05 = poisson_over(xg_home, 0)
    gh_over15 = poisson_over(xg_home, 1)
    gh_over25 = poisson_over(xg_home, 2)
    ga_over05 = poisson_over(xg_away, 0)
    ga_over15 = poisson_over(xg_away, 1)
    ga_over25 = poisson_over(xg_away, 2)
    g_over35  = poisson_over(xg_total, 3)

    return {
        # Goles por equipo
        "xg_home":             round(xg_home, 2),
        "xg_away":             round(xg_away, 2),
        "goals_home_over05":   gh_over05,
        "goals_home_over15":   gh_over15,
        "goals_home_over25":   gh_over25,
        "goals_away_over05":   ga_over05,
        "goals_away_over15":   ga_over15,
        "goals_away_over25":   ga_over25,
        "goals_over35":        g_over35,
        # Cuotas estimadas de goles por equipo (con 7% vig)
        "odd_gh_over05":       fair_odd(gh_over05),
        "odd_gh_over15":       fair_odd(gh_over15),
        "odd_gh_over25":       fair_odd(gh_over25),
        "odd_ga_over05":       fair_odd(ga_over05),
        "odd_ga_over15":       fair_odd(ga_over15),
        "odd_ga_over25":       fair_odd(ga_over25),
        # Corners
        "corners_home_avg":    corn_h,
        "corners_away_avg":    corn_a,
        "corners_total_avg":   corn_t,
        "corners_over85":      c_over85,
        "corners_over95":      c_over95,
        "corners_over105":     c_over105,
        # Cuotas estimadas de corners
        "odd_corners_over85":  fair_odd(c_over85),
        "odd_corners_over95":  fair_odd(c_over95),
        "odd_corners_over105": fair_odd(c_over105),
        # Tarjetas
        "cards_home_avg":      cards_h,
        "cards_away_avg":      cards_a,
        "cards_total_avg":     cards_t,
        "cards_over25":        k_over25,
        "cards_over35":        k_over35,
        "cards_over45":        k_over45,
        # Cuotas estimadas de tarjetas
        "odd_cards_over25":    fair_odd(k_over25),
        "odd_cards_over35":    fair_odd(k_over35),
        "odd_cards_over45":    fair_odd(k_over45),
    }


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Pronósticos Deportivos AI - API Multi-Mercado")


@app.on_event("startup")
def _log_startup():
    import sys
    # Precalentar perfiles dinámicos del torneo en curso
    _get_live_profiles()
    logger.warning(
        "[startup] main.py=%s cwd=%s python=%s team_state_equipos=%d modelos=%s live_profiles=%d",
        os.path.abspath(__file__),
        os.getcwd(),
        sys.executable,
        len(_team_state),
        list(models_dict.keys()),
        len(_live_profiles),
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Matches-Season",
        "X-Matches-Fetch",
        "X-Matches-Raw-Count",
        "X-Matches-Returned",
        "X-Team-State-Loaded",
    ],
)


@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "API Pronósticos (FastAPI) — football-data.org",
        "docs": "/docs",
        "health": "/api/health",
        "matches_live": "/api/matches/live?league_id=140",
    }


@app.get("/api/health")
def api_health():
    paths = sorted({r.path for r in app.routes if isinstance(r, APIRoute)})
    return {
        "main_py": os.path.abspath(__file__),
        "cwd": os.getcwd(),
        "team_state_equipos": len(_team_state),
        "modelos_cargados": list(models_dict.keys()),
        "api_routes": [p for p in paths if p.startswith("/api")],
    }


@app.get("/api/matches")
def get_matches(limit: int = 10, db: Session = Depends(get_db)):
    """Histórico en PostgreSQL (ETL desde CSV). Independiente de la API externa."""
    matches = (
        db.query(models.Match)
        .filter(models.Match.home_score != None)
        .order_by(models.Match.date.desc())
        .limit(limit)
        .all()
    )
    result = []
    for m in matches:
        home = db.query(models.Team).filter(models.Team.id == m.home_team_id).first()
        away = db.query(models.Team).filter(models.Team.id == m.away_team_id).first()
        result.append(
            {
                "match_id": m.id,
                "date": m.date,
                "home_team": home.name if home else "Desconocido",
                "away_team": away.name if away else "Desconocido",
                "home_score": m.home_score,
                "away_score": m.away_score,
            }
        )
    return result


@app.get("/api/predict/{match_id}")
def predict_match(match_id: int, db: Session = Depends(get_db)):
    """Predicción para un partido del histórico PostgreSQL."""
    if not models_dict:
        raise HTTPException(status_code=500, detail="Modelos AI no cargados")

    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    home = db.query(models.Team).filter(models.Team.id == match.home_team_id).first()
    away = db.query(models.Team).filter(models.Team.id == match.away_team_id).first()

    home_name = home.name if home else ""
    away_name = away.name if away else ""
    features = _compute_features(home_name, away_name)

    return {
        "match_id": match_id,
        "home_team": home_name or "Desconocido",
        "away_team": away_name or "Desconocido",
        "date": match.date,
        "features_source": "real" if _team_state else "neutral",
        "markets": _predict_markets(features),
    }


@app.get("/api/matches/live")
def get_live_matches(response: Response, league_id: int = 140, days_ahead: int = 35):
    """Próximos partidos desde football-data.org con predicciones AI reales."""
    raw_matches = fetch_upcoming_matches(league_id, days_ahead)

    if not raw_matches:
        logger.info("[matches/live] league_id=%s sin partidos en los próximos %s días (off-season o no publicados)", league_id, days_ahead)
        return []

    total_jornadas = get_total_rounds(league_id)
    features_source = "real" if _team_state else "neutral"
    result = []

    UNKNOWN = {"?", "", "tbd", "tba"}
    competition_code = LEAGUE_ID_TO_CODE.get(league_id, "")

    # 0) Pre-cargar cuotas del mercado real (1 sola llamada para toda la liga)
    sport_key = SPORT_KEY_MAP.get(competition_code, "")
    odds_list = fetch_sport_odds(sport_key) if sport_key else []

    # 1) Filtrar y preparar datos de cada partido
    prepared: list[dict] = []
    for raw in raw_matches:
        match_info = normalize_match(raw)
        home_name  = match_info["home_team"]
        away_name  = match_info["away_team"]

        if (home_name.strip().lower() in UNKNOWN or away_name.strip().lower() in UNKNOWN
                or home_name.lower().startswith("winner") or home_name.lower().startswith("loser")
                or away_name.lower().startswith("winner") or away_name.lower().startswith("loser")):
            continue

        features      = _compute_features(home_name, away_name)
        model_markets = _predict_markets(features)

        # Para selecciones nacionales el XGBoost (entrenado en clubes) da resultados
        # incorrectos. Reemplazar 1X2 con probabilidades Elo calibradas para fútbol
        # internacional (validado contra cuotas reales de Draftea/DraftKings).
        if competition_code in _NAT_COMPS:
            home_data = _find_team(home_name)
            away_data = _find_team(away_name)
            if home_data and away_data:
                wh, wd, wa = _elo_1x2(home_data["elo"], away_data["elo"], neutral=True)
                model_markets["1x2"] = {"home": wh, "draw": wd, "away": wa}

        # Cuotas reales (h2h + totals + btts en una sola búsqueda)
        real = get_all_markets_from_odds(competition_code, home_name, away_name, odds_list)
        x12     = real["x12"]
        totals  = real["totals"]   # {over15, under15, over25, ... odd_over25, ...}
        btts_mk = real["btts"]

        # Construir mercados finales: reales donde existen, modelo como fallback
        markets = dict(model_markets)

        if x12:
            markets["1x2"] = {"home": x12["home"], "draw": x12["draw"], "away": x12["away"]}

        if "over15" in totals:
            markets["over15"] = totals["over15"]
        if "over25" in totals:
            markets["over25"] = totals["over25"]
        if "over35" in totals:
            markets["over35"] = totals["over35"]

        if btts_mk:
            markets["btts"] = btts_mk["btts_yes"]

        rule_text, summary = _generate_analysis(home_name, away_name, markets)

        prepared.append({
            "match_info": match_info,
            "markets":    markets,
            "x12":        x12,
            "totals":     totals,
            "btts_mk":    btts_mk,
            "rule_text":  rule_text,
            "summary":    summary,
        })

    # 2) DeepSeek en paralelo
    def _fetch_deepseek(item: dict) -> str:
        mi = item["match_info"]
        return _call_deepseek(mi["match_id"], mi["home_team"], mi["away_team"], item["summary"])

    deepseek_results: dict[int, str] = {}
    if DEEPSEEK_API_KEY and prepared:
        with ThreadPoolExecutor(max_workers=6) as pool:
            futures = {pool.submit(_fetch_deepseek, p): p["match_info"]["match_id"] for p in prepared}
            for future in as_completed(futures):
                mid = futures[future]
                try:
                    deepseek_results[mid] = future.result()
                except Exception as exc:
                    logger.warning("[DeepSeek] match_id=%s error: %s", mid, exc)

    # 3) Construir respuesta final
    for p in prepared:
        mi       = p["match_info"]
        mid      = mi["match_id"]
        ds_text  = deepseek_results.get(mid, "")
        analysis = ds_text if ds_text else p["rule_text"]
        x12      = p["x12"]
        totals   = p["totals"]
        btts_mk  = p["btts_mk"]
        has_odds = bool(x12)

        # Cuotas decimales para mostrar en el frontend
        odds_raw = None
        if x12:
            odds_raw = {
                "home":       x12["home_odd"],
                "draw":       x12["draw_odd"],
                "away":       x12["away_odd"],
                "bookmaker":  x12["bookmaker"],
            }

        # Cuotas de mercados de goles para mostrar en el frontend
        totals_raw = {
            k: v for k, v in totals.items() if k.startswith("odd_")
        } if totals else {}
        if totals_raw and x12:
            totals_raw["bookmaker"] = x12["bookmaker"]

        btts_raw = None
        if btts_mk:
            btts_raw = {
                "yes": btts_mk["odd_yes"],
                "no":  btts_mk["odd_no"],
            }

        result.append({
            **mi,
            "total_jornadas":  total_jornadas,
            "round":           f"Regular Season - {mi['jornada']}" if mi.get("jornada") else None,
            "markets":         p["markets"],
            "ext_markets":     _estimate_ext_markets(mi["home_team"], mi["away_team"]),
            "odds_raw":        odds_raw,
            "totals_raw":      totals_raw if totals_raw else None,
            "btts_raw":        btts_raw,
            "analysis":        analysis,
            "features_source": "odds" if has_odds else features_source,
        })

    response.headers["X-Matches-Raw-Count"] = str(len(raw_matches))
    response.headers["X-Matches-Returned"] = str(len(result))
    response.headers["X-Team-State-Loaded"] = str(len(_team_state) > 0).lower()

    return result


@app.get("/api/debug/matches-live")
def debug_matches_live(league_id: int = 140, days_ahead: int = 35):
    """Diagnóstico: muestra qué devuelve football-data.org sin procesamiento AI."""
    from api_client import LEAGUE_ID_TO_CODE, _headers, FOOTBALL_DATA_BASE
    from datetime import datetime, timedelta, timezone

    code = LEAGUE_ID_TO_CODE.get(league_id)
    now = datetime.now(timezone.utc)
    date_from = now.strftime("%Y-%m-%d")
    date_to = (now + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

    sample = []
    errors = []

    for status in ("SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"):
        url = f"{FOOTBALL_DATA_BASE}/competitions/{code}/matches"
        params = {"status": status, "dateFrom": date_from, "dateTo": date_to}
        try:
            resp = requests.get(url, headers=_headers(), params=params, timeout=20)
            resp.raise_for_status()
            matches = resp.json().get("matches", [])
            for m in matches[:3]:
                sample.append(
                    {
                        "id": m.get("id"),
                        "status": m.get("status"),
                        "matchday": m.get("matchday"),
                        "utcDate": m.get("utcDate"),
                        "home": (m.get("homeTeam") or {}).get("name"),
                        "away": (m.get("awayTeam") or {}).get("name"),
                    }
                )
        except Exception as e:
            errors.append({"status_filter": status, "error": str(e)})

    return {
        "competition_code": code,
        "league_id": league_id,
        "date_from": date_from,
        "date_to": date_to,
        "team_state_equipos": len(_team_state),
        "modelos_cargados": list(models_dict.keys()),
        "sample_matches": sample[:10],
        "errors": errors,
    }


@app.get("/api/competitions/{league_id}/scorers")
def get_competition_scorers(league_id: int, limit: int = 30):
    """Top goleadores de la competición con estadísticas estimadas para mercados de jugadores."""
    import math
    from api_client import LEAGUE_ID_TO_CODE, _headers, FOOTBALL_DATA_BASE

    code = LEAGUE_ID_TO_CODE.get(league_id)
    if not code:
        raise HTTPException(status_code=404, detail="Competición no encontrada")

    try:
        resp = requests.get(
            f"{FOOTBALL_DATA_BASE}/competitions/{code}/scorers",
            headers=_headers(),
            params={"limit": limit},
            timeout=15,
        )
        if resp.status_code == 403:
            return []
        resp.raise_for_status()
        raw = resp.json().get("scorers", [])
    except Exception as e:
        logger.warning("[scorers] Error para %s: %s", code, e)
        return []

    players = []
    for s in raw:
        player  = s.get("player") or {}
        team    = s.get("team") or {}
        goals   = s.get("goals") or 0
        assists = s.get("assists") or 0
        played  = s.get("playedMatches") or 1
        penalties = s.get("penalties") or 0

        gpg = goals / played          # goles por partido
        apg = assists / played        # asistencias por partido

        # Estimaciones para mercados de apuestas (basadas en conversión típica del fútbol)
        shots_pg    = round(gpg / 0.11, 1) if gpg > 0 else round(1.5 + goals * 0.05, 1)
        shots_ot_pg = round(shots_pg * 0.38, 1)
        fouls_pg    = round(1.2 + (1 - min(gpg, 1)) * 0.8, 1)
        cards_pg    = round(fouls_pg * 0.12, 1)

        # Probabilidades para mercados Draftea
        def p_over(lam: float, k: int) -> float:
            p_under = sum(
                math.exp(-lam) * (lam ** i) / math.factorial(i)
                for i in range(k + 1)
            )
            return round(max(0.0, min(100.0, (1 - p_under) * 100)), 1)

        players.append({
            "id":           player.get("id"),
            "name":         player.get("name") or "Desconocido",
            "position":     player.get("position") or "Unknown",
            "nationality":  player.get("nationality") or "",
            "team":         team.get("name") or "",
            "team_id":      team.get("id"),
            # Totales reales
            "goals":        goals,
            "assists":      assists,
            "played":       played,
            "penalties":    penalties,
            # Por partido (reales calculados)
            "goals_pg":     round(gpg, 2),
            "assists_pg":   round(apg, 2),
            # Estimaciones para mercados
            "shots_pg":     shots_pg,
            "shots_ot_pg":  shots_ot_pg,
            "fouls_pg":     fouls_pg,
            "cards_pg":     cards_pg,
            # Probabilidades clave
            "prob_goal":    p_over(gpg, 0),
            "prob_shot15":  p_over(shots_pg, 1),
            "prob_shot25":  p_over(shots_pg, 2),
            "prob_card":    round(min(cards_pg * 100, 35.0), 1),
        })

    return players
