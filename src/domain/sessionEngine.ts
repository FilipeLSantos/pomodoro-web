import type { PresetOption } from '../types/header';
import type {
  ActiveSession,
  PresetSnapshot,
  TimerPhase,
} from '../types/pomodoro';

export const DEFAULT_CYCLES_BEFORE_LONG_BREAK = 4;

export function createPresetSnapshot(preset: PresetOption): PresetSnapshot {
  return {
    name: preset.name?.trim() || preset.label,
    focusMinutes: preset.focusMinutes,
    shortBreakMinutes: preset.shortBreakMinutes,
    cyclesBeforeLongBreak:
      preset.cyclesBeforeLongBreak ?? DEFAULT_CYCLES_BEFORE_LONG_BREAK,
    longBreakMinutes: preset.longBreakMinutes,
  };
}

export function getPhaseDurationMs(
  snapshot: Pick<
    PresetSnapshot,
    'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes'
  >,
  phase: TimerPhase
): number {
  switch (phase) {
    case 'focus':
      return snapshot.focusMinutes * 60 * 1000;
    case 'shortBreak':
      return snapshot.shortBreakMinutes * 60 * 1000;
    case 'longBreak':
      return snapshot.longBreakMinutes * 60 * 1000;
  }
}

export function getPhaseDurationSeconds(
  snapshot: Pick<
    PresetSnapshot,
    'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes'
  >,
  phase: TimerPhase
): number {
  return Math.round(getPhaseDurationMs(snapshot, phase) / 1000);
}

export function createActiveSession(
  preset: PresetOption,
  phase: TimerPhase = 'focus',
  cycle = 1,
  now = Date.now()
): ActiveSession {
  const snapshotPreset = createPresetSnapshot(preset);
  const safeCycle = Math.min(
    Math.max(1, cycle),
    snapshotPreset.cyclesBeforeLongBreak
  );
  const durationMs = getPhaseDurationMs(snapshotPreset, phase);

  return {
    id: `session-${now}`,
    presetId: preset.id,
    snapshotPreset,
    phase,
    cycle: safeCycle,
    status: 'running',
    phaseStartedAt: now,
    phaseEndsAt: now + durationMs,
    pausedAt: null,
    remainingMsOnPause: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function pauseSession(
  session: ActiveSession,
  now = Date.now()
): ActiveSession {
  if (session.status !== 'running') {
    return session;
  }

  const remainingMs = Math.max(0, session.phaseEndsAt - now);

  return {
    ...session,
    status: 'paused',
    pausedAt: now,
    remainingMsOnPause: remainingMs,
    updatedAt: now,
  };
}

export function resumeSession(
  session: ActiveSession,
  now = Date.now()
): ActiveSession {
  if (session.status !== 'paused') {
    return session;
  }

  const remainingMs =
    session.remainingMsOnPause ??
    getPhaseDurationMs(session.snapshotPreset, session.phase);

  return {
    ...session,
    status: 'running',
    phaseStartedAt: now,
    phaseEndsAt: now + Math.max(0, remainingMs),
    pausedAt: null,
    remainingMsOnPause: null,
    updatedAt: now,
  };
}

export function getRemainingSeconds(
  session: ActiveSession,
  now = Date.now()
): number {
  if (session.status === 'completed') {
    return 0;
  }
  if (session.status === 'paused') {
    const remainingMs =
      session.remainingMsOnPause ??
      getPhaseDurationMs(session.snapshotPreset, session.phase);
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }
  return Math.max(0, Math.ceil((session.phaseEndsAt - now) / 1000));
}

export interface ReconcileResult {
  session: ActiveSession;
  completedFocusPhases: number;
  phasesAdvanced: number;
}

/**
 * Reconciles a running session against the current wall-clock timestamp (UC10, RN-06, RN-07, RN-08).
 * - Paused or completed sessions return unchanged.
 * - Expired phases advance sequentially using absolute timestamps until reaching
 *   the current active phase or marking the session completed.
 */
export function reconcileSessionWithNow(
  session: ActiveSession,
  now = Date.now()
): ReconcileResult {
  if (session.status !== 'running' || now < session.phaseEndsAt) {
    return {
      session,
      completedFocusPhases: 0,
      phasesAdvanced: 0,
    };
  }

  let current = { ...session };
  let completedFocusPhases = 0;
  let phasesAdvanced = 0;
  const maxIterations = current.snapshotPreset.cyclesBeforeLongBreak * 2 + 4;

  while (
    current.status === 'running' &&
    now >= current.phaseEndsAt &&
    phasesAdvanced < maxIterations
  ) {
    const prevEndsAt = current.phaseEndsAt;
    phasesAdvanced += 1;

    if (current.phase === 'focus') {
      completedFocusPhases += 1;
      const nextPhase: TimerPhase =
        current.cycle >= current.snapshotPreset.cyclesBeforeLongBreak
          ? 'longBreak'
          : 'shortBreak';
      const nextDurationMs = getPhaseDurationMs(
        current.snapshotPreset,
        nextPhase
      );
      current = {
        ...current,
        phase: nextPhase,
        phaseStartedAt: prevEndsAt,
        phaseEndsAt: prevEndsAt + nextDurationMs,
        updatedAt: now,
      };
    } else if (current.phase === 'shortBreak') {
      const nextCycle = Math.min(
        current.cycle + 1,
        current.snapshotPreset.cyclesBeforeLongBreak
      );
      const nextDurationMs = getPhaseDurationMs(
        current.snapshotPreset,
        'focus'
      );
      current = {
        ...current,
        phase: 'focus',
        cycle: nextCycle,
        phaseStartedAt: prevEndsAt,
        phaseEndsAt: prevEndsAt + nextDurationMs,
        updatedAt: now,
      };
    } else {
      // longBreak finished -> entire session completed (RN-08)
      current = {
        ...current,
        status: 'completed',
        pausedAt: null,
        remainingMsOnPause: 0,
        updatedAt: now,
      };
      break;
    }
  }

  return {
    session: current,
    completedFocusPhases,
    phasesAdvanced,
  };
}

/**
 * Manually skips the current phase (UC06, RN-03).
 * Does not increment completed cycle count; if currently on longBreak, ends session (returns null).
 */
export function skipSessionPhase(
  session: ActiveSession,
  now = Date.now()
): ActiveSession | null {
  if (session.phase === 'longBreak') {
    return null;
  }

  const nextPhase: TimerPhase =
    session.phase === 'focus'
      ? session.cycle >= session.snapshotPreset.cyclesBeforeLongBreak
        ? 'longBreak'
        : 'shortBreak'
      : 'focus';

  const nextDurationMs = getPhaseDurationMs(currentSnapshot(session), nextPhase);
  const isPaused = session.status === 'paused';

  return {
    ...session,
    phase: nextPhase,
    status: isPaused ? 'paused' : 'running',
    phaseStartedAt: now,
    phaseEndsAt: now + nextDurationMs,
    pausedAt: isPaused ? now : null,
    remainingMsOnPause: isPaused ? nextDurationMs : null,
    updatedAt: now,
  };
}

/**
 * Resets cycles to cycle 1 focus while keeping the active session and snapshot (RN-04, UC07).
 */
export function resetSessionCycles(
  session: ActiveSession,
  now = Date.now()
): ActiveSession {
  const durationMs = getPhaseDurationMs(session.snapshotPreset, 'focus');
  const isPaused = session.status === 'paused';

  return {
    ...session,
    phase: 'focus',
    cycle: 1,
    status: isPaused ? 'paused' : 'running',
    phaseStartedAt: now,
    phaseEndsAt: now + durationMs,
    pausedAt: isPaused ? now : null,
    remainingMsOnPause: isPaused ? durationMs : null,
    updatedAt: now,
  };
}

/**
 * Switches the phase of an active session manually and pauses it on the new phase.
 */
export function setSessionPhase(
  session: ActiveSession,
  nextPhase: TimerPhase,
  now = Date.now()
): ActiveSession {
  const durationMs = getPhaseDurationMs(session.snapshotPreset, nextPhase);

  return {
    ...session,
    phase: nextPhase,
    status: 'paused',
    phaseStartedAt: now,
    phaseEndsAt: now + durationMs,
    pausedAt: now,
    remainingMsOnPause: durationMs,
    updatedAt: now,
  };
}

function currentSnapshot(session: ActiveSession): PresetSnapshot {
  return session.snapshotPreset;
}
