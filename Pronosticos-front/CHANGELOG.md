# Changelog - Pronosticos Frontend

Todas las mejoras visuales y de conexión con la IA se documentarán en este archivo.

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
