# Pomodoro Brasil — Gestão de Foco

Aplicação web para organizar sessões de estudo com a técnica Pomodoro, desenvolvida para o Projeto 2 da disciplina. Funciona diretamente no navegador, com interface em português, sem necessidade de cadastro ou instalação.

## Tecnologias

- **React + TypeScript** para componentes, interface e lógica.
- **Vite** para desenvolvimento e compilação.
- **CSS Modules** para estilos e layout responsivo.
- **localStorage** para salvar temporizadores, tarefas e a sessão ativa.
- **Web Audio API** para o alerta sonoro ao finalizar uma fase (sujeito às permissões de áudio do navegador).

## Executar localmente

É necessário ter Node.js e npm instalados.

```bash
npm install
npm run dev
```

Abra no navegador o endereço exibido pelo Vite (geralmente `http://localhost:5173`).

Para verificar a versão final do projeto:

```bash
npm run build
npm run lint
npm run preview
```

## Funcionalidades

- Cadastrar, editar, excluir e selecionar temporizadores personalizados (foco, pausa curta, ciclos e pausa longa).
- Impedir edição/exclusão do temporizador que estiver em uma sessão ativa.
- Iniciar, pausar, retomar, pular fases, reiniciar ciclos e encerrar sessões.
- Ao trocar de temporizador durante uma sessão, encerrar o anterior e iniciar o novo.
- Restaurar o tempo correto ao reabrir o navegador, com opção de descartar a sessão recuperada.
- Emitir alerta sonoro ao fim de uma fase, após interação com a página.
- Cadastrar, editar, excluir e atualizar tarefas com prioridade e estado.
- Ordenação fixa das tarefas: prioridade **Alta → Média → Baixa**, depois estado **A fazer → Em execução → Concluída → Cancelada → Backlog**.
- Exigir confirmação antes de excluir temporizadores, excluir tarefas, reiniciar ciclos ou encerrar sessão.
- Exibir o cronômetro centralizado, o cenário à direita e o painel de tarefas abaixo do cronômetro no desktop, adaptando o layout em telas menores.

## Hospedagem

A aplicação está hospedada no **Netlify**, permitindo que os usuários acessem suas funcionalidades diretamente pelo navegador, sem necessidade de instalação.

**Link da aplicação:** https://pomodorobrasil.netlify.app/

## Decisões técnicas

A aplicação foi desenvolvida com React e TypeScript, utilizando o Netlify para hospedagem. Não possui backend nem banco de dados remoto.

Os dados são armazenados localmente no navegador, utilizando o `localStorage`, nas seguintes chaves:

- `pomodoro.presets`: temporizadores personalizados.
- `pomodoro.tarefas`: tarefas cadastradas.
- `pomodoro.sessaoAtiva`: sessão em andamento.
- `pomodoro.preferencias`: preferências da aplicação.

Essa abordagem permite preservar os dados após o fechamento ou a atualização da página, desde que o armazenamento do navegador seja mantido. Não há sincronização entre dispositivos.

O temporizador utiliza **timestamps absolutos**, em vez de depender somente de um contador decrementado a cada segundo. Dessa forma, o tempo pode ser recalculado após o fechamento do navegador ou a suspensão da aba. Uma sessão pausada permanece pausada ao reabrir a aplicação.

Ao iniciar uma sessão, os parâmetros do temporizador são copiados para um *snapshot*, preservando suas configurações durante a execução.

O código foi organizado em:

- `src/domain/sessionEngine.ts`: regras de sessões e transições de fases.
- `src/storage/pomodoroStorage.ts`: leitura, gravação e validação de dados no `localStorage`.
- `src/pages/pomodoro-page.tsx`: estados da página e eventos da interface.
- `src/components/`: componentes do temporizador, seleção de presets, tarefas e modais.

## Organização da equipe

| Integrante | Responsabilidade |
| --- | --- |
| Filipe | Organização do repositório, integração e hospedagem |
| Robert | Criação de componentes, testes e revisão final |
| Iago | Implementação do temporizador e das sessões |
| Stefano | Implementação de componentes da interface |

## Verificações sugeridas

1. Criar um preset com 1 minuto de foco, 1 minuto de pausa e 2 ciclos. Editar, recarregar e confirmar persistência.
2. Tentar editar/excluir o preset em execução e confirmar que as ações estão bloqueadas.
3. Pausar, recarregar e verificar que a sessão permanece pausada com o tempo preservado.
4. Iniciar uma sessão, fechar/reabrir a página e verificar que o tempo é corrigido automaticamente.
5. Criar tarefas com prioridades e estados diferentes, recarregar e verificar a ordenação.
6. Cancelar uma exclusão e confirmar que o item não foi removido.
7. Testar em janela estreita e verificar que o painel de tarefas continua acessível e aparece abaixo do cronômetro.

A reprodução automática de áudio pode ser restringida pelo navegador; iniciar uma sessão por clique habilita o contexto de áudio quando permitido.
