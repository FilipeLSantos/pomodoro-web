import type { PresetOption } from '../types/header';
import type {
  ActiveSession,
  StudyTask,
  TaskPriority,
  TaskStatus,
  TimerPhase,
  UiPreferences,
} from '../types/pomodoro';

export const STORAGE_KEYS = {
  presets: 'pomodoro.presets',
  tasks: 'pomodoro.tarefas',
  activeSession: 'pomodoro.sessaoAtiva',
  preferences: 'pomodoro.preferencias',
} as const;

export interface StorageLoadResult<T> {
  data: T;
  corrupted: boolean;
  error: string | null;
}

export interface StorageSaveResult {
  ok: boolean;
  error: string | null;
}

const VALID_PHASES: ReadonlySet<TimerPhase> = new Set([
  'focus',
  'shortBreak',
  'longBreak',
]);

const VALID_PRIORITIES: ReadonlySet<TaskPriority> = new Set([
  'Alta',
  'Média',
  'Baixa',
]);

const VALID_STATUSES: ReadonlySet<TaskStatus> = new Set([
  'Em execução',
  'A fazer',
  'Backlog',
  'Concluída',
  'Cancelada',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveInt(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

function isValidPreset(value: unknown): value is PresetOption {
  if (!isRecord(value)) {
    return false;
  }
  const cycles = value.cyclesBeforeLongBreak;
  const cyclesValid =
    cycles === undefined || isPositiveInt(cycles, 1, 12);

  return (
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.label === 'string' &&
    value.label.trim().length > 0 &&
    isPositiveInt(value.focusMinutes, 1, 120) &&
    isPositiveInt(value.shortBreakMinutes, 1, 60) &&
    isPositiveInt(value.longBreakMinutes, 1, 90) &&
    cyclesValid
  );
}

function isValidTask(value: unknown): value is StudyTask {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    typeof value.priority === 'string' &&
    VALID_PRIORITIES.has(value.priority as TaskPriority) &&
    typeof value.status === 'string' &&
    VALID_STATUSES.has(value.status as TaskStatus)
  );
}

function isValidActiveSession(value: unknown): value is ActiveSession {
  if (!isRecord(value)) {
    return false;
  }
  if (!isRecord(value.snapshotPreset)) {
    return false;
  }

  const snap = value.snapshotPreset;
  const validSnapshot =
    typeof snap.name === 'string' &&
    snap.name.trim().length > 0 &&
    isPositiveInt(snap.focusMinutes, 1, 120) &&
    isPositiveInt(snap.shortBreakMinutes, 1, 60) &&
    isPositiveInt(snap.cyclesBeforeLongBreak, 1, 12) &&
    isPositiveInt(snap.longBreakMinutes, 1, 90);

  const validStatus =
    value.status === 'running' ||
    value.status === 'paused' ||
    value.status === 'completed';

  return (
    validSnapshot &&
    typeof value.id === 'string' &&
    typeof value.presetId === 'string' &&
    typeof value.phase === 'string' &&
    VALID_PHASES.has(value.phase as TimerPhase) &&
    isPositiveInt(value.cycle, 1, 12) &&
    validStatus &&
    typeof value.phaseStartedAt === 'number' &&
    Number.isFinite(value.phaseStartedAt) &&
    typeof value.phaseEndsAt === 'number' &&
    Number.isFinite(value.phaseEndsAt) &&
    (value.pausedAt === null ||
      (typeof value.pausedAt === 'number' && Number.isFinite(value.pausedAt))) &&
    (value.remainingMsOnPause === null ||
      (typeof value.remainingMsOnPause === 'number' &&
        Number.isFinite(value.remainingMsOnPause) &&
        value.remainingMsOnPause >= 0))
  );
}

function readRawItem(key: string): { raw: string | null; error: string | null } {
  try {
    return { raw: window.localStorage.getItem(key), error: null };
  } catch {
    return {
      raw: null,
      error:
        'Não foi possível acessar o armazenamento local do navegador (localStorage).',
    };
  }
}

function writeRawItem(key: string, value: string): StorageSaveResult {
  try {
    window.localStorage.setItem(key, value);
    return { ok: true, error: null };
  } catch {
    return {
      ok: false,
      error:
        'Falha ao salvar dados localmente. Verifique se o armazenamento do navegador não está cheio ou bloqueado.',
    };
  }
}

function removeRawItem(key: string): StorageSaveResult {
  try {
    window.localStorage.removeItem(key);
    return { ok: true, error: null };
  } catch {
    return {
      ok: false,
      error: 'Falha ao remover dados do armazenamento local.',
    };
  }
}

export function loadPresets(
  fallback: PresetOption[]
): StorageLoadResult<PresetOption[]> {
  const { raw, error } = readRawItem(STORAGE_KEYS.presets);
  if (error || raw === null) {
    return { data: fallback, corrupted: false, error };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every(isValidPreset)
    ) {
      return { data: parsed, corrupted: false, error: null };
    }
    return { data: fallback, corrupted: true, error: null };
  } catch {
    return { data: fallback, corrupted: true, error: null };
  }
}

export function savePresets(presets: PresetOption[]): StorageSaveResult {
  return writeRawItem(STORAGE_KEYS.presets, JSON.stringify(presets));
}

export function loadTasks(
  fallback: StudyTask[]
): StorageLoadResult<StudyTask[]> {
  const { raw, error } = readRawItem(STORAGE_KEYS.tasks);
  if (error || raw === null) {
    return { data: fallback, corrupted: false, error };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isValidTask)) {
      return { data: parsed, corrupted: false, error: null };
    }
    return { data: fallback, corrupted: true, error: null };
  } catch {
    return { data: fallback, corrupted: true, error: null };
  }
}

