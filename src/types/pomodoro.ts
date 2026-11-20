export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

export type SessionStatus = 'running' | 'paused' | 'completed';

export type TaskPriority = 'Alta' | 'Média' | 'Baixa';

export type TaskStatus =
  | 'Em execução'
  | 'A fazer'
  | 'Backlog'
  | 'Concluída'
  | 'Cancelada';

export interface StudyTask {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt?: number;
  updatedAt?: number;
}

export interface PresetSnapshot {
  name: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  longBreakMinutes: number;
}

export interface ActiveSession {
  id: string;
  presetId: string;
  snapshotPreset: PresetSnapshot;
  phase: TimerPhase;
  cycle: number;
  status: SessionStatus;
  phaseStartedAt: number;
  phaseEndsAt: number;
  pausedAt: number | null;
  remainingMsOnPause: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface UiPreferences {
  selectedPresetId: string;
  selectedStateCode: string;
  cycleSwitchEnabled: boolean;
}

export interface BrazilianStateInfo {
  code: string;
  name: string;
  region: string;
  landmark: string;
  description: string;
}
