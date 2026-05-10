# Changelog - Pronosticos Backend

Todas las mejoras notables de la Inteligencia Artificial y la API se documentarán en este archivo.

## [V3.1] - Diagnóstico de API-Football y temporada actual
### Agregado (Added)
- **Endpoint de salud**: Se agregó `/api/health` para confirmar qué `main.py`, carpeta de trabajo y rutas está ejecutando realmente FastAPI.
- **Endpoint de diagnóstico**: Se agregó `/api/debug/matches-live` y el alias `/api/matches/live/debug` para revisar la temporada calculada, URLs usadas contra API-Football y muestra cruda de fixtures.
- **Headers de depuración**: `/api/matches/live` ahora expone headers `X-Matches-Live-*` con temporada, fuente de datos, cantidad cruda y cantidad devuelta.
- **Logs de backend**: Se añadieron logs de arranque y de consulta para detectar procesos viejos, rutas incorrectas o respuestas inesperadas de API-Football.

### Cambiado (Changed)
- **Temporada actual forzada**: `/api/matches/live` calcula la temporada europea actual automáticamente (`25/26` -> `season=2025`) y no usa PostgreSQL ni CSV.
- **Backend limpio en puerto 8001**: Se detectaron varias instancias viejas de uvicorn en `8000`; para aislar el problema se levantó la API actualizada en `http://127.0.0.1:8001`.
- **Fallback de mercados**: Si no existen modelos `.pkl`, el endpoint live devuelve mercados neutros para que la UI pueda mostrar partidos sin romper.

### Diagnóstico
- **Causa de partidos desactualizados**: El puerto `8000` seguía atendido por procesos viejos de uvicorn que devolvían fixtures de mayo de 2024.
- **Limitación externa**: API-Football respondió que el plan gratis no tiene acceso a `season=2025`: `Free plans do not have access to this season, try from 2022 to 2024.`
- **Conclusión**: Para mostrar datos reales de la temporada `25/26` se necesita un plan/API con acceso a `season=2025`, o usar temporalmente una temporada permitida (`2022` a `2024`) sabiendo que no es actual.

## [V3.0] - Arquitectura Multi-Mercado & Nivel Profesional
### Agregado (Added)
- **Motor Elo Rating**: Implementación de algoritmo dinámico en `feature_engineering.py` para medir la fuerza real de los equipos.
- **Factor de Fatiga**: Cálculo de días de descanso entre partidos.
- **Entrenamiento Paralelo**: Creación de 6 "Cerebros" XGBoost independientes para abarcar el panel completo de apuestas.
- **API Buffet**: El endpoint `/api/predict/{match_id}` en `main.py` ahora carga los 6 modelos simultáneamente y devuelve el porcentaje exacto para Goles, Ambos Anotan y Doble Oportunidad.

## [V2.0] - Modelo Experto
### Agregado (Added)
- Extracción masiva de CSVs (25,000 partidos) de las 5 grandes ligas.
- Feature engineering enfocado en Rachas (últimos 5 partidos) y Paternidad (H2H Win Rate).
