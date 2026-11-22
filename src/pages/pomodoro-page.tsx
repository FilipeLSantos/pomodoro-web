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
import {
    DEFAULT_CYCLES_BEFORE_LONG_BREAK,
    createActiveSession,
    getPhaseDurationSeconds,
    getRemainingSeconds,
    pauseSession,
    reconcileSessionWithNow,
    resetSessionCycles,
    resumeSession,
    setSessionPhase,
    skipSessionPhase,
} from '../domain';
import { MainLayout } from '../layouts';
import {
    loadActiveSession,
    loadPreferences,
    loadPresets,
    loadTasks,
    saveActiveSession,
    savePreferences,
    savePresets,
    saveTasks,
} from '../storage';
import type { PresetOption } from '../types/header';
import type {
    ActiveSession,
    StudyTask,
    TaskPriority,
    TaskStatus,
    TimerPhase,
} from '../types/pomodoro';
import styles from './pomodoro-page.module.css';

const DEFAULT_STATE_CODE = 'RJ';

const STATUS_SEQUENCE: TaskStatus[] = [
    'A fazer',
    'Em execução',
    'Concluída',
    'Backlog',
];

function createId(prefix: string): string {
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function stepStateCode(currentCode: string, steps: number): string {
    if (BRAZILIAN_STATES_INFO.length === 0) {
        return currentCode;
    }
    const idx = BRAZILIAN_STATES_INFO.findIndex((s) => s.code === currentCode);
    const baseIdx = idx >= 0 ? idx : 0;
    const nextIdx = (baseIdx + steps) % BRAZILIAN_STATES_INFO.length;
    return BRAZILIAN_STATES_INFO[nextIdx].code;
}

function isValidMinutes(value: number, min: number, max: number): boolean {
    return Number.isInteger(value) && value >= min && value <= max;
}

interface InitialPomodoroState {
    presets: PresetOption[];
    selectedPresetId: string;
    selectedStateCode: string;
    cycleSwitchEnabled: boolean;
    activeSession: ActiveSession | null;
    tasks: StudyTask[];
}

function loadInitialPomodoroState(): InitialPomodoroState {
    const loadedPresets = loadPresets(DEFAULT_PRESETS).data;
    const loadedPrefs = loadPreferences({
        selectedPresetId: loadedPresets[0].id,
        selectedStateCode: DEFAULT_STATE_CODE,
        cycleSwitchEnabled: true,
    }).data;

    const validPresetId = loadedPresets.some(
        (p) => p.id === loadedPrefs.selectedPresetId
    )
        ? loadedPrefs.selectedPresetId
        : loadedPresets[0].id;

    let validStateCode = BRAZILIAN_STATES_INFO.some(
        (s) => s.code === loadedPrefs.selectedStateCode
    )
        ? loadedPrefs.selectedStateCode
        : DEFAULT_STATE_CODE;

    const loadedSession = loadActiveSession().data;
    let activeSession: ActiveSession | null = null;

    if (loadedSession) {
        const reconciled = reconcileSessionWithNow(loadedSession, Date.now());
        if (
            reconciled.completedFocusPhases > 0 &&
            loadedPrefs.cycleSwitchEnabled
        ) {
            validStateCode = stepStateCode(
                validStateCode,
                reconciled.completedFocusPhases
            );
        }
        activeSession =
            reconciled.session.status === 'completed'
                ? null
                : reconciled.session;
    }

    const loadedTasks = sortTasks(loadTasks([]).data);

    return {
        presets: loadedPresets,
        selectedPresetId: validPresetId,
        selectedStateCode: validStateCode,
        cycleSwitchEnabled: loadedPrefs.cycleSwitchEnabled,
        activeSession,
        tasks: loadedTasks,
    };
}

export function PomodoroPage() {
    const [initialState] = useState<InitialPomodoroState>(
        loadInitialPomodoroState
    );

    const [presets, setPresets] = useState<PresetOption[]>(initialState.presets);
    const [selectedPresetId, setSelectedPresetId] = useState<string>(
        initialState.selectedPresetId
    );
    const [cycleSwitchEnabled, setCycleSwitchEnabled] = useState<boolean>(
        initialState.cycleSwitchEnabled
    );
    const [selectedStateCode, setSelectedStateCode] = useState<string>(
        initialState.selectedStateCode
    );
    const [activeSession, setActiveSession] = useState<ActiveSession | null>(
        initialState.activeSession
    );
    const [idlePhase, setIdlePhase] = useState<TimerPhase>('focus');
    const [nowMs, setNowMs] = useState<number>(() => Date.now());

    const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');
    const [newFocusMin, setNewFocusMin] = useState(25);
    const [newShortBreakMin, setNewShortBreakMin] = useState(5);
    const [newLongBreakMin, setNewLongBreakMin] = useState(15);

    const [tasks, setTasks] = useState<StudyTask[]>(initialState.tasks);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskPriority, setTaskPriority] = useState<TaskPriority>('Alta');
    const [taskStatus, setTaskStatus] = useState<TaskStatus>('A fazer');

    const activePreset = useMemo(
        () => presets.find((p) => p.id === selectedPresetId) ?? presets[0],
        [presets, selectedPresetId]
    );

    const timerPreset = useMemo<PresetOption>(() => {
        if (!activeSession) {
            return activePreset;
        }
        return {
            ...activePreset,
            label: activeSession.snapshotPreset.name,
            focusMinutes: activeSession.snapshotPreset.focusMinutes,
            shortBreakMinutes: activeSession.snapshotPreset.shortBreakMinutes,
            cyclesBeforeLongBreak:
                activeSession.snapshotPreset.cyclesBeforeLongBreak,
            longBreakMinutes: activeSession.snapshotPreset.longBreakMinutes,
        };
    }, [activePreset, activeSession]);

    const phase: TimerPhase = activeSession ? activeSession.phase : idlePhase;
    const cycle: number = activeSession ? activeSession.cycle : 1;
    const isRunning: boolean = activeSession?.status === 'running';
    const totalCyclesBeforeLongBreak: number =
        timerPreset.cyclesBeforeLongBreak ?? DEFAULT_CYCLES_BEFORE_LONG_BREAK;

    const secondsLeft: number = activeSession
        ? getRemainingSeconds(activeSession, nowMs)
        : getPhaseDurationSeconds(activePreset, idlePhase);

    useEffect(() => {
        savePresets(presets);
    }, [presets]);

    useEffect(() => {
        saveTasks(tasks);
    }, [tasks]);

    useEffect(() => {
        saveActiveSession(activeSession);
    }, [activeSession]);

    useEffect(() => {
        savePreferences({
            selectedPresetId,
            selectedStateCode,
            cycleSwitchEnabled,
        });
    }, [selectedPresetId, selectedStateCode, cycleSwitchEnabled]);

    const activeStateInfo = useMemo(
        () =>
            BRAZILIAN_STATES_INFO.find((s) => s.code === selectedStateCode) ??
            BRAZILIAN_STATES_INFO[0],
        [selectedStateCode]
    );

    const advanceStateBy = useCallback((steps = 1) => {
        setSelectedStateCode((currentCode) => stepStateCode(currentCode, steps));
    }, []);

    const handleNextState = useCallback(() => {
        advanceStateBy(1);
    }, [advanceStateBy]);

    useEffect(() => {
        if (!activeSession || activeSession.status !== 'running') {
            return;
        }

        const tick = () => {
            const now = Date.now();
            setNowMs(now);

            if (now >= activeSession.phaseEndsAt) {
                const result = reconcileSessionWithNow(activeSession, now);
                if (result.completedFocusPhases > 0 && cycleSwitchEnabled) {
                    advanceStateBy(result.completedFocusPhases);
                }
                if (result.session.status === 'completed') {
                    setActiveSession(null);
                    setIdlePhase('focus');
                } else {
                    setActiveSession(result.session);
                }
            }
        };

        tick();
        const intervalId = window.setInterval(tick, 250);
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                tick();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', tick);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            );
            window.removeEventListener('focus', tick);
        };
    }, [activeSession, cycleSwitchEnabled, advanceStateBy]);

    const handleToggleRun = () => {
        const now = Date.now();
        setNowMs(now);

        if (!activeSession) {
            setActiveSession(
                createActiveSession(activePreset, idlePhase, 1, now)
            );
            return;
        }

        if (activeSession.status === 'running') {
            setActiveSession(pauseSession(activeSession, now));
        } else if (activeSession.status === 'paused') {
            setActiveSession(resumeSession(activeSession, now));
        }
    };

    const handleSkipPhase = () => {
        const now = Date.now();
        setNowMs(now);

        if (!activeSession) {
            setIdlePhase((prev) => (prev === 'focus' ? 'shortBreak' : 'focus'));
            return;
        }

        const nextSession = skipSessionPhase(activeSession, now);
        if (!nextSession) {
            setActiveSession(null);
            setIdlePhase('focus');
        } else {
            setActiveSession(nextSession);
        }
    };

    const handlePresetChange = (presetId: string) => {
        if (isRunning) {
            return;
        }
        const nextPreset = presets.find((p) => p.id === presetId);
        if (!nextPreset) {
            return;
        }
        setSelectedPresetId(presetId);
        if (activeSession) {
            setActiveSession(null);
        }
    };

    const handlePhaseChange = (nextPhase: TimerPhase) => {
        const now = Date.now();
        setNowMs(now);

        if (activeSession) {
            setActiveSession(setSessionPhase(activeSession, nextPhase, now));
        } else {
            setIdlePhase(nextPhase);
        }
    };

    const handleResetCycles = () => {
        const now = Date.now();
        setNowMs(now);

        if (activeSession) {
            setActiveSession(resetSessionCycles(activeSession, now));
        } else {
            setIdlePhase('focus');
        }
    };

    const handleEndSession = () => {
        setActiveSession(null);
        setIdlePhase('focus');
    };

    const openNewPresetModal = () => {
        if (isRunning) {
            return;
        }
        setNewPresetName('');
        setNewFocusMin(25);
        setNewShortBreakMin(5);
        setNewLongBreakMin(15);
        setIsPresetModalOpen(true);
    };

    const handleCreatePreset = (event: React.FormEvent) => {
        event.preventDefault();
        if (isRunning) {
            return;
        }
        const trimmed = newPresetName.trim();
        if (
            !trimmed ||
            !isValidMinutes(newFocusMin, 1, 120) ||
            !isValidMinutes(newShortBreakMin, 1, 60) ||
            !isValidMinutes(newLongBreakMin, 1, 90)
        ) {
            return;
        }
        const now = Date.now();
        const created: PresetOption = {
            id: createId('custom'),
            name: trimmed,
            label: `${trimmed} (${newFocusMin}/${newShortBreakMin}/${newLongBreakMin})`,
            focusMinutes: newFocusMin,
            shortBreakMinutes: newShortBreakMin,
            cyclesBeforeLongBreak: DEFAULT_CYCLES_BEFORE_LONG_BREAK,
            longBreakMinutes: newLongBreakMin,
            createdAt: now,
            updatedAt: now,
        };
        setPresets((prev) => [...prev, created]);
        setSelectedPresetId(created.id);
        if (activeSession) {
            setActiveSession(null);
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
        const now = Date.now();
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
                                updatedAt: now,
                            }
                            : item
                    )
                )
            );
        } else {
            const created: StudyTask = {
                id: createId('task'),
                title: trimmed,
                priority: taskPriority,
                status: taskStatus,
                createdAt: now,
                updatedAt: now,
            };
            setTasks((prev) => sortTasks([...prev, created]));
        }
        setIsTaskModalOpen(false);
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks((prev) => prev.filter((item) => item.id !== taskId));
    };

    const handleCycleTaskStatus = (taskId: string) => {
        const now = Date.now();
        setTasks((prev) =>
            sortTasks(
                prev.map((item) => {
                    if (item.id !== taskId) {
                        return item;
                    }
                    const currentIdx = STATUS_SEQUENCE.indexOf(item.status);
                    const nextStatus =
                        STATUS_SEQUENCE[(currentIdx + 1) % STATUS_SEQUENCE.length];
                    return { ...item, status: nextStatus, updatedAt: now };
                })
            )
        );
    };

    return (
        <MainLayout
            stateCode={selectedStateCode}
            headerProps={{
                onBrandClick: () =>
                    window.scrollTo({ top: 0, behavior: 'smooth' }),
                presets,
                selectedPresetId: activePreset.id,
                onPresetChange: handlePresetChange,
                onNewPresetClick: openNewPresetModal,
                isPresetLocked: isRunning,
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
                    isPresetLocked={isRunning}
                />

                <div className={styles.topStage}>
                    <div className={styles.timerSlot}>
                        <TimerCard
                            preset={timerPreset}
                            phase={phase}
                            secondsLeft={secondsLeft}
                            isRunning={isRunning}
                            cycle={cycle}
                            totalCyclesBeforeLongBreak={totalCyclesBeforeLongBreak}
                            onPhaseChange={handlePhaseChange}
                            onToggleRun={handleToggleRun}
                            onSkipPhase={handleSkipPhase}
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
                                step={1}
                                className={modalStyles.input}
                                value={Number.isNaN(newFocusMin) ? '' : newFocusMin}
                                onChange={(event) =>
                                    setNewFocusMin(
                                        event.target.value === ''
                                            ? Number.NaN
                                            : Number(event.target.value)
                                    )
                                }
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
                                step={1}
                                className={modalStyles.input}
                                value={
                                    Number.isNaN(newShortBreakMin)
                                        ? ''
                                        : newShortBreakMin
                                }
                                onChange={(event) =>
                                    setNewShortBreakMin(
                                        event.target.value === ''
                                            ? Number.NaN
                                            : Number(event.target.value)
                                    )
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
                                step={1}
                                className={modalStyles.input}
                                value={
                                    Number.isNaN(newLongBreakMin)
                                        ? ''
                                        : newLongBreakMin
                                }
                                onChange={(event) =>
                                    setNewLongBreakMin(
                                        event.target.value === ''
                                            ? Number.NaN
                                            : Number(event.target.value)
                                    )
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
