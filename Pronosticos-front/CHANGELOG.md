# Changelog - Pronosticos Frontend

Todas las mejoras visuales y de conexión con la IA se documentarán en este archivo.

## [V2.2] - 2026-06-27 · Foco en Mundial 2026, freemium y rediseño de Dashboard
### Agregado (Added)
- **Tabla de posiciones por grupos**: `Leagues.tsx` rediseñado completamente. Consume el nuevo endpoint de standings real; muestra una grid de tablas por grupo (A–L) con escudos, GF, GC, DG y puntos. Los 2 primeros de cada grupo se resaltan en verde (clasificados a octavos). Maneja estado vacío y error de plan de API.
- **Sección `¿Cómo funciona?`** en el Dashboard: explica la metodología de predicción en 3 pasos sin revelar proveedores externos.

### Cambiado (Changed)
- **Freemium — posición del `UnlockCard`**: Movido entre la sección 1X2 y el análisis de IA para maximizar visibilidad antes de mostrar el contenido premium.
- **`mockData.ts` — `leaguesList`**: Reducida a solo `Mundial 2026`; las otras ligas (La Liga, PL, Serie A, etc.) quedan ocultas hasta que se habiliten.
- **Dashboard — fetch al Mundial**: El dashboard ahora carga los próximos 5 partidos del Mundial 2026 (league_id=1) en lugar de la Premier League.
- **Dashboard — stat cards**: "Próximo partido" muestra nombre de equipos real; "Partidos disponibles" refleja el conteo real del WC; se añadió "48 Selecciones / 12 grupos"; se eliminó la referencia a "PL temporada 26/27".
- **Dashboard — sidebar**: Eliminada la sección "Ligas disponibles" que listaba 6 ligas obsoletas. Sustituida por "¿Cómo funciona?".
- **Dashboard — texto**: "Ver todas las ligas" → "Ver todo"; subtítulo del hero actualizado al Mundial.
- **Mercados cubiertos**: Chips centrados con `justify-center`; mención de proveedor de IA removida del paso 3.

## [V2.1] - Predicciones conectadas a backend limpio
### Agregado (Added)
- **Base URL configurable**: `Predictions.tsx` usa `VITE_API_URL` si existe; por defecto apunta a `http://127.0.0.1:8001` para evitar el puerto `8000` contaminado por procesos viejos.
- **Manejo de errores de API**: La pantalla de predicciones muestra errores claros cuando el backend o API-Football rechazan la consulta.
- **Agrupación por jornada**: Los partidos se agrupan por `jornada` y `total_jornadas` devueltos por el backend.
- **Indicador de temporada**: La UI muestra la temporada API usada cuando el backend devuelve `api_season`.

### Cambiado (Changed)
- **Cache busting**: Las peticiones a `/api/matches/live` usan `cache: 'no-store'` y un parámetro `_` para evitar respuestas cacheadas.
- **Puerto de backend**: El frontend quedó alineado con el backend actualizado en `8001`, porque `8000` estaba respondiendo con una instancia vieja.

### Diagnóstico
- **No era un problema de CSV**: La pantalla de predicciones consume `/api/matches/live`, que viene de API-Football y no de la base local cargada desde CSV.
- **Por qué no aparecen datos recientes**: El backend limpio confirmó que API-Football bloquea `season=2025` en el plan gratis (`25/26`), por lo que la UI no puede mostrar datos actuales reales hasta cambiar de plan/API o usar una temporada permitida.

## [V2.0] - Rediseño Multi-Mercado y Modal Premium
### Cambiado (Changed)
- **MatchModal.tsx**: Rediseño arquitectónico. Se pasó de un formato apilado a una vista de 2 columnas (Estilo Dashboard Premium).
- **MarketCards**: Se rediseñaron las tarjetas de predicción para incorporar íconos y etiquetas de recomendación "TOP" (probabilidad >70%).
- **Solución de Bug**: Se arregló un problema de re-renderizado (`Math.random()`) que causaba parpadeos en las cuotas; ahora se calculan estáticamente en base a la IA.
- **Predictions.tsx**: Se cambió la vista de tarjetas de cuadrícula a un formato de **lista vertical** más ordenado.
- **MatchCard.tsx**: Se añadió un badge informativo indicando la "Jornada" del partido.
