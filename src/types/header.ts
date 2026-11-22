export interface PresetOption {
  id: string;
  name?: string;
  label: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  cyclesBeforeLongBreak?: number;
  longBreakMinutes: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface BrazilianStateOption {
  code: string;
  name: string;
}