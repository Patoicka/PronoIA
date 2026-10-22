# Instrucciones para exportar/restaurar la base de datos

Este backend usa PostgreSQL en Docker. Las credenciales **no** deben vivir hardcodeadas en el repo: configúralas en `.env` (parte de `.env.example`).

## Seguridad — no commitear passwords

- **No** subas `.env`, dumps con datos sensibles, ni passwords reales al repositorio.
- `.env` ya está en `.gitignore`. Usa solo `.env.example` (placeholders) como plantilla.
- Alinea `DATABASE_URL` con `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` de tu `.env`.
- Rota cualquier password que haya aparecido antes en documentación o historial de git.

Variables típicas (nombres, no valores):

- Contenedor: `pronosticos_db`
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, puerto (`POSTGRES_PORT`, default `5432`)

En los comandos de abajo, sustituye `-U admin` / `-d pronosticos_ai` por el usuario y la base de **tu** `.env`.

Actualmente no hay un dump versionado en el backend. Estas instrucciones sirven para crear uno desde la máquina donde ya están cargadas las tablas y restaurarlo en otra.

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

Desde la carpeta `Pronosticos-back` (con `.env` cargado y el contenedor arriba):

```bash
mkdir -p backups
docker exec pronosticos_db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/pronosticos_ai.dump
docker cp pronosticos_db:/tmp/pronosticos_ai.dump ./backups/pronosticos_ai.dump
```

El archivo resultante queda en:

```text
Pronosticos-back/backups/pronosticos_ai.dump
```

Ese archivo es el que debes pasar a otra computadora. **No lo commitees** si contiene datos sensibles.

## 2. Restaurar dump en otra computadora

En la otra computadora, clonar o copiar el proyecto y entrar a `Pronosticos-back`.

```bash
cp .env.example .env
# Edita .env con passwords locales (no uses las del ejemplo en producción)
docker compose up -d db
```

Copiar el dump al contenedor:

```bash
docker cp ./backups/pronosticos_ai.dump pronosticos_db:/tmp/pronosticos_ai.dump
```

Restaurar reemplazando datos existentes:

```bash
docker exec pronosticos_db pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists /tmp/pronosticos_ai.dump
```

## 3. Verificar que las tablas estén cargadas

```bash
docker exec -it pronosticos_db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"
```

Ver conteo rápido de las tablas principales:

```bash
docker exec -it pronosticos_db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select 'competitions' as table, count(*) from competitions union all select 'seasons', count(*) from seasons union all select 'teams', count(*) from teams union all select 'matches', count(*) from matches;"
```

## 4. Opción: exportar tablas como SQL plano

Si se prefiere un archivo `.sql` legible:

```bash
mkdir -p backups
docker exec pronosticos_db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --inserts -f /tmp/pronosticos_ai.sql
docker cp pronosticos_db:/tmp/pronosticos_ai.sql ./backups/pronosticos_ai.sql
```

Restaurar SQL plano:

```bash
docker cp ./backups/pronosticos_ai.sql pronosticos_db:/tmp/pronosticos_ai.sql
docker exec pronosticos_db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/pronosticos_ai.sql
```

## 5. Notas importantes

- No subir dumps grandes al repositorio si pesan demasiado.
- Si el dump contiene datos sensibles, no compartirlo públicamente ni versionarlo.
- `/api/matches` y `/api/predict/{match_id}` usan esta base local.
- `/api/matches/live` consulta football-data.org (u origen live configurado) y no depende de estas tablas.
