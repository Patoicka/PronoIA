# Contexto del Proyecto: Pronósticos Backend (AI Sports Prediction System)

## Propósito
Este proyecto es el backend local para un sistema automatizado de predicción de fútbol basado en IA. El backend utiliza Python y PostgreSQL (vía Docker) para la ingesta de datos (ETL) y sirve de base de datos relacional para métricas avanzadas de equipos y jugadores. El objetivo es entrenar modelos con datos históricos para predecir resultados de partidos.

## Reglas para la IA
1. **Idioma**: Mantener la comunicación y documentación en español.
2. **Tecnologías**: Python, SQLAlchemy, PostgreSQL (Docker), Pandas/Scikit-learn para análisis.
3. **Estilo de Código**: Escribir código limpio, modular y documentado. Utilizar _type hints_ en Python siempre que sea posible.
4. **Seguridad y DB**: No realizar cambios destructivos en la base de datos sin confirmación del usuario. Seguir buenas prácticas de modelado relacional.
5. **Registro**: Cada vez que se complete un cambio significativo, se debe actualizar la sección de **Changelog** y marcar las tareas en el **Plan de Ejecución**.

---

## Plan de Ejecución (To-Do)
- [x] Configurar contenedor de PostgreSQL con Docker (`docker-compose.yml`).
- [x] Definir modelos de base de datos SQLAlchemy (`models.py`).
- [x] Crear script de inicialización de base de datos (`init_db.py`).
- [ ] Desarrollar scripts para poblar la base de datos con datos iniciales / catálogos.
- [ ] Construir pipelines de extracción, transformación y carga (ETL) de datos históricos de partidos.
- [ ] Entrenar e integrar modelo de IA/Machine Learning para predicciones.
- [ ] Desarrollar API REST (ej. FastAPI o Flask) para exponer los datos y predicciones al Frontend.

---

## Changelog

### [2026-05-09]
- **Añadido**: Archivo `PROJECT_TRACKING.md` creado para definir reglas de la IA, plan de tareas y registro de cambios (Changelog).
