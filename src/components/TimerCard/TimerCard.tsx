import type { PresetOption } from '../../types/header';
import type { TimerPhase } from '../../types/pomodoro';
import styles from './TimerCard.module.css';

export interface TimerCardProps {
  preset: PresetOption;
  phase: TimerPhase;
  secondsLeft: number;
  isRunning: boolean;
  cycle: number;
  totalCyclesBeforeLongBreak?: number;
  onPhaseChange: (phase: TimerPhase) => void;
  onToggleRun: () => void;
  onSkipPhase: () => void;
  onResetCycles: () => void;
  onEndSession: () => void;
}

function formatClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function TimerCard({
  preset,
  phase,
  secondsLeft,
  isRunning,
  cycle,
  totalCyclesBeforeLongBreak = 4,
  onPhaseChange,
  onToggleRun,
  onSkipPhase,
  onResetCycles,
  onEndSession,
}: TimerCardProps) {
  const phaseItems: Array<{
    id: TimerPhase;
    desktopLabel: string;
    mobileLabel: string;
  }> = [
    {
      id: 'focus',
      desktopLabel: `Foco (${preset.focusMinutes}m)`,
      mobileLabel: 'Foco',
    },
    {
      id: 'shortBreak',
      desktopLabel: `Pausa Curta (${preset.shortBreakMinutes}m)`,
      mobileLabel: 'Pausa Curta',
    },
    {
      id: 'longBreak',
      desktopLabel: `Pausa Longa (${preset.longBreakMinutes}m)`,
      mobileLabel: 'Longa',
    },
  ];

  return (
    <section className={styles.card} aria-label="Temporizador Pomodoro">
      <div className={styles.statusRow}>
        <span
          className={
            isRunning
              ? styles.statusBadge
              : `${styles.statusBadge} ${styles.statusBadgeIdle}`
          }
        >
          {isRunning ? 'Sessão em andamento' : 'Sessão pausada'}
        </span>
        <span className={styles.dot} aria-hidden="true">
          •
        </span>
        <span className={styles.statusNote}>
          {isRunning
            ? 'Preset bloqueado para edição'
            : 'Pronto para iniciar ou editar'}
        </span>
      </div>

      <div className={styles.phaseTabs} role="tablist" aria-label="Fases do Pomodoro">
        {phaseItems.map((item) => {
          const isActive = item.id === phase;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={
                isActive
                  ? `${styles.phaseTab} ${styles.phaseTabActive}`
                  : styles.phaseTab
              }
              onClick={() => onPhaseChange(item.id)}
            >
              <span className={styles.phaseLabelDesktop}>
                {item.desktopLabel}
              </span>
              <span className={styles.phaseLabelMobile}>
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.clockBlock}>
        <p className={styles.clock} aria-live="off">
          {formatClock(secondsLeft)}
        </p>
        <p className={styles.cycleText}>
          Ciclo {cycle} de {totalCyclesBeforeLongBreak} antes da pausa longa
        </p>
      </div>

      <div className={styles.primaryActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onToggleRun}
        >
          {isRunning ? 'Pausar' : 'Iniciar'}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onSkipPhase}
        >
          Pular fase
        </button>
      </div>

      <div className={styles.secondaryLinks}>
        <button
          type="button"
          className={styles.linkButton}
          onClick={onResetCycles}
        >
          Reiniciar ciclos
        </button>
        <span className={styles.dot} aria-hidden="true">
          •
        </span>
        <button
          type="button"
          className={`${styles.linkButton} ${styles.dangerLink}`}
          onClick={onEndSession}
        >
          Encerrar sessão
        </button>
      </div>
    </section>
  );
}
