# Plan de trabajo — Kronos (PronoIA)

Documento para retomar en el IDE. Vive en la **raíz del monorepo** (no dentro de `Pronosticos-front/` ni `Pronosticos-back/`).

**Rama principal:** `main`  
**Marca de producto:** Kronos (ProPredict = nombre legacy en tracking viejo)  
**Preferencias UI:** profesional, limpio, colores llamativos sin saturar, sin huecos muertos ni componentes que estorben (*Nightboard* denso).

---

## Dónde estamos (en `main`)

### Ya mergeado

| Qué | PR | Notas |
|-----|-----|--------|
| Tokens / tipografía / spacing Nightboard | [#2](https://github.com/Patoicka/PronoIA/pull/2) | `index.css`, Layout, Navbar |
| Dashboard Kronos compacto | [#4](https://github.com/Patoicka/PronoIA/pull/4) | Home marca + CTA; sin KPI theater |
| Secrets + CORS desde env | [#1](https://github.com/Patoicka/PronoIA/pull/1) | `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`, `.env.example` |
| Caché fixtures football-data | [#3](https://github.com/Patoicka/PronoIA/pull/3) | TTL memoria, 1 call/miss, tope `days_ahead` 45, headers HIT/MISS |

### Arranque local (back)

1. `cp Pronosticos-back/.env.example Pronosticos-back/.env` y rellenar.
2. `cd Pronosticos-back && docker compose up -d db`
3. API con vars de entorno cargadas (sin `.env` falla a propósito).

---

## Qué falta (orden del plan)

Fuente de verdad detallada: plan de PRs del proyecto Cursor (espejo abajo). Resumen accionable:

### Ahora — siguientes

| # | Carril | Trabajo | Notas |
|---|--------|---------|--------|
| **A** | Back | **Odds API:** una región + health de cuota | No quemar créditos `markets × regions` |
| **B** | UI | **Predictions + MatchCard densos** | Sin card-madre; filas compactas; tabs sobrios |
| **C** | UI | **MatchModal jerarquizado** | 1X2 + pick primero; tabs Goles/Más/Análisis; sin emojis |
| **D** | Full | **DeepSeek lazy + caché por `match_id`** | No en `/matches/live`; 1ª carga al abrir análisis; **reabrir = cache hit, no regenerar** |
| **E** | UI | **Secundarias honestas** | Leagues disclaimer/empty; Stats stub/oculto; Profile/Login tokens |
| **F** | Docs | Tracking + README Kronos + runbook ML | Tras cerrar bloque Ahora |

**Paralelo útil:** A (Odds) ∥ B (Predictions).  
**Coordinar:** C (Modal) + D (DeepSeek) — el modal deja zona Análisis; DeepSeek la alimenta lazy+caché.

### Luego

- Cliente API único en front + limpiar Redux/axios muertos  
- Separar mercados **modelo vs bookmaker** (API + badges UI)  
- Atmósfera / motion / mobile polish  
- Routers FastAPI fuera de `main.py`  
- Standings reales → Leagues  
- Métricas ML (Brier/log-loss) + metadata de modelos  

### Futuro

- Compose `api`+`db`, puerto único  
- Persistencia predicciones del día + Stats reales  
- Picks de usuario (auth con valor; browse público)  
- Prefetch cron + rate-limit  
- CI smoke + tipos OpenAPI  

---

## Preferencias / invariantes

1. **DeepSeek:** lazy (solo al abrir modal/análisis) + **caché por `match_id`** (no regenerar al reabrir). Fallback rule-based.  
2. **Dashboard:** ya hecho en `main` — no reabrir como epic; solo bugs.  
3. **Diseño:** densidad profesional; cards solo si hay interacción; Kronos hero-level en home (ya); ámbar puntual.  
4. **No mezclar** en un mismo PR: secrets/caché back con rediseño UI (salvo conflicto de merge).  

---

## Links útiles

| Recurso | URL / ruta |
|---------|------------|
| Repo | https://github.com/Patoicka/PronoIA |
| PR #1 secrets | https://github.com/Patoicka/PronoIA/pull/1 |
| PR #2 tokens UI | https://github.com/Patoicka/PronoIA/pull/2 |
| PR #3 caché fixtures | https://github.com/Patoicka/PronoIA/pull/3 |
| PR #4 Dashboard | https://github.com/Patoicka/PronoIA/pull/4 |
| Front | `Pronosticos-front/` |
| Back | `Pronosticos-back/` |

Detalle de diseño y auditoría (Cursor Agent Store, si está montado):  
`docs/diseno-front.md`, `docs/audit-seguimiento.md`, `docs/plan-prs.md` — y espejo `docs/plan-trabajo.md`.

---

## Checklist “siguiente sesión IDE”

- [ ] `git checkout main && git pull`
- [ ] Confirmar `.env` back (post-#1)
- [ ] Elegir: **Odds (#A)** o **Predictions densas (#B)** (paralelo OK)
- [ ] Si tocas modal: dejar hook listo para DeepSeek lazy+caché (#D)
- [ ] Actualizar este archivo al cerrar cada PR

*Última actualización: 2026-10-22 — post-merge #1 y #3.*
