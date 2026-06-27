import os
import requests
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

FOOTBALL_DATA_BASE = "https://api.football-data.org/v4"
FOOTBALL_DATA_TOKEN = os.getenv("FOOTBALL_DATA_TOKEN", "")

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


def _headers() -> dict:
    return {"X-Auth-Token": FOOTBALL_DATA_TOKEN}


def fetch_upcoming_matches(league_id: int, days_ahead: int = 35) -> list[dict]:
    """Obtiene partidos programados + en vivo para la competición indicada."""
    code = LEAGUE_ID_TO_CODE.get(league_id)
    if not code:
        return []

    now = datetime.now(timezone.utc)
    date_from = now.strftime("%Y-%m-%d")
    date_to = (now + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

    all_matches: list[dict] = []

    for status in ("SCHEDULED", "TIMED", "IN_PLAY", "PAUSED"):
        url = f"{FOOTBALL_DATA_BASE}/competitions/{code}/matches"
        params = {"status": status, "dateFrom": date_from, "dateTo": date_to}
        try:
            resp = requests.get(url, headers=_headers(), params=params, timeout=20)
            if resp.status_code == 401:
                print("[football-data.org] Token inválido (401) — verifica FOOTBALL_DATA_TOKEN en .env")
                break
            if resp.status_code == 403:
                print(f"[football-data.org] Acceso denegado (403) para {code} — la competición puede requerir un plan superior")
                break
            if resp.status_code == 429:
                print("[football-data.org] Rate limit excedido (429) — espera un minuto")
                break
            resp.raise_for_status()
            all_matches.extend(resp.json().get("matches", []))
        except requests.RequestException as e:
            print(f"[football-data.org] Error al obtener {status} para {code}: {e}")

    # Deduplicar
    seen: set = set()
    unique: list[dict] = []
    for m in all_matches:
        if m["id"] not in seen:
            seen.add(m["id"])
            unique.append(m)

    unique.sort(key=lambda m: (m.get("matchday") or 9999, m.get("utcDate") or ""))
    return unique


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
