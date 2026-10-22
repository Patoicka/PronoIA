import os
import time
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

FOOTBALL_DATA_BASE = "https://api.football-data.org/v4"
FOOTBALL_DATA_TOKEN = os.getenv("FOOTBALL_DATA_TOKEN", "")

# Ventana y caché de fixtures (PR 2 del plan)
DEFAULT_DAYS_AHEAD = 35
MAX_DAYS_AHEAD = 45
# TTL 5–15 min; default 10 min. Override: FIXTURES_CACHE_TTL (segundos).
_raw_ttl = int(os.getenv("FIXTURES_CACHE_TTL", "600"))
FIXTURES_CACHE_TTL = max(300, min(_raw_ttl, 900))

UPCOMING_STATUSES = frozenset({"SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"})

LEAGUE_ID_TO_CODE = {
    1:   "WC",   # FIFA World Cup 2026
    39:  "PL",   # Premier League
    140: "PD",   # La Liga
    135: "SA",   # Serie A
    78:  "BL1",  # Bundesliga
    61:  "FL1",  # Ligue 1
    2:   "CL",   # Champions League
    3:   "EL",   # Europa League
}

COMPETITION_ROUNDS = {
    "WC":  7,   # 3 fase de grupos + 4 rondas eliminatorias
    "PL":  38,
    "PD":  38,
    "SA":  38,
    "BL1": 34,
    "FL1": 34,
    "CL":  8,
    "EL":  8,
}

# Etiquetas en español para las fases del Mundial (y otras competiciones)
STAGE_LABELS: dict[str, str] = {
    "GROUP_STAGE":    "Fase de Grupos",
    "LAST_32":        "Dieciseisavos de Final",
    "ROUND_OF_16":    "Octavos de Final",
    "QUARTER_FINALS": "Cuartos de Final",
    "SEMI_FINALS":    "Semifinales",
    "THIRD_PLACE":    "Tercer Lugar",
    "FINAL":          "Final",
}

STATUS_MAP = {
    "SCHEDULED": "NS",
    "TIMED":     "NS",
    "IN_PLAY":   "LIVE",
    "PAUSED":    "HT",
    "FINISHED":  "FT",
    "POSTPONED": "PST",
    "SUSPENDED": "PST",
    "CANCELLED": "CANC",
}

# Caché en memoria: key=(league_id, days_ahead) → (expires_at, matches)
_fixtures_cache: dict[tuple[int, int], tuple[float, list[dict]]] = {}
_fixtures_cache_stats: dict = {
    "hits": 0,
    "misses": 0,
    "entries": 0,
}
_last_fetch_meta: dict = {
    "cache_hit": False,
    "league_id": None,
    "days_ahead": None,
    "ttl_seconds": FIXTURES_CACHE_TTL,
    "match_count": 0,
    "upstream_calls": 0,
}


def clamp_days_ahead(days_ahead: int) -> int:
    """Limita la ventana a [1, MAX_DAYS_AHEAD] (default de producto = 35)."""
    try:
        value = int(days_ahead)
    except (TypeError, ValueError):
        value = DEFAULT_DAYS_AHEAD
    return max(1, min(value, MAX_DAYS_AHEAD))


def get_fixtures_cache_info() -> dict:
    """Resumen para /api/health."""
    now = time.time()
    alive = sum(1 for exp, _ in _fixtures_cache.values() if exp > now)
    return {
        "ttl_seconds": FIXTURES_CACHE_TTL,
        "default_days_ahead": DEFAULT_DAYS_AHEAD,
        "max_days_ahead": MAX_DAYS_AHEAD,
        "entries": alive,
        "hits": _fixtures_cache_stats["hits"],
        "misses": _fixtures_cache_stats["misses"],
        "last_fetch": dict(_last_fetch_meta),
    }


def get_last_fixtures_fetch_meta() -> dict:
    return dict(_last_fetch_meta)


def _headers() -> dict:
    return {"X-Auth-Token": FOOTBALL_DATA_TOKEN}


def _fetch_upcoming_from_api(league_id: int, days_ahead: int) -> tuple[list[dict], int]:
    """
    Una sola llamada a football-data (rango de fechas, sin filtrar status en query).
    Filtra en cliente SCHEDULED/TIMED/IN_PLAY/PAUSED — evita 4 requests por refresh.
    """
    code = LEAGUE_ID_TO_CODE.get(league_id)
    if not code:
        return [], 0

    now = datetime.now(timezone.utc)
    date_from = now.strftime("%Y-%m-%d")
    date_to = (now + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

    url = f"{FOOTBALL_DATA_BASE}/competitions/{code}/matches"
    params = {"dateFrom": date_from, "dateTo": date_to}
    upstream_calls = 0

    try:
        resp = requests.get(url, headers=_headers(), params=params, timeout=20)
        upstream_calls = 1
        if resp.status_code == 401:
            print("[football-data.org] Token inválido (401) — verifica FOOTBALL_DATA_TOKEN en .env")
            return [], upstream_calls
        if resp.status_code == 403:
            print(
                f"[football-data.org] Acceso denegado (403) para {code} — "
                "la competición puede requerir un plan superior"
            )
            return [], upstream_calls
        if resp.status_code == 429:
            print("[football-data.org] Rate limit excedido (429) — espera un minuto")
            return [], upstream_calls
        resp.raise_for_status()
        raw_list = resp.json().get("matches", [])
    except requests.RequestException as e:
        print(f"[football-data.org] Error al obtener partidos para {code}: {e}")
        return [], upstream_calls

    all_matches = [m for m in raw_list if m.get("status") in UPCOMING_STATUSES]

    seen: set = set()
    unique: list[dict] = []
    for m in all_matches:
        mid = m.get("id")
        if mid is None or mid in seen:
            continue
        seen.add(mid)
        unique.append(m)

    unique.sort(key=lambda m: (m.get("matchday") or 9999, m.get("utcDate") or ""))
    return unique, upstream_calls


def fetch_upcoming_matches(league_id: int, days_ahead: int = DEFAULT_DAYS_AHEAD) -> list[dict]:
    """
    Próximos partidos (programados + en vivo) con caché en memoria
    keyed por (league_id, days_ahead).
    """
    days_ahead = clamp_days_ahead(days_ahead)
    key = (int(league_id), days_ahead)
    now = time.time()

    cached = _fixtures_cache.get(key)
    if cached and cached[0] > now:
        matches = cached[1]
        _fixtures_cache_stats["hits"] += 1
        _last_fetch_meta.update(
            {
                "cache_hit": True,
                "league_id": league_id,
                "days_ahead": days_ahead,
                "ttl_seconds": FIXTURES_CACHE_TTL,
                "match_count": len(matches),
                "upstream_calls": 0,
            }
        )
        return list(matches)

    matches, upstream_calls = _fetch_upcoming_from_api(league_id, days_ahead)
    _fixtures_cache[key] = (now + FIXTURES_CACHE_TTL, matches)
    _fixtures_cache_stats["misses"] += 1
    _fixtures_cache_stats["entries"] = len(_fixtures_cache)
    _last_fetch_meta.update(
        {
            "cache_hit": False,
            "league_id": league_id,
            "days_ahead": days_ahead,
            "ttl_seconds": FIXTURES_CACHE_TTL,
            "match_count": len(matches),
            "upstream_calls": upstream_calls,
        }
    )
    return list(matches)


def get_total_rounds(league_id: int) -> int:
    code = LEAGUE_ID_TO_CODE.get(league_id, "")
    return COMPETITION_ROUNDS.get(code, 38)


def normalize_match(raw: dict) -> dict:
    """Convierte el formato de football-data.org al formato interno del frontend."""
    home      = raw.get("homeTeam") or {}
    away      = raw.get("awayTeam") or {}
    referees  = raw.get("referees") or []
    fd_status = raw.get("status", "SCHEDULED")
    stage     = raw.get("stage") or ""

    return {
        "match_id":   raw["id"],
        "date":       raw.get("utcDate"),
        "status":     STATUS_MAP.get(fd_status, "NS"),
        "stage":      stage,
        "stage_label": STAGE_LABELS.get(stage, ""),
        "jornada":    raw.get("matchday"),
        "home_team":  home.get("name") or home.get("shortName") or "?",
        "away_team":  away.get("name") or away.get("shortName") or "?",
        "home_logo":  home.get("crest") or "",
        "away_logo":  away.get("crest") or "",
        "referee":    referees[0]["name"] if referees else "Por definir",
        "venue":      "",
    }


def test_connection() -> bool:
    if not FOOTBALL_DATA_TOKEN:
        print("[ERROR] FOOTBALL_DATA_TOKEN no configurado en .env")
        return False
    try:
        resp = requests.get(f"{FOOTBALL_DATA_BASE}/competitions", headers=_headers(), timeout=10)
        if resp.status_code == 200:
            n = len(resp.json().get("competitions", []))
            print(f"[EXITO] Conexion exitosa — {n} competiciones disponibles")
            return True
        print(f"[ERROR] Status {resp.status_code}")
        return False
    except Exception as e:
        print(f"[ERROR] {e}")
        return False


if __name__ == "__main__":
    test_connection()
