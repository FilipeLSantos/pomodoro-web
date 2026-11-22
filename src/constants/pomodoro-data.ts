import type {
    BrazilianStateInfo,
    StudyTask,
    TaskPriority,
    TaskStatus,
} from "../types/pomodoro";

export const BRAZILIAN_STATES_INFO: BrazilianStateInfo[] = [
    {
        code: "AC",
        name: "Acre",
        region: "Região Norte",
        landmark: "Parque Nacional da Serra do Divisor e Rio Branco",
        description:
        "Situado no extremo oeste da Amazônia brasileira, o Acre destaca-se pela preservação florestal, pela história dos seringais e pela rica biodiversidade.",
    },
    {
        code: "AL",
        name: "Alagoas",
        region: "Região Nordeste",
        landmark: "Praia do Francês e Cânions do São Francisco",
        description:
        "Famosa por suas lagoas, arrecifes e águas em tons turquesa, Alagoas combina litoral paradisíaco com o patrimônio histórico de Marechal Deodoro e Penedo.",
    },
    {
        code: "AP",
        name: "Amapá",
        region: "Região Norte",
        landmark: "Fortaleza de São José de Macapá e Marco Zero",
        description:
        "Cortado pela Linha do Equador, o Amapá possui grande parte do território preservado e abriga o encontro do rio Amazonas com o oceano Atlântico.",
    },
    {
        code: "AM",
        name: "Amazonas",
        region: "Região Norte",
        landmark: "Encontro das Águas e Teatro Amazonas",
        description:
        "Coração da maior floresta tropical do planeta, o Amazonas possui rios monumentais e uma biodiversidade incomparável no mundo.",
    },
    {
        code: "BA",
        name: "Bahia",
        region: "Região Nordeste",
        landmark: "Pelourinho e Chapada Diamantina",
        description:
        "Berço da história brasileira, a Bahia combina litoral extenso, cachoeiras monumentais na Chapada Diamantina e forte herança cultural afro-brasileira.",
    },
    {
        code: "CE",
        name: "Ceará",
        region: "Região Nordeste",
        landmark: "Jericoacoara e Praia de Canoa Quebrada",
        description:
        "Banhado por ventos constantes e falésias coloridas, o Ceará é referência nacional em educação, energia renovável e paisagens de dunas e lagoas.",
    },
    {
        code: "DF",
        name: "Distrito Federal",
        region: "Região Centro-Oeste",
        landmark: "Congresso Nacional e Lago Paranoá",
        description:
        "Projetada por Lúcio Costa e Oscar Niemeyer, Brasília é Patrimônio Cultural da Humanidade e símbolo do modernismo brasileiro.",
    },
    {
        code: "ES",
        name: "Espírito Santo",
        region: "Região Sudeste",
        landmark: "Convento da Penha e Pedra Azul",
        description:
        "Entre praias urbanas e montanhas de clima ameno na região serrana, o Espírito Santo reúne forte cultura capixaba e uma das mais belas costas do Sudeste.",
    },
    {
        code: "GO",
        name: "Goiás",
        region: "Região Centro-Oeste",
        landmark: "Chapada dos Veadeiros e Cidade de Goiás",
        description:
        "Coração do Cerrado brasileiro, Goiás abriga cachoeiras de águas cristalinas, águas termais e centros históricos reconhecidos como patrimônio mundial.",
    },
    {
        code: "MA",
        name: "Maranhão",
        region: "Região Nordeste",
        landmark: "Lençóis Maranhenses e Centro Histórico de São Luís",
        description:
        "Ponto de transição entre o Nordeste e a Amazônia, o Maranhão encanta com dunas e lagoas sazonais, azulejos coloniais e tradições como o bumba meu boi.",
    },
    {
        code: "MT",
        name: "Mato Grosso",
        region: "Região Centro-Oeste",
        landmark: "Pantanal Norte e Chapada dos Guimarães",
        description:
        "Único estado a reunir Amazônia, Cerrado e Pantanal, o Mato Grosso é referência mundial em biodiversidade, paredões de arenito e rios de águas transparentes.",
    },
    {
        code: "MS",
        name: "Mato Grosso do Sul",
        region: "Região Centro-Oeste",
        landmark: "Bonito e Pantanal Sul",
        description:
        "Referência internacional em ecoturismo, o Mato Grosso do Sul abriga nascentes cristalinas, grutas submersas e a maior planície alagável do planeta.",
    },
    {
        code: "MG",
        name: "Minas Gerais",
        region: "Região Sudeste",
        landmark: "Ouro Preto e Serra do Cipó",
        description:
        "Famosa pelas cidades históricas barrocas, montanhas e culinária acolhedora, Minas Gerais concentra algumas das maiores reservas de biodiversidade do Cerrado.",
    },
    {
        code: "PA",
        name: "Pará",
        region: "Região Norte",
        landmark: "Mercado Ver-o-Peso e Ilha de Marajó",
        description:
        "Com gastronomia marcante e rios imensos, o Pará é palco do Círio de Nazaré e guarda a maior ilha fluviomarinha do mundo, além de praias de água doce.",
    },
    {
        code: "PB",
        name: "Paraíba",
        region: "Região Nordeste",
        landmark: "Ponta do Seixas e Centro Histórico de João Pessoa",
        description:
        "Onde o sol nasce primeiro nas Américas, a Paraíba mistura falésias coloridas, piscinas naturais e o maior São João do mundo em Campina Grande.",
    },
    {
        code: "PR",
        name: "Paraná",
        region: "Região Sul",
        landmark: "Cataratas do Iguaçu e Jardim Botânico",
        description:
        "Lar de uma das Sete Maravilhas Naturais do Mundo, o Paraná destaca-se pela preservação da Mata Atlântica e pela arquitetura planejada de Curitiba.",
    },
    {
        code: "PE",
        name: "Pernambuco",
        region: "Região Nordeste",
        landmark: "Recife Antigo e Fernando de Noronha",
        description:
        "Reconhecido pelo frevo, maracatu e pontes históricas, Pernambuco também abriga o arquipélago de Fernando de Noronha, santuário marinho mundial.",
    },
    {
        code: "PI",
        name: "Piauí",
        region: "Região Nordeste",
        landmark: "Serra da Capivara e Delta do Parnaíba",
        description:
        "Dono de um dos sítios arqueológicos mais antigos das Américas, o Piauí une cânions, pinturas rupestres milenares e o único delta em mar aberto das Américas.",
    },
    {
        code: "RJ",
        name: "Rio de Janeiro",
        region: "Região Sudeste",
        landmark: "Corcovado e Baía de Guanabara",
        description:
        "Localizado na Região Sudeste, o Rio abriga a Floresta da Tijuca — uma das maiores florestas urbanas do mundo — e 92 municípios entre praias e serras.",
    },
    {
        code: "RN",
        name: "Rio Grande do Norte",
        region: "Região Nordeste",
        landmark: "Morro do Careca e Parrachos de Maracajaú",
        description:
        "Conhecido como a esquina do continente, o Rio Grande do Norte destaca-se pelas dunas móveis, falésias, ventos constantes e forte produção de energia eólica.",
    },
    {
        code: "RS",
        name: "Rio Grande do Sul",
        region: "Região Sul",
        landmark: "Serra Gaúcha e Cânion Itaimbezinho",
        description:
        "Com forte influência das tradições campeiras e europeias, o estado reúne cânions impressionantes, vinhedos na serra e extensos pampas.",
    },
    {
        code: "RO",
        name: "Rondônia",
        region: "Região Norte",
        landmark: "Rio Madeira e Forte Príncipe da Beira",
        description:
        "Localizada na Amazônia Ocidental, Rondônia reúne rios caudalosos, unidades de conservação ambiental e marcos históricos da antiga Estrada de Ferro Madeira-Mamoré.",
    },
    {
        code: "RR",
        name: "Roraima",
        region: "Região Norte",
        landmark: "Monte Roraima e Parque Nacional do Viruá",
        description:
        "Estado mais setentrional do Brasil, Roraima abriga o imponente Monte Roraima — uma das formações geológicas mais antigas da Terra — e vastos lavrados amazônicos.",
    },
    {
        code: "SC",
        name: "Santa Catarina",
        region: "Região Sul",
        landmark: "Serra do Rio do Rastro e Ilha de Santa Catarina",
        description:
        "Com forte contraste entre praias recortadas e serras que registram geada e neve no inverno, Santa Catarina une tradição europeia e belezas naturais.",
    },
    {
        code: "SP",
        name: "São Paulo",
        region: "Região Sudeste",
        landmark: "Avenida Paulista e Parque Ibirapuera",
        description:
        "Principal polo financeiro e cultural do país, São Paulo reúne 645 municípios, museus icônicos e uma das maiores diversidades gastronômicas do mundo.",
    },
    {
        code: "SE",
        name: "Sergipe",
        region: "Região Nordeste",
        landmark: "Cânion do Xingó e Orla de Atalaia",
        description:
        "Menor estado brasileiro em extensão territorial, Sergipe guarda cidades históricas como São Cristóvão, além de manguezais, praias tranquilas e o rio São Francisco.",
    },
    {
        code: "TO",
        name: "Tocantins",
        region: "Região Norte",
        landmark: "Jalapão e Serra Geral",
        description:
        "Estado mais jovem do país, o Tocantins é famoso pelos fervedouros de águas cristalinas, dunas douradas do Jalapão e pela cidade planejada de Palmas.",
    },
];

const PRIORITY_RANK: Record<TaskPriority, number> = {
    Alta: 0,
    Média: 1,
    Baixa: 2,
};

const STATUS_RANK: Record<TaskStatus, number> = {
    'Em execução': 0,
    'A fazer': 1,
    Backlog: 2,
    Concluída: 3,
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