import React from 'react';
import {
  Database,
  Cog,
  BarChart3,
  FileText,
  Crosshair,
  AlertTriangle,
  Info,
  ChevronRight,
} from 'lucide-react';

/** Esfera decorativa: asset oficial Kronos (fútbol + datos). */
const MethodologyOrb: React.FC = () => (
  <div className="methodology-orb" aria-hidden>
    <img
      src="/images/methodology/hero-orb.png"
      alt=""
      className="methodology-orb__img"
      draggable={false}
    />
  </div>
);

const STEPS = [
  {
    icon: Database,
    title: 'Datos deportivos',
    desc: 'Recopilamos información histórica y contextual de partidos, equipos y rendimiento reciente.',
  },
  {
    icon: Cog,
    title: 'Análisis y modelado',
    desc: 'Procesamos los datos con modelos estadísticos para detectar patrones y escenarios probables.',
  },
  {
    icon: BarChart3,
    title: 'Probabilidades',
    desc: 'Presentamos estimaciones claras para los mercados principales, facilitando su interpretación.',
  },
] as const;

const TRANSPARENCY = [
  {
    icon: FileText,
    title: 'Basado en datos',
    desc: 'Las predicciones se construyen a partir de información deportiva y análisis estadístico.',
  },
  {
    icon: Crosshair,
    title: 'Evaluación del modelo',
    desc: 'Kronos permite distinguir entre predicciones pendientes, acertadas y fallidas para revisar su rendimiento.',
  },
  {
    icon: AlertTriangle,
    title: 'No hay certezas absolutas',
    desc: 'Una probabilidad alta indica un escenario más probable, pero no garantiza el resultado final del partido.',
  },
] as const;

const DEMO = [
  { key: '1', label: 'Local', team: 'Arsenal FC', value: 48, active: true },
  { key: 'X', label: 'Empate', team: 'Empate', value: 27, active: false },
  { key: '2', label: 'Visita', team: 'Chelsea FC', value: 25, active: false },
] as const;

export const Methodology: React.FC = () => {
  return (
    <section className="methodology fade-in">
      {/* —— 1. Encabezado —— */}
      <header className="methodology-hero">
        <div className="methodology-hero__copy">
          <p className="methodology-kicker">Metodología</p>
          <h1 className="methodology-hero__title">La ciencia detrás de cada predicción.</h1>
          <p className="methodology-hero__lead">
            Kronos transforma información deportiva en probabilidades claras para ayudarte a interpretar
            cada partido con mayor contexto.
          </p>
        </div>
        <MethodologyOrb />
      </header>

      {/* —— 2. Cómo funciona —— */}
      <div className="methodology-panel">
        <p className="methodology-step-label">01</p>
        <h2 className="methodology-panel__title">Cómo funciona Kronos</h2>
        <p className="methodology-panel__sub">
          Convertimos datos deportivos en estimaciones de probabilidad a través de un proceso claro y
          estructurado.
        </p>
        <div className="methodology-steps">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.title}>
                {i > 0 && (
                  <div className="methodology-steps__connector" aria-hidden>
                    <ChevronRight size={18} />
                  </div>
                )}
                <article className="methodology-step">
                  <span className="methodology-step__icon">
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <h3 className="methodology-step__title">{step.title}</h3>
                  <p className="methodology-step__desc">{step.desc}</p>
                </article>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* —— 3. Interpretar predicción —— */}
      <div className="methodology-panel methodology-panel--focus">
        <p className="methodology-step-label">02</p>
        <h2 className="methodology-panel__title">Aprende a interpretar una predicción</h2>
        <p className="methodology-panel__sub">
          Cada porcentaje representa una probabilidad estimada, no una garantía de resultado.
        </p>

        <div className="methodology-interpret">
          <div className="methodology-demo">
            <div className="methodology-demo__teams">
              <div className="methodology-demo__team">
                <span className="methodology-demo__crest" style={{ background: '#EF0107' }}>
                  A
                </span>
                <span>Arsenal FC</span>
              </div>
              <span className="methodology-demo__vs">VS</span>
              <div className="methodology-demo__team">
                <span className="methodology-demo__crest" style={{ background: '#034694' }}>
                  C
                </span>
                <span>Chelsea FC</span>
              </div>
            </div>

            <div className="methodology-demo__probs">
              {DEMO.map((d) => (
                <div
                  key={d.key}
                  className={`methodology-demo__cell${d.active ? ' is-active' : ''}`}
                >
                  <p className="methodology-demo__pct">{d.value}%</p>
                  <p className="methodology-demo__label">{d.label}</p>
                </div>
              ))}
            </div>

            <div className="methodology-demo__bar" aria-hidden>
              <span style={{ width: '48%', background: 'var(--accent)' }} />
              <span style={{ width: '27%', background: 'rgba(56,189,248,0.55)' }} />
              <span style={{ width: '25%', background: 'rgba(91,110,160,0.75)' }} />
            </div>
          </div>

          <aside className="methodology-explain">
            <p className="methodology-explain__title">
              <Info size={14} /> ¿Qué significa?
            </p>
            <p className="methodology-explain__body">
              En este ejemplo, el modelo considera más probable la victoria del equipo local. Eso no
              significa que el resultado esté garantizado, sino que es el escenario con mayor
              probabilidad entre las opciones disponibles.
            </p>
            <p className="methodology-explain__note">
              Una probabilidad alta orienta la lectura del partido; nunca elimina la incertidumbre del
              deporte.
            </p>
          </aside>
        </div>
      </div>

      {/* —— 4. Transparencia —— */}
      <div className="methodology-panel">
        <p className="methodology-step-label">03</p>
        <h2 className="methodology-panel__title">Transparencia</h2>
        <p className="methodology-panel__sub">
          Las probabilidades ayudan a interpretar el partido, pero no eliminan la incertidumbre del
          deporte.
        </p>
        <div className="methodology-transparency">
          {TRANSPARENCY.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="methodology-transparency__item">
                <span className="methodology-transparency__icon">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <h3 className="methodology-transparency__title">{item.title}</h3>
                <p className="methodology-transparency__desc">{item.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
