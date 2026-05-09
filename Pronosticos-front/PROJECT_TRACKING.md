# Contexto del Proyecto: Pronósticos Frontend (ProPredict)

## Propósito
Este proyecto es el frontend para el sistema automatizado de predicción de fútbol ("ProPredict"). Actualmente está siendo migrado a una aplicación robusta en React usando Vite, Tailwind CSS y Redux. El objetivo final es ofrecer un dashboard atractivo, responsivo y visualmente _premium_ para mostrar métricas deportivas y predicciones generadas por el backend de IA.

## Reglas para la IA
1. **Idioma**: Mantener la comunicación y documentación en español.
2. **Tecnologías Core**: React (Vite), Tailwind CSS, Redux, TypeScript/JavaScript.
3. **Diseño Visual**: Implementar interfaces con estética Premium. Utilizar paletas de colores armoniosas, _dark mode_ si aplica, _glassmorphism_ y micro-animaciones (transiciones suaves, efectos hover). **Evitar diseños genéricos o básicos.**
4. **Arquitectura**: Romper componentes monolíticos en piezas modulares y reutilizables. Mantener una estructura de carpetas limpia y escalable.
5. **Registro**: Cada vez que se complete un cambio significativo, se debe actualizar la sección de **Changelog** y marcar las tareas en el **Plan de Ejecución**.

---

## Plan de Ejecución (To-Do)
- [x] Inicializar proyecto de React con Vite.
- [x] Configurar Tailwind CSS, PostCSS y dependencias base.
- [ ] Migrar el diseño HTML/JS monolítico existente a una estructura modular de componentes React.
- [ ] Implementar y estilizar el _Layout_ principal (Sidebar, Header, Main Content Area).
- [ ] Desarrollar vistas de dashboard (Tarjetas de métricas, Listado de Partidos, Detalles de Predicción).
- [ ] Integrar estado global con Redux (o Context API) para el manejo de datos de partidos.
- [ ] Conectar el frontend con la API REST del backend para consumir predicciones en tiempo real.

---

## Changelog

### [2026-05-09]
- **Añadido**: Archivo `PROJECT_TRACKING.md` creado para definir reglas de la IA, plan de tareas y registro de cambios (Changelog).