export function saveTasks(tasks: StudyTask[]): StorageSaveResult {
  return writeRawItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

export function loadActiveSession(): StorageLoadResult<ActiveSession | null> {
  const { raw, error } = readRawItem(STORAGE_KEYS.activeSession);
  if (error || raw === null) {
    return { data: null, corrupted: false, error };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null) {
      return { data: null, corrupted: false, error: null };
    }
    if (isValidActiveSession(parsed)) {
      return { data: parsed, corrupted: false, error: null };
    }
    return { data: null, corrupted: true, error: null };
  } catch {
    return { data: null, corrupted: true, error: null };
  }
}

export function saveActiveSession(
  session: ActiveSession | null
): StorageSaveResult {
  if (session === null) {
    return removeRawItem(STORAGE_KEYS.activeSession);
  }
  return writeRawItem(STORAGE_KEYS.activeSession, JSON.stringify(session));
}

export function loadPreferences(
  fallback: UiPreferences
): StorageLoadResult<UiPreferences> {
  const { raw, error } = readRawItem(STORAGE_KEYS.preferences);
  if (error || raw === null) {
    return { data: fallback, corrupted: false, error };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return { data: fallback, corrupted: true, error: null };
    }

    return {
      data: {
        selectedPresetId:
          typeof parsed.selectedPresetId === 'string' &&
          parsed.selectedPresetId.trim().length > 0
            ? parsed.selectedPresetId
            : fallback.selectedPresetId,
        selectedStateCode:
          typeof parsed.selectedStateCode === 'string' &&
          parsed.selectedStateCode.trim().length > 0
            ? parsed.selectedStateCode
            : fallback.selectedStateCode,
        cycleSwitchEnabled:
          typeof parsed.cycleSwitchEnabled === 'boolean'
            ? parsed.cycleSwitchEnabled
            : fallback.cycleSwitchEnabled,
      },
      corrupted: false,
      error: null,
    };
  } catch {
    return { data: fallback, corrupted: true, error: null };
  }
}

export function savePreferences(prefs: UiPreferences): StorageSaveResult {
  return writeRawItem(STORAGE_KEYS.preferences, JSON.stringify(prefs));
}
