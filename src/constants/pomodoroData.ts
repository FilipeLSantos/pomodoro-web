import type {
  BrazilianStateInfo,
  StudyTask,
  TaskPriority,
  TaskStatus,
} from '../types/pomodoro';

export const BRAZILIAN_STATES_INFO: BrazilianStateInfo[] = [
  {
    code: 'RJ',
    name: 'Rio de Janeiro',
    region: 'Região Sudeste',
    landmark: 'Corcovado e Baía de Guanabara',
    description:
      'Localizado na Região Sudeste, o Rio abriga a Floresta da Tijuca — uma das maiores florestas urbanas do mundo — e 92 municípios entre praias e serras.',
  },
  {
    code: 'SP',
    name: 'São Paulo',
    region: 'Região Sudeste',
    landmark: 'Avenida Paulista e Parque Ibirapuera',
    description:
      'Principal polo financeiro e cultural do país, São Paulo reúne 645 municípios, museus icônicos e uma das maiores diversidades gastronômicas do mundo.',
  },
  {
    code: 'MG',
    name: 'Minas Gerais',
    region: 'Região Sudeste',
    landmark: 'Ouro Preto e Serra do Cipó',
    description:
      'Famosa pelas cidades históricas barrocas, montanhas e culinária acolhedora, Minas Gerais concentra algumas das maiores reservas de biodiversidade do Cerrado.',
  },
  {
    code: 'BA',
    name: 'Bahia',
    region: 'Região Nordeste',
    landmark: 'Pelourinho e Chapada Diamantina',
    description:
      'Berço da história brasileira, a Bahia combina litoral extenso, cachoeiras monumentais na Chapada Diamantina e forte herança cultural afro-brasileira.',
  },
  {
    code: 'PR',
    name: 'Paraná',
    region: 'Região Sul',
    landmark: 'Cataratas do Iguaçu e Jardim Botânico',
    description:
      'Lar de uma das Sete Maravilhas Naturais do Mundo, o Paraná destaca-se pela preservação da Mata Atlântica e pela arquitetura planejada de Curitiba.',
  },
  {
    code: 'RS',
    name: 'Rio Grande do Sul',
    region: 'Região Sul',
    landmark: 'Serra Gaúcha e Cânion Itaimbezinho',
    description:
      'Com forte influência das tradições campeiras e europeias, o estado reúne cânions impressionantes, vinhedos na serra e extensos pampas.',
  },
  {
    code: 'PE',
    name: 'Pernambuco',
    region: 'Região Nordeste',
    landmark: 'Recife Antigo e Fernando de Noronha',
    description:
      'Reconhecido pelo frevo, maracatu e pontes históricas, Pernambuco também abriga o arquipélago de Fernando de Noronha, santuário marinho mundial.',
  },
  {
    code: 'CE',
    name: 'Ceará',
    region: 'Região Nordeste',
    landmark: 'Jericoacoara e Praia de Canoa Quebrada',
    description:
      'Banhado por ventos constantes e falésias coloridas, o Ceará é referência nacional em educação, energia renovável e paisagens de dunas e lagoas.',
  },
  {
    code: 'AM',
    name: 'Amazonas',
    region: 'Região Norte',
    landmark: 'Encontro das Águas e Teatro Amazonas',
    description:
      'Coração da maior floresta tropical do planeta, o Amazonas possui rios monumentais e uma biodiversidade incomparável no mundo.',
  },
  {
    code: 'DF',
    name: 'Distrito Federal',
    region: 'Região Centro-Oeste',
    landmark: 'Congresso Nacional e Lago Paranoá',
    description:
      'Projetada por Lúcio Costa e Oscar Niemeyer, Brasília é Patrimônio Cultural da Humanidade e símbolo do modernismo brasileiro.',
  },
];

export const INITIAL_TASKS: StudyTask[] = [
  {
    id: 'task-1',
    title: 'Resolver 20 questões de Cálculo Diferencial',
    priority: 'Alta',
    status: 'A fazer',
  },
  {
    id: 'task-2',
    title: 'Revisar resumo de Direito Constitucional',
    priority: 'Alta',
    status: 'Em execução',
  },
  {
    id: 'task-3',
    title: 'Fichamento do capítulo 4 de História do Brasil',
    priority: 'Média',
    status: 'A fazer',
  },
  {
    id: 'task-4',
    title: 'Organizar cronograma semanal de simulados',
    priority: 'Média',
    status: 'Concluída',
  },
  {
    id: 'task-5',
    title: 'Ler artigo complementar de sociologia urbana',
    priority: 'Baixa',
    status: 'Backlog',
  },
];

const PRIORITY_RANK: Record<TaskPriority, number> = {
  Alta: 0,
  Média: 1,
  Baixa: 2,
};

const STATUS_RANK: Record<TaskStatus, number> = {
  'A fazer': 0,
  'Em execução': 1,
  Concluída: 2,
  Cancelada: 3,
  Backlog: 4,
};

export function sortTasks(tasks: StudyTask[]): StudyTask[] {
  return [...tasks].sort((a, b) => {
    const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return STATUS_RANK[a.status] - STATUS_RANK[b.status];
  });
}
