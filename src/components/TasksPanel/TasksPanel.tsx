import type { StudyTask, TaskPriority, TaskStatus } from "../../types/pomodoro";
import styles from "./TasksPanel.module.css";

export interface TasksPanelProps {
  tasks: StudyTask[];
  onAddTask: () => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (taskId: string) => void;
  onCycleStatus: (taskId: string) => void;
}

function getPriorityClass(priority: TaskPriority): string {
  if (priority === "Alta") return styles.priorityHigh;
  if (priority === "Média") return styles.priorityMedium;
  return styles.priorityLow;
}

function getStatusClass(status: TaskStatus): string {
  if (status === "Em execução") return styles.statusRunning;
  if (status === "A fazer") return styles.statusTodo;
  if (status === "Concluída") return styles.statusCompleted;
  if (status === "Cancelada") return styles.statusCancelled;
  return styles.statusBacklog;
}

export function TasksPanel({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onCycleStatus,
}: TasksPanelProps) {
  return (
    <section className={styles.tasksPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.titleGroup}>
          <h2 className={styles.tasksPanelTitle}>Tarefas de Estudo</h2>
          <span className={styles.panelSubtitle}>
            • Ordenação fixa: prioridade e estado
          </span>
        </div>
        <button
          type="button"
          className={styles.newTaskButton}
          onClick={onAddTask}
        >
          <span className={styles.newTaskLabelDesktop}>+ Nova tarefa</span>
          <span className={styles.newTaskLabelMobile}>+ Nova</span>
        </button>
      </div>

      {tasks.length === 0 && (
        <p className={styles.emptyTasks}>
          Nenhuma tarefa cadastrada. Clique em &quot;+ Nova tarefa&quot; para
          começar.
        </p>
      )}

      {tasks.map((task) => {
        const isCompleted = task.status === "Concluída";
        return (
          <div
            key={task.id}
            className={
              isCompleted
                ? `${styles.taskCard} ${styles.taskCardCompleted}`
                : styles.taskCard
            }
          >
            <p
              className={
                isCompleted
                  ? `${styles.taskTitle} ${styles.taskTitleCompleted}`
                  : styles.taskTitle
              }
            >
              {task.title}
            </p>

            <span
              className={`${styles.taskInfo} ${getPriorityClass(task.priority)}`}
            >
              {task.priority}
            </span>

            <button
              type="button"
              className={`${styles.taskInfo} ${styles.statusButton} ${getStatusClass(task.status)}`}
              onClick={() => onCycleStatus(task.id)}
              title="Clique para alternar o estado"
            >
              {task.status}
            </button>

            <button
              type="button"
              className={`${styles.taskButton} ${styles.editButton}`}
              onClick={() => onEditTask(task)}
            >
              Editar
            </button>

            <button
              type="button"
              className={`${styles.taskButton} ${styles.deleteButton}`}
              onClick={() => onDeleteTask(task.id)}
            >
              Excluir
            </button>
          </div>
        );
      })}
    </section>
  );
}
