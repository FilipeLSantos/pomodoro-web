import type { StudyTask, TaskPriority, TaskStatus } from '../../types/pomodoro';
import styles from './TasksPanel.module.css';

export interface TasksPanelProps {
    tasks: StudyTask[];
    onAddTask: () => void;
    onEditTask: (task: StudyTask) => void;
    onDeleteTask: (taskId: string) => void;
    onCycleStatus: (taskId: string) => void;
}

const PRIORITY_CLASS_MAP: Record<TaskPriority, string> = {
    Alta: styles.priorityHigh,
    Média: styles.priorityMedium,
    Baixa: styles.priorityLow,
};

const STATUS_CLASS_MAP: Record<TaskStatus, string> = {
    'Em execução': styles.statusRunning,
    'A fazer': styles.statusTodo,
    Concluída: styles.statusCompleted,
    Backlog: styles.statusBacklog,
};

export function TasksPanel({
    tasks,
    onAddTask,
    onEditTask,
    onDeleteTask,
    onCycleStatus,
}: TasksPanelProps) {
    return (
        <section className={styles.tasksPanel}>
            <h2 className={styles.tasksPanelTitle}>Tarefas</h2>

            {tasks.length === 0 && (
                <p className={styles.emptyTasks}>
                    Nenhuma tarefa cadastrada. Clique em &quot;+ Nova tarefa&quot; para
                    começar.
                </p>
            )}

            {tasks.map((task) => (
                <div key={task.id} className={styles.taskCard}>
                    <p className={styles.taskTitle}>{task.title}</p>

                    <span
                        className={`${styles.taskInfo} ${PRIORITY_CLASS_MAP[task.priority]}`}
                    >
                        {task.priority}
                    </span>

                    <button
                        type="button"
                        className={`${styles.taskInfo} ${styles.statusButton} ${STATUS_CLASS_MAP[task.status]}`}
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
            ))}

            <button
                type="button"
                className={styles.newTaskButton}
                onClick={onAddTask}
            >
                + Nova tarefa
            </button>
        </section>
    );
}
