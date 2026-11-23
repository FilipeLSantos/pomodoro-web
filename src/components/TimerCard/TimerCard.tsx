import { useRef } from "react";
import type { PresetOption } from "../../types/header";
import type { TimerPhase } from "../../types/pomodoro";
import styles from "./TimerCard.module.css";

export interface TimerCardProps {
  preset: PresetOption;
  phase: TimerPhase;
  secondsLeft: number;
  isRunning: boolean;
  hasSession: boolean;
  isCompleted: boolean;
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
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimerCard({
  preset,
  phase,
  secondsLeft,
  isRunning,
  hasSession,
  isCompleted,
  cycle,
  totalCyclesBeforeLongBreak = 4,
  onPhaseChange,
  onToggleRun,
  onSkipPhase,
  onResetCycles,
  onEndSession,
}: TimerCardProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const phaseItems: Array<{
    id: TimerPhase;
    desktopLabel: string;
    mobileLabel: string;
  }> = [
    {
      id: "focus",
      desktopLabel: `Foco (${preset.focusMinutes}m)`,
      mobileLabel: "Foco",
    },
    {
      id: "shortBreak",
      desktopLabel: `Pausa Curta (${preset.shortBreakMinutes}m)`,
      mobileLabel: "Pausa Curta",
    },
    {
      id: "longBreak",
      desktopLabel: `Pausa Longa (${preset.longBreakMinutes}m)`,
      mobileLabel: "Longa",
    },
  ];

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % phaseItems.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + phaseItems.length) % phaseItems.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = phaseItems.length - 1;
    }

    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    const targetPhase = phaseItems[nextIndex];
    onPhaseChange(targetPhase.id);
    tabRefs.current[nextIndex]?.focus();
  };

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
          {isRunning
            ? "Sessão em andamento"
            : isCompleted
              ? "Sessão concluída"
              : hasSession
                ? "Sessão pausada"
                : "Sem sessão ativa"}
        </span>
        <span className={styles.dot} aria-hidden="true">
          •
        </span>
        <span className={styles.statusNote}>
          {isRunning
            ? "Preset bloqueado para edição"
            : isCompleted
              ? "Pronto para uma nova sessão"
              : hasSession
                ? "Pode retomar ou encerrar a sessão"
                : "Pronto para iniciar ou editar"}
        </span>
      </div>

      <div
        className={styles.phaseTabs}
        role="tablist"
        aria-label="Fases do Pomodoro"
      >
        {phaseItems.map((item, index) => {
          const isActive = item.id === phase;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={
                isActive
                  ? `${styles.phaseTab} ${styles.phaseTabActive}`
                  : styles.phaseTab
              }
              onClick={() => onPhaseChange(item.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
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
          {isRunning
            ? "Pausar"
            : isCompleted
              ? "Nova sessão"
              : hasSession
                ? "Retomar"
                : "Iniciar"}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onSkipPhase}
          disabled={isCompleted}
        >
          Pular fase
        </button>
      </div>

      <div className={styles.secondaryLinks}>
        <button
          type="button"
          className={styles.linkButton}
          onClick={onResetCycles}
          disabled={!hasSession || isCompleted}
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
          disabled={!hasSession}
        >
          Encerrar sessão
        </button>
      </div>
    </section>
  );
}
