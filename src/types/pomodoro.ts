export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

export type TaskPriority = 'Alta' | 'Média' | 'Baixa';

export type TaskStatus = 'Em execução' | 'A fazer' | 'Backlog' | 'Concluída';

export interface StudyTask {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface BrazilianStateInfo {
  code: string;
  name: string;
  region: string;
  landmark: string;
  description: string;
}
