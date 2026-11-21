import type React from "react";
import { useState, useEffect } from "react";
import "./TasksPanel.css";

type Tarefa = {
  id: string;
  titulo: string;
  estado: EstadoTarefa;
  prioridade: Prioridade;
  criadaEm: string;
  atualizadaEm: string;
};

type EstadoTarefa =
  | "backlog"
  | "aFazer"
  | "emExecucao"
  | "concluida"
  | "cancelada";

type Prioridade = "baixa" | "media" | "alta";

const ordemPrioridade: Prioridade[] = ["alta", "media", "baixa"];

const ordemEstado: EstadoTarefa[] = [
  "aFazer",
  "emExecucao",
  "concluida",
  "cancelada",
  "backlog",
];

function TasksPanel(): React.JSX.Element {
  const [criandoTarefa, setCriandoTarefa] = useState<boolean>(false);
  const [tarefas, setTarefas] = useState<Tarefa[]>(() => {
    const tarefasSalvas = localStorage.getItem("pomodoro.tarefas");

    if (tarefasSalvas) {
      return JSON.parse(tarefasSalvas) as Tarefa[];
    }

    return [];
  });

  const [titulo, setTitulo] = useState<string>("");
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoTarefa>("backlog");
  const [prioridade, setPrioridade] = useState<Prioridade>("media");

  useEffect(() => {
    localStorage.setItem("pomodoro.tarefas", JSON.stringify(tarefas));
  }, [tarefas]);

  function handleNovaTarefa(): void {
    setCriandoTarefa(true);
    setIdEditando(null);
    setTitulo("");
    setEstado("backlog");
    setPrioridade("media");
  }

  function handleSalvarTarefa(): void {
    if (titulo.trim().length === 0) {
      window.alert("O título da tarefa é obrigatório.");
      return;
    }

    const agora = new Date().toISOString();

    const novaTarefa: Tarefa = {
      id: crypto.randomUUID(),
      titulo: titulo.trim(),
      estado: estado,
      prioridade: prioridade,
      criadaEm: agora,
      atualizadaEm: agora,
    };

    setTarefas((tarefasAnteriores) => [...tarefasAnteriores, novaTarefa]);

    setTitulo("");
    setCriandoTarefa(false);
  }

  function handleExcluirTarefa(id: string): void {
    const confirmou = window.confirm(
      "Tem certeza que deseja excluir esta tarefa?",
    );

    if (!confirmou) return;

    setTarefas((tarefasAnteriores) =>
      tarefasAnteriores.filter((tarefa) => tarefa.id !== id),
    );

    if (idEditando === id) {
      setIdEditando(null);
      setTitulo("");
    }
  }

  function handleEditarTarefa(id: string): void {
    const tarefaParaEditar = tarefas.find((tarefa) => tarefa.id === id);

    if (tarefaParaEditar) {
      setTitulo(tarefaParaEditar.titulo);
      setEstado(tarefaParaEditar.estado);
      setPrioridade(tarefaParaEditar.prioridade);
      setIdEditando(id);
      setCriandoTarefa(false);
    }
  }

  function handleSalvarEdicao(): void {
    if (idEditando === null) return;

    if (titulo.trim().length === 0) {
      window.alert("O título da tarefa é obrigatório.");
      return;
    }

    const agora = new Date().toISOString();
    setTarefas((tarefasAnteriores) =>
      tarefasAnteriores.map((tarefa) => {
        if (tarefa.id === idEditando) {
          return {
            ...tarefa,
            titulo: titulo.trim(),
            estado: estado,
            prioridade: prioridade,
            atualizadaEm: agora,
          };
        }
        return tarefa;
      }),
    );

    setTitulo("");
    setIdEditando(null);
  }

  function handleCancelar(): void {
    setCriandoTarefa(false);
    setIdEditando(null);
    setTitulo("");
  }

  function ordenarTarefas(lista: Tarefa[]): Tarefa[] {
    return [...lista].sort((a, b) => {
      const prioridadeA = ordemPrioridade.indexOf(a.prioridade);

      const prioridadeB = ordemPrioridade.indexOf(b.prioridade);

      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;

      const estadoA = ordemEstado.indexOf(a.estado);

      const estadoB = ordemEstado.indexOf(b.estado);

      return estadoA - estadoB;
    });
  }

  function mostrarEstado(estado: EstadoTarefa): string {
    if (estado === "backlog") return "Backlog";
    if (estado === "aFazer") return "A fazer";
    if (estado === "emExecucao") return "Em execução";
    if (estado === "concluida") return "Concluída";

    return "Cancelada";
  }

  function mostrarPrioridade(prioridade: Prioridade): string {
    if (prioridade === "baixa") return "Baixa";
    if (prioridade === "media") return "Média";
    return "Alta";
  }

  return (
    <section className="tasks-panel">
      <h2 className="tasks-panel-title">Tarefas</h2>

      {tarefas.length === 0 && (
        <p className="empty-tasks">
          Nenhuma tarefa cadastrada. Clique em "+ Nova Tarefa" para começar
        </p>
      )}

      {ordenarTarefas(tarefas).map((tarefa) => (
        <div key={tarefa.id} className="task-card">
          <p className="task-title">{tarefa.titulo}</p>
          <p
            className={
              tarefa.prioridade === "alta"
                ? "task-info priority-high"
                : tarefa.prioridade === "media"
                  ? "task-info priority-medium"
                  : "task-info priority-low"
            }
          >
            {mostrarPrioridade(tarefa.prioridade)}
          </p>
          <p
            className={
              tarefa.estado === "emExecucao"
                ? "task-info status-running"
                : tarefa.estado === "aFazer"
                  ? "task-info status-todo"
                  : tarefa.estado === "concluida"
                    ? "task-info status-completed"
                    : tarefa.estado === "cancelada"
                      ? "task-info status-cancelled"
                      : "task-info status-backlog"
            }
          >
            {mostrarEstado(tarefa.estado)}
          </p>

          <button
            className="task-button edit-button"
            onClick={() => handleEditarTarefa(tarefa.id)}
          >
            Editar
          </button>

          <button
            className="task-button delete-button"
            onClick={() => handleExcluirTarefa(tarefa.id)}
          >
            Excluir
          </button>
        </div>
      ))}

      {idEditando !== null && (
        <div className="task-form">
          <input
            className="task-input"
            type="text"
            value={titulo}
            maxLength={100}
            onChange={(evento) => setTitulo(evento.target.value)}
          />
          <select
            className="task-select"
            value={estado}
            onChange={(evento) =>
              setEstado(evento.target.value as EstadoTarefa)
            }
          >
            <option value="backlog">Backlog</option>
            <option value="aFazer">A fazer</option>
            <option value="emExecucao">Em execução</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <select
            className="task-select"
            value={prioridade}
            onChange={(evento) =>
              setPrioridade(evento.target.value as Prioridade)
            }
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>

          <button className="save-button" onClick={handleSalvarEdicao}>
            Salvar edição
          </button>
          <button className="cancel-button" onClick={handleCancelar}>
            Cancelar
          </button>
        </div>
      )}

      <button className="new-task-button" onClick={handleNovaTarefa}>
        Nova tarefa
      </button>

      {criandoTarefa && (
        <div className="task-form">
          <input
            className="task-input"
            type="text"
            value={titulo}
            maxLength={100}
            onChange={(evento) => setTitulo(evento.target.value)}
          />
          <select
            className="task-select"
            value={estado}
            onChange={(evento) =>
              setEstado(evento.target.value as EstadoTarefa)
            }
          >
            <option value="backlog">Backlog</option>
            <option value="aFazer">A fazer</option>
            <option value="emExecucao">Em execução</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <select
            className="task-select"
            value={prioridade}
            onChange={(evento) =>
              setPrioridade(evento.target.value as Prioridade)
            }
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>

          <button className="save-button" onClick={handleSalvarTarefa}>
            Salvar
          </button>
          <button className="cancel-button" onClick={handleCancelar}>
            Cancelar
          </button>
        </div>
      )}
    </section>
  );
}

export default TasksPanel;
