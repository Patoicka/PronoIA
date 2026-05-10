import logging
from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session
from database import get_db
from dotenv import load_dotenv
import models
import joblib
import pandas as pd
import numpy as np
import os
import re
import requests
from datetime import datetime, timedelta, timezone

load_dotenv()

logger = logging.getLogger(__name__)

API_FOOTBALL_BASE = "https://v3.football.api-sports.io"
ROUND_NUM_RE = re.compile(r"(\d+)\s*$")
UPCOMING_STATUSES = frozenset({"NS", "TBD", "PST", "1H", "HT", "2H", "ET", "BT", "P", "LIVE"})
FINISHED_STATUSES = frozenset({"FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "INT"})


def _season_start_year_europe(dt: datetime | None = None) -> int:
    """Temporada julio–junio (p. ej. La Liga): jul–dic = año calendario; ene–jun = año anterior."""
    dt = dt or datetime.now(timezone.utc)
    return dt.year if dt.month >= 7 else dt.year - 1


def current_api_football_season() -> int:
    """Año `season` para API-Football: siempre la competición en curso (25/26 → 2025). No usar temporadas pasadas salvo .env de emergencia."""
    override = (os.getenv("API_FOOTBALL_SEASON") or "").strip()
    if override.isdigit():
        return int(override)
    return _season_start_year_europe(datetime.now(timezone.utc))


def _parse_round_number(round_label: str | None) -> int | None:
    if not round_label:
        return None
    m = ROUND_NUM_RE.search(round_label.strip())
    return int(m.group(1)) if m else None


def _fetch_total_rounds(league_id: int, season: int, headers: dict) -> int:
    url = f"{API_FOOTBALL_BASE}/fixtures/rounds?league={league_id}&season={season}"
    try:
        data = requests.get(url, headers=headers, timeout=20).json()
        rounds = data.get("response") or []
        return len(rounds) if rounds else 38
    except Exception:
        return 38


def _fixture_dt_utc(iso: str | None) -> datetime | None:
    if not iso:
        return None
    s = iso.replace("Z", "+00:00")
    return datetime.fromisoformat(s)


def _fixtures_from_api(url: str, headers: dict) -> list:
    http = requests.get(url, headers=headers, timeout=25)
    http.raise_for_status()
    res = http.json()
    if res.get("errors"):
        raise HTTPException(status_code=500, detail=str(res["errors"]))
    return res.get("response") or []


def _neutral_stub_markets() -> dict:
    """Si no hay modelos .pkl cargados, la UI sigue mostrando partidos con probabilidades neutras."""
    return {
        "1x2": {"home": 33.33, "draw": 33.33, "away": 33.34},
        "over15": 50.0,
        "over25": 50.0,
        "btts": 50.0,
        "dc_1x": 50.0,
        "dc_x2": 50.0,
    }


app = FastAPI(title="Pronósticos Deportivos AI - API Multi-Mercado")


@app.on_event("startup")
def _log_startup_paths():
    """Confirma qué código está ejecutando uvicorn (evita otra carpeta o main.py distinto)."""
    import sys

    logger.warning(
        "[startup] main.py=%s cwd=%s python=%s",
        os.path.abspath(__file__),
        os.getcwd(),
        sys.executable,
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Matches-Live-Season",
        "X-Matches-Live-Fetch",
        "X-Matches-Live-Raw-Count",
        "X-Matches-Live-Returned",
        "X-Matches-Live-First-Date",
    ],
)

# Cargar los 6 modelos V3
models_dict = {}
model_names = ['1x2', 'over15', 'over25', 'btts', 'dc_1x', 'dc_x2']

for name in model_names:
    path = f'data/processed/models/xgb_{name}.pkl'
    if os.path.exists(path):
        models_dict[name] = joblib.load(path)
    else:
        print(f"ADVERTENCIA: Modelo {name} no encontrado en {path}")

@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "API Pronósticos (FastAPI)",
        "docs": "/docs",
        "health": "/api/health",
        "matches_live": "/api/matches/live?league_id=140",
        "debug_fixtures": "/api/debug/matches-live?league_id=140",
        "debug_fixtures_alt": "/api/matches/live/debug?league_id=140",
    }


@app.get("/api/health")
def api_health():
    """Comprueba que este código es el que corre: lista rutas `/api/*` y ruta absoluta de main.py."""
    paths = sorted({r.path for r in app.routes if isinstance(r, APIRoute)})
    return {
        "main_py": os.path.abspath(__file__),
        "cwd": os.getcwd(),
        "has_debug_matches_live": "/api/debug/matches-live" in paths,
        "api_routes": [p for p in paths if p.startswith("/api")],
    }

@app.get("/api/matches")
def get_matches(limit: int = 10, db: Session = Depends(get_db)):
    """Histórico en PostgreSQL (ETL desde CSV). Independiente de API-Football; no es el calendario en vivo."""
    matches = db.query(models.Match).filter(models.Match.home_score != None).order_by(models.Match.date.desc()).limit(limit).all()
    result = []
    for m in matches:
        home = db.query(models.Team).filter(models.Team.id == m.home_team_id).first()
        away = db.query(models.Team).filter(models.Team.id == m.away_team_id).first()
        result.append({
            "match_id": m.id,
            "date": m.date,
            "home_team": home.name if home else "Desconocido",
            "away_team": away.name if away else "Desconocido",
            "home_score": m.home_score,
            "away_score": m.away_score
        })
    return result

@app.get("/api/predict/{match_id}")
def predict_match(match_id: int, db: Session = Depends(get_db)):
    """Predicción por `match_id` de la base local (CSV/ETL). Los IDs de API-Football no coinciden con esta tabla."""
    if not models_dict:
        raise HTTPException(status_code=500, detail="Modelos AI no cargados")
        
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
        
    home = db.query(models.Team).filter(models.Team.id == match.home_team_id).first()
    away = db.query(models.Team).filter(models.Team.id == match.away_team_id).first()
    
    # Vector V3 simulado para que la UI funcione
    mock_features = np.array([[
        1600.0, 1500.0, 100.0, # Elo
        7, 7, # Rest
        2.1, 1.2, # Form
        1.8, 1.1, # GS
        0.8, 1.4, # GC
        0.6 # H2H
    ]])
    
    response = {
        "match_id": match_id,
        "home_team": home.name if home else "Desconocido",
        "away_team": away.name if away else "Desconocido",
        "date": match.date,
        "markets": {}
    }
    
    if '1x2' in models_dict:
        probs = models_dict['1x2'].predict_proba(mock_features)[0]
        response["markets"]["1x2"] = {
            "home": round(float(probs[0]) * 100, 2),
            "draw": round(float(probs[1]) * 100, 2),
            "away": round(float(probs[2]) * 100, 2)
        }
        
    for m in ['over15', 'over25', 'btts', 'dc_1x', 'dc_x2']:
        if m in models_dict:
            probs = models_dict[m].predict_proba(mock_features)[0]
            # La clase 1 es "True" (ej. Sí hubo más de 1.5 goles)
            response["markets"][m] = round(float(probs[1]) * 100, 2)
            
    return response

@app.get("/api/debug/matches-live")
@app.get("/api/matches/live/debug")
def debug_matches_live_context(league_id: int = 140, days_ahead: int = 35):
    """Diagnóstico: temporada calculada, URLs usadas (sin clave) y muestra de la respuesta cruda de API-Football."""
    API_KEY = os.getenv("API_FOOTBALL_KEY")
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API_FOOTBALL_KEY no configurada")

    headers = {"x-apisports-key": API_KEY}
    now = datetime.now(timezone.utc)
    season_year = current_api_football_season()
    next_n = min(50, max(10, int(days_ahead)))
    env_season = (os.getenv("API_FOOTBALL_SEASON") or "").strip() or None

    url_next = (
        f"{API_FOOTBALL_BASE}/fixtures?league={league_id}&season={season_year}"
        f"&timezone=UTC&next={next_n}"
    )
    date_from = now.strftime("%Y-%m-%d")
    date_to = (now + timedelta(days=max(7, days_ahead))).strftime("%Y-%m-%d")
    url_range = (
        f"{API_FOOTBALL_BASE}/fixtures?league={league_id}&season={season_year}"
        f"&timezone=UTC&from={date_from}&to={date_to}"
    )

    def _sample(rows: list, n: int = 5):
        out = []
        for f in rows[:n]:
            fx = f.get("fixture") or {}
            lg = f.get("league") or {}
            th = (f.get("teams") or {}).get("home") or {}
            ta = (f.get("teams") or {}).get("away") or {}
            st = (fx.get("status") or {}).get("short")
            out.append(
                {
                    "fixture_id": fx.get("id"),
                    "date": fx.get("date"),
                    "status": st,
                    "api_league_season": lg.get("season"),
                    "round": lg.get("round"),
                    "home": th.get("name"),
                    "away": ta.get("name"),
                }
            )
        return out

    raw: list = []
    err_next: str | None = None
    err_range: str | None = None
    source = "fixtures_next"
    url_effective = url_next

    try:
        raw = _fixtures_from_api(url_next, headers)
    except Exception as e:
        err_next = repr(e)
        raw = []

    if not raw:
        source = "fixtures_date_range"
        url_effective = url_range
        try:
            raw = _fixtures_from_api(url_range, headers)
        except Exception as e2:
            err_range = repr(e2)
            return {
                "main_py": os.path.abspath(__file__),
                "cwd": os.getcwd(),
                "now_utc": now.isoformat(),
                "season_year_used": season_year,
                "API_FOOTBALL_SEASON_env": env_season,
                "source": source,
                "url_effective": url_effective,
                "url_next": url_next,
                "url_range": url_range,
                "error_next": err_next,
                "error_range": err_range,
                "raw_count": 0,
                "raw_sample": [],
            }

    return {
        "main_py": os.path.abspath(__file__),
        "cwd": os.getcwd(),
        "now_utc": now.isoformat(),
        "season_year_used": season_year,
        "API_FOOTBALL_SEASON_env": env_season,
        "source": source,
        "url_effective": url_effective,
        "url_next": url_next,
        "url_range": url_range,
        "error_next": err_next,
        "error_range": err_range,
        "raw_count": len(raw),
        "raw_sample": _sample(raw),
    }


@app.get("/api/matches/live")
def get_live_matches(response: Response, league_id: int = 140, days_ahead: int = 35):
    """Próximos partidos solo desde API-Football (HTTP). No lee PostgreSQL ni CSV; no hay mezcla con el ETL."""
    API_KEY = os.getenv("API_FOOTBALL_KEY")
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API_FOOTBALL_KEY no configurada")

    headers = {"x-apisports-key": API_KEY}
    now = datetime.now(timezone.utc)
    season_year = current_api_football_season()
    next_n = min(50, max(10, int(days_ahead)))
    env_override = (os.getenv("API_FOOTBALL_SEASON") or "").strip() or None

    total_rounds = _fetch_total_rounds(league_id, season_year, headers)

    # `next` devuelve los siguientes partidos programados de la liga/temporada (evita rangos de fechas viejos).
    url_next = (
        f"{API_FOOTBALL_BASE}/fixtures?league={league_id}&season={season_year}"
        f"&timezone=UTC&next={next_n}"
    )
    fetch_source = "fixtures_next"
    try:
        raw = _fixtures_from_api(url_next, headers)
    except requests.RequestException as e:
        logger.exception("[matches/live] fallo petición next: %s", url_next)
        raise HTTPException(status_code=502, detail=f"Error al contactar API-Football: {e!s}") from e

    if not raw:
        date_from = now.strftime("%Y-%m-%d")
        date_to = (now + timedelta(days=max(7, days_ahead))).strftime("%Y-%m-%d")
        url_range = (
            f"{API_FOOTBALL_BASE}/fixtures?league={league_id}&season={season_year}"
            f"&timezone=UTC&from={date_from}&to={date_to}"
        )
        fetch_source = "fixtures_date_range"
        logger.warning(
            "[matches/live] next devolvió 0 filas; usando rango from=%s to=%s league=%s season=%s",
            date_from,
            date_to,
            league_id,
            season_year,
        )
        try:
            raw = _fixtures_from_api(url_range, headers)
        except requests.RequestException as e:
            logger.exception("[matches/live] fallo petición rango: %s", url_range)
            raise HTTPException(status_code=502, detail=f"Error al contactar API-Football: {e!s}") from e

    logger.warning(
        "[matches/live] league_id=%s season_year=%s next_n=%s API_FOOTBALL_SEASON_env=%r fetch=%s raw_count=%s",
        league_id,
        season_year,
        next_n,
        env_override,
        fetch_source,
        len(raw),
    )
    for i, f in enumerate(raw[:5]):
        fx = f.get("fixture") or {}
        lg = f.get("league") or {}
        th = (f.get("teams") or {}).get("home") or {}
        ta = (f.get("teams") or {}).get("away") or {}
        logger.warning(
            "[matches/live] raw[%s] id=%s date=%s status=%s api_league_season=%s round=%r %s vs %s",
            i,
            fx.get("id"),
            fx.get("date"),
            (fx.get("status") or {}).get("short"),
            lg.get("season"),
            lg.get("round"),
            th.get("name"),
            ta.get("name"),
        )

    matches = []
    mock_features = np.array([[1600.0, 1500.0, 100.0, 7, 7, 1.5, 1.5, 1.5, 1.2, 1.0, 1.5, 0.5]])

    skipped = {"finished": 0, "bad_status": 0, "season_mismatch": 0, "stale_ns": 0}

    for f in raw:
        fixture = f["fixture"]
        teams = f["teams"]
        league_block = f.get("league") or {}
        status_short = (fixture.get("status") or {}).get("short") or ""

        if status_short in FINISHED_STATUSES:
            skipped["finished"] += 1
            continue
        if status_short not in UPCOMING_STATUSES:
            skipped["bad_status"] += 1
            continue

        api_season_row = league_block.get("season")
        if api_season_row is not None and int(api_season_row) != int(season_year):
            skipped["season_mismatch"] += 1
            continue

        kickoff = _fixture_dt_utc(fixture.get("date"))
        if kickoff and status_short in ("NS", "TBD") and kickoff < now - timedelta(hours=2):
            skipped["stale_ns"] += 1
            continue

        round_label = league_block.get("round")
        jornada = _parse_round_number(round_label)

        markets = {}
        if "1x2" in models_dict:
            probs = models_dict["1x2"].predict_proba(mock_features)[0]
            markets["1x2"] = {
                "home": round(float(probs[0]) * 100, 2),
                "draw": round(float(probs[1]) * 100, 2),
                "away": round(float(probs[2]) * 100, 2),
            }
        for m in ["over15", "over25", "btts", "dc_1x", "dc_x2"]:
            if m in models_dict:
                probs = models_dict[m].predict_proba(mock_features)[0]
                markets[m] = round(float(probs[1]) * 100, 2)

        if "1x2" not in markets:
            markets = _neutral_stub_markets()
        else:
            for m in ["over15", "over25", "btts", "dc_1x", "dc_x2"]:
                if m not in markets:
                    markets[m] = 50.0

        venue = fixture.get("venue") or {}
        matches.append(
            {
                "match_id": fixture["id"],
                "date": fixture["date"],
                "api_season": season_year,
                "status": status_short,
                "round": round_label,
                "jornada": jornada,
                "total_jornadas": total_rounds,
                "home_team": teams["home"]["name"],
                "away_team": teams["away"]["name"],
                "home_logo": teams["home"]["logo"],
                "away_logo": teams["away"]["logo"],
                "referee": fixture.get("referee") or "Por definir",
                "venue": venue.get("name") or "",
                "markets": markets,
            }
        )

    def sort_key(item: dict):
        j = item.get("jornada")
        return (j if isinstance(j, int) else 9999, item.get("date") or "")

    matches.sort(key=sort_key)

    logger.warning(
        "[matches/live] tras filtros: returned=%s skipped=%s",
        len(matches),
        skipped,
    )

    response.headers["X-Matches-Live-Season"] = str(season_year)
    response.headers["X-Matches-Live-Fetch"] = fetch_source
    response.headers["X-Matches-Live-Raw-Count"] = str(len(raw))
    response.headers["X-Matches-Live-Returned"] = str(len(matches))
    if raw:
        fx0 = raw[0].get("fixture") or {}
        response.headers["X-Matches-Live-First-Date"] = str(fx0.get("date") or "")[:32]

    return matches
