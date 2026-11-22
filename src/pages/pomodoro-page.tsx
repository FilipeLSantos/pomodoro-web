import { useCallback, useEffect, useMemo, useState } from 'react';
import { MobilePresetBar } from '../components/MobilePresetBar';
import { Modal, modalStyles } from '../components/modal';
import { StateInfoCard } from '../components/state-info-card';
import { TasksPanel } from '../components/TasksPanel';
import { TimerCard } from '../components/TimerCard';
import { DEFAULT_PRESETS } from '../constants/header-defaults';
import {
    BRAZILIAN_STATES_INFO,
    sortTasks,
} from '../constants/pomodoro-data';
import { MainLayout } from '../layouts';
import type { PresetOption } from '../types/header';
import type {
    StudyTask,
    TaskPriority,
    TaskStatus,
    TimerPhase,
} from '../types/pomodoro';
import styles from './pomodoro-page.module.css';

const CYCLES_BEFORE_LONG_BREAK = 4;
const TASKS_STORAGE_KEY = 'pomodoro.tarefas';

const STATUS_SEQUENCE: TaskStatus[] = [
    'A fazer',
    'Em execução',
    'Concluída',
    'Backlog',
];

function loadSavedTasks(): StudyTask[] {
    try {
        const raw = localStorage.getItem(TASKS_STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? sortTasks(parsed as StudyTask[]) : [];
    } catch {
        return [];
    }
}

function getPhaseDurationSeconds(
    preset: PresetOption,
    phase: TimerPhase
): number {
    switch (phase) {
        case 'focus':
            return preset.focusMinutes * 60;
        case 'shortBreak':
            return preset.shortBreakMinutes * 60;
        case 'longBreak':
            return preset.longBreakMinutes * 60;
    }
}

export function PomodoroPage() {
    const [presets, setPresets] = useState<PresetOption[]>(DEFAULT_PRESETS);
    const [selectedPresetId, setSelectedPresetId] = useState<string>(
        DEFAULT_PRESETS[0].id
    );
    const [phase, setPhase] = useState<TimerPhase>('focus');
    const [cycle, setCycle] = useState<number>(1);
    const [isRunning, setIsRunning] = useState<boolean>(false);

    const activePreset = useMemo(
        () => presets.find((p) => p.id === selectedPresetId) ?? presets[0],
        [presets, selectedPresetId]
    );

    const [secondsLeft, setSecondsLeft] = useState<number>(() =>
        getPhaseDurationSeconds(DEFAULT_PRESETS[0], 'focus')
    );

    const [cycleSwitchEnabled, setCycleSwitchEnabled] = useState<boolean>(true);
    const [selectedStateCode, setSelectedStateCode] = useState<string>('RJ');

    const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');
    const [newFocusMin, setNewFocusMin] = useState(25);
    const [newShortBreakMin, setNewShortBreakMin] = useState(5);
    const [newLongBreakMin, setNewLongBreakMin] = useState(15);

    const [tasks, setTasks] = useState<StudyTask[]>(loadSavedTasks);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskPriority, setTaskPriority] = useState<TaskPriority>('Alta');
    const [taskStatus, setTaskStatus] = useState<TaskStatus>('A fazer');

    useEffect(() => {
        try {
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        } catch {
            // Ignore storage quota errors
        }
    }, [tasks]);

    const activeStateInfo = useMemo(
        () =>
            BRAZILIAN_STATES_INFO.find((s) => s.code === selectedStateCode) ??
            BRAZILIAN_STATES_INFO[0],
        [selectedStateCode]
    );

    const handleNextState = useCallback(() => {
        setSelectedStateCode((currentCode) => {
            const idx = BRAZILIAN_STATES_INFO.findIndex(
                (s) => s.code === currentCode
            );
            const nextIdx = (idx + 1) % BRAZILIAN_STATES_INFO.length;
            return BRAZILIAN_STATES_INFO[nextIdx].code;
        });
    }, []);

    const advancePhase = useCallback(() => {
        setIsRunning(false);
        if (phase === 'focus') {
            if (cycleSwitchEnabled) {
                handleNextState();
            }
            if (cycle >= CYCLES_BEFORE_LONG_BREAK) {
                setPhase('longBreak');
                setSecondsLeft(getPhaseDurationSeconds(activePreset, 'longBreak'));
            } else {
                setPhase('shortBreak');
                setSecondsLeft(getPhaseDurationSeconds(activePreset, 'shortBreak'));
            }
        } else {
            const nextCycle =
                phase === 'longBreak' ? 1 : Math.min(cycle + 1, CYCLES_BEFORE_LONG_BREAK);
            setCycle(nextCycle);
            setPhase('focus');
            setSecondsLeft(getPhaseDurationSeconds(activePreset, 'focus'));
        }
    }, [activePreset, cycle, cycleSwitchEnabled, handleNextState, phase]);

    useEffect(() => {
        if (!isRunning) {
            return;
        }

        const timerId = window.setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timerId);
                    advancePhase();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(timerId);
    }, [isRunning, advancePhase]);

    const handlePresetChange = (presetId: string) => {
        if (isRunning) {
            return;
        }
        const nextPreset = presets.find((p) => p.id === presetId);
        if (!nextPreset) {
            return;
        }
        setSelectedPresetId(presetId);
        setSecondsLeft(getPhaseDurationSeconds(nextPreset, phase));
    };

    const handlePhaseChange = (nextPhase: TimerPhase) => {
        setIsRunning(false);
        setPhase(nextPhase);
        setSecondsLeft(getPhaseDurationSeconds(activePreset, nextPhase));
    };

    const handleResetCycles = () => {
        setIsRunning(false);
        setCycle(1);
        setPhase('focus');
        setSecondsLeft(getPhaseDurationSeconds(activePreset, 'focus'));
    };

    const handleEndSession = () => {
        setIsRunning(false);
        setCycle(1);
        setPhase('focus');
        setSecondsLeft(getPhaseDurationSeconds(activePreset, 'focus'));
    };

    const openNewPresetModal = () => {
        setNewPresetName('');
        setNewFocusMin(25);
        setNewShortBreakMin(5);
        setNewLongBreakMin(15);
        setIsPresetModalOpen(true);
    };

    const handleCreatePreset = (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = newPresetName.trim();
        if (!trimmed) {
            return;
        }
        const created: PresetOption = {
            id: `custom-${Date.now()}`,
            label: `${trimmed} (${newFocusMin}/${newShortBreakMin}/${newLongBreakMin})`,
            focusMinutes: newFocusMin,
            shortBreakMinutes: newShortBreakMin,
            longBreakMinutes: newLongBreakMin,
        };
        setPresets((prev) => [...prev, created]);
        setSelectedPresetId(created.id);
        if (!isRunning) {
            setSecondsLeft(getPhaseDurationSeconds(created, phase));
        }
        setIsPresetModalOpen(false);
    };

    const openAddTaskModal = () => {
        setEditingTaskId(null);
        setTaskTitle('');
        setTaskPriority('Alta');
        setTaskStatus('A fazer');
        setIsTaskModalOpen(true);
    };

    const openEditTaskModal = (task: StudyTask) => {
        setEditingTaskId(task.id);
        setTaskTitle(task.title);
        setTaskPriority(task.priority);
        setTaskStatus(task.status);
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = taskTitle.trim();
        if (!trimmed) {
            return;
        }
        if (editingTaskId) {
            setTasks((prev) =>
                sortTasks(
                    prev.map((item) =>
                        item.id === editingTaskId
                            ? {
                                ...item,
                                title: trimmed,
                                priority: taskPriority,
                                status: taskStatus,
                            }
                            : item
                    )
                )
            );
        } else {
            const created: StudyTask = {
                id: `task-${Date.now()}`,
                title: trimmed,
                priority: taskPriority,
                status: taskStatus,
            };
            setTasks((prev) => sortTasks([...prev, created]));
        }
        setIsTaskModalOpen(false);
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks((prev) => prev.filter((item) => item.id !== taskId));
    };

    const handleCycleTaskStatus = (taskId: string) => {
        setTasks((prev) =>
            sortTasks(
                prev.map((item) => {
                    if (item.id !== taskId) {
                        return item;
                    }
                    const currentIdx = STATUS_SEQUENCE.indexOf(item.status);
                    const nextStatus =
                        STATUS_SEQUENCE[(currentIdx + 1) % STATUS_SEQUENCE.length];
                    return { ...item, status: nextStatus };
                })
            )
        );
    };

    return (
        <MainLayout
            stateCode={selectedStateCode}
            headerProps={{
                presets,
                selectedPresetId: activePreset.id,
                onPresetChange: handlePresetChange,
                onNewPresetClick: openNewPresetModal,
                cycleSwitchEnabled,
                onCycleSwitchToggle: () => setCycleSwitchEnabled((prev) => !prev),
                states: BRAZILIAN_STATES_INFO,
                selectedStateCode,
                onStateChange: setSelectedStateCode,
            }}
        >
            <div className={styles.workspace}>
                <MobilePresetBar
                    presets={presets}
                    selectedPresetId={activePreset.id}
                    onPresetChange={handlePresetChange}
                    onNewPresetClick={openNewPresetModal}
                />

                <div className={styles.topStage}>
                    <div className={styles.timerSlot}>
                        <TimerCard
                            preset={activePreset}
                            phase={phase}
                            secondsLeft={secondsLeft}
                            isRunning={isRunning}
                            cycle={cycle}
                            totalCyclesBeforeLongBreak={CYCLES_BEFORE_LONG_BREAK}
                            onPhaseChange={handlePhaseChange}
                            onToggleRun={() => setIsRunning((prev) => !prev)}
                            onSkipPhase={advancePhase}
                            onResetCycles={handleResetCycles}
                            onEndSession={handleEndSession}
                        />
                    </div>

                    <div className={styles.infoSlot}>
                        <StateInfoCard
                            state={activeStateInfo}
                            onNextState={handleNextState}
                        />
                    </div>
                </div>

                <div className={styles.tasksSlot}>
                    <TasksPanel
                        tasks={tasks}
                        onAddTask={openAddTaskModal}
                        onEditTask={openEditTaskModal}
                        onDeleteTask={handleDeleteTask}
                        onCycleStatus={handleCycleTaskStatus}
                    />
                </div>
            </div>

            <Modal
                title="Novo preset"
                isOpen={isPresetModalOpen}
                onClose={() => setIsPresetModalOpen(false)}
            >
                <form className={modalStyles.form} onSubmit={handleCreatePreset}>
                    <div className={modalStyles.field}>
                        <label htmlFor="preset-name" className={modalStyles.label}>
                            Nome do preset
                        </label>
                        <input
                            id="preset-name"
                            type="text"
                            className={modalStyles.input}
                            placeholder="Ex.: Revisão Intensiva"
                            value={newPresetName}
                            onChange={(event) => setNewPresetName(event.target.value)}
                            required
                        />
                    </div>

                    <div className={modalStyles.row}>
                        <div className={modalStyles.field}>
                            <label htmlFor="preset-focus" className={modalStyles.label}>
                                Foco (min)
                            </label>
                            <input
                                id="preset-focus"
                                type="number"
                                min={1}
                                max={120}
                                className={modalStyles.input}
                                value={newFocusMin}
                                onChange={(event) => setNewFocusMin(Number(event.target.value))}
                                required
                            />
                        </div>

                        <div className={modalStyles.field}>
                            <label htmlFor="preset-short" className={modalStyles.label}>
                                Curta (min)
                            </label>
                            <input
                                id="preset-short"
                                type="number"
                                min={1}
                                max={60}
                                className={modalStyles.input}
                                value={newShortBreakMin}
                                onChange={(event) =>
                                    setNewShortBreakMin(Number(event.target.value))
                                }
                                required
                            />
                        </div>

                        <div className={modalStyles.field}>
                            <label htmlFor="preset-long" className={modalStyles.label}>
                                Longa (min)
                            </label>
                            <input
                                id="preset-long"
                                type="number"
                                min={1}
                                max={90}
                                className={modalStyles.input}
                                value={newLongBreakMin}
                                onChange={(event) =>
                                    setNewLongBreakMin(Number(event.target.value))
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className={modalStyles.footer}>
                        <button
                            type="button"
                            className={modalStyles.cancelButton}
                            onClick={() => setIsPresetModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className={modalStyles.submitButton}>
                            Salvar preset
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                title={editingTaskId ? 'Editar tarefa' : 'Nova tarefa'}
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
            >
                <form className={modalStyles.form} onSubmit={handleSaveTask}>
                    <div className={modalStyles.field}>
                        <label htmlFor="task-title" className={modalStyles.label}>
                            Descrição da tarefa
                        </label>
                        <input
                            id="task-title"
                            type="text"
                            className={modalStyles.input}
                            placeholder="Ex.: Resolver 10 exercícios de Física"
                            value={taskTitle}
                            onChange={(event) => setTaskTitle(event.target.value)}
                            required
                        />
                    </div>

                    <div className={modalStyles.twoCol}>
                        <div className={modalStyles.field}>
                            <label htmlFor="task-priority" className={modalStyles.label}>
                                Prioridade
                            </label>
                            <select
                                id="task-priority"
                                className={modalStyles.select}
                                value={taskPriority}
                                onChange={(event) =>
                                    setTaskPriority(event.target.value as TaskPriority)
                                }
                            >
                                <option value="Alta">Alta</option>
                                <option value="Média">Média</option>
                                <option value="Baixa">Baixa</option>
                            </select>
                        </div>

                        <div className={modalStyles.field}>
                            <label htmlFor="task-status" className={modalStyles.label}>
                                Estado
                            </label>
                            <select
                                id="task-status"
                                className={modalStyles.select}
                                value={taskStatus}
                                onChange={(event) =>
                                    setTaskStatus(event.target.value as TaskStatus)
                                }
                            >
                                <option value="Em execução">Em execução</option>
                                <option value="A fazer">A fazer</option>
                                <option value="Backlog">Backlog</option>
                                <option value="Concluída">Concluída</option>
                            </select>
                        </div>
                    </div>

                    <div className={modalStyles.footer}>
                        <button
                            type="button"
                            className={modalStyles.cancelButton}
                            onClick={() => setIsTaskModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className={modalStyles.submitButton}>
                            {editingTaskId ? 'Atualizar' : 'Adicionar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
}
