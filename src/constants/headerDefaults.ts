import type { BrazilianStateOption, PresetOption } from '../types/header';

export const DEFAULT_PRESETS: PresetOption[] = [
  {
    id: 'classic-study',
    name: 'Estudo Clássico',
    label: 'Estudo Clássico (25/5/15)',
    focusMinutes: 25,
    shortBreakMinutes: 5,
    cyclesBeforeLongBreak: 4,
    longBreakMinutes: 15,
  },
  {
    id: 'deep-work',
    name: 'Foco Profundo',
    label: 'Foco Profundo (50/10/20)',
    focusMinutes: 50,
    shortBreakMinutes: 10,
    cyclesBeforeLongBreak: 4,
    longBreakMinutes: 20,
  },
  {
    id: 'sprint',
    name: 'Sprint Rápido',
    label: 'Sprint Rápido (15/3/10)',
    focusMinutes: 15,
    shortBreakMinutes: 3,
    cyclesBeforeLongBreak: 4,
    longBreakMinutes: 10,
  },
];

export const DEFAULT_BRAZILIAN_STATES: BrazilianStateOption[] = [
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'BA', name: 'Bahia' },
  { code: 'PR', name: 'Paraná' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'CE', name: 'Ceará' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'DF', name: 'Distrito Federal' },
];
