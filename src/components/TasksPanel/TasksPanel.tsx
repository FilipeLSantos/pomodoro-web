import type { StudyTask, TaskPriority, TaskStatus } from '../../types/pomodoro';
import styles from './TasksPanel.module.css';

export interface TasksPanelProps {
  tasks: StudyTask[];
  onAddTask: () => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (taskId: string) => void;
  onCycleStatus: (taskId: string) => void;
}

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  Alta: styles.priorityHigh,
  Média: styles.priorityMedium,
  Baixa: styles.priorityLow,
};

const STATUS_CLASS: Record<TaskStatus, string> = {
  'Em execução': styles.statusRunning,
  'A fazer': styles.statusTodo,
  Backlog: styles.statusMuted,
  Concluída: styles.statusMuted,
};

export function TasksPanel({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onCycleStatus,
}: TasksPanelProps) {
  return (
    <section className={styles.panel} aria-label="Tarefas de Estudo">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Tarefas de Estudo</h2>
          <span className={styles.subtitle}>
            • Ordenação fixa: prioridade e estado
          </span>
        </div>

        <button type="button" className={styles.addButton} onClick={onAddTask}>
          <span className={styles.addLabelDesktop}>+ Nova tarefa</span>
          <span className={styles.addLabelMobile}>+ Nova</span>
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className={styles.emptyState}>
          Nenhuma tarefa cadastrada. Clique em &ldquo;+ Nova tarefa&rdquo; para
          começar.
        </p>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => {
            const rowClasses = [styles.row];
            if (task.status === 'Em execução') {
              rowClasses.push(styles.rowActive);
            } else if (task.status === 'Concluída') {
              rowClasses.push(styles.rowCompleted);
            }

            return (
              <li key={task.id} className={rowClasses.join(' ')}>
                <p
                  className={
                    task.status === 'Concluída'
                      ? `${styles.taskTitle} ${styles.taskTitleCompleted}`
                      : styles.taskTitle
                  }
                >
                  {task.title}
                </p>

                <div className={styles.rowMeta}>
                  <div className={styles.badges}>
                    <span
                      className={`${styles.badge} ${PRIORITY_CLASS[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    <button
                      type="button"
                      title="Alterar estado da tarefa"
                      className={`${styles.badge} ${styles.statusButton} ${STATUS_CLASS[task.status]}`}
                      onClick={() => onCycleStatus(task.id)}
                    >
                      {task.status}
                    </button>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => onEditTask(task)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => onDeleteTask(task.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
