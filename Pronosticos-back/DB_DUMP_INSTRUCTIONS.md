# Instrucciones para exportar/restaurar la base de datos

Este backend usa PostgreSQL en Docker con las credenciales definidas en `docker-compose.yml`:

- Contenedor: `pronosticos_db`
- Base de datos: `pronosticos_ai`
- Usuario: `admin`
- Password: `adminpassword`
- Puerto local: `5432`

Actualmente no hay un dump versionado en el backend. Estas instrucciones sirven para crear uno desde la computadora donde ya están cargadas las tablas y restaurarlo en otra.

## Tablas del proyecto

Las tablas definidas por `models.py` son:

- `competitions`
- `seasons`
- `teams`
- `managers`
- `players`
- `referees`
- `matches`
- `player_match_stats`
- `predictions`

Las tablas cargadas por el ETL desde CSV son principalmente:

- `competitions`
- `seasons`
- `teams`
- `matches`

## 1. Crear dump desde la computadora actual

Desde la carpeta `Pronosticos-back`:

```bash
mkdir -p backups
docker exec pronosticos_db pg_dump -U admin -d pronosticos_ai -Fc -f /tmp/pronosticos_ai.dump
docker cp pronosticos_db:/tmp/pronosticos_ai.dump ./backups/pronosticos_ai.dump
```

El archivo resultante queda en:

```text
Pronosticos-back/backups/pronosticos_ai.dump
```

Ese archivo es el que debes pasar a otra computadora.

## 2. Restaurar dump en otra computadora

En la otra computadora, clonar o copiar el proyecto y entrar a `Pronosticos-back`.

Levantar PostgreSQL:

```bash
docker compose up -d db
```

Copiar el dump al contenedor:

```bash
docker cp ./backups/pronosticos_ai.dump pronosticos_db:/tmp/pronosticos_ai.dump
```

Restaurar reemplazando datos existentes:

```bash
docker exec pronosticos_db pg_restore -U admin -d pronosticos_ai --clean --if-exists /tmp/pronosticos_ai.dump
```

## 3. Verificar que las tablas estén cargadas

```bash
docker exec -it pronosticos_db psql -U admin -d pronosticos_ai -c "\dt"
```

Ver conteo rápido de las tablas principales:

```bash
docker exec -it pronosticos_db psql -U admin -d pronosticos_ai -c "select 'competitions' as table, count(*) from competitions union all select 'seasons', count(*) from seasons union all select 'teams', count(*) from teams union all select 'matches', count(*) from matches;"
```

## 4. Opción: exportar tablas como SQL plano

Si se prefiere un archivo `.sql` legible:

```bash
mkdir -p backups
docker exec pronosticos_db pg_dump -U admin -d pronosticos_ai --inserts -f /tmp/pronosticos_ai.sql
docker cp pronosticos_db:/tmp/pronosticos_ai.sql ./backups/pronosticos_ai.sql
```

Restaurar SQL plano:

```bash
docker cp ./backups/pronosticos_ai.sql pronosticos_db:/tmp/pronosticos_ai.sql
docker exec pronosticos_db psql -U admin -d pronosticos_ai -f /tmp/pronosticos_ai.sql
```

## 5. Notas importantes

- No subir dumps grandes al repositorio si pesan demasiado.
- Si el dump contiene datos sensibles, no compartirlo públicamente.
- `/api/matches` y `/api/predict/{match_id}` usan esta base local.
- `/api/matches/live` consulta API-Football directamente y no depende de estas tablas.
