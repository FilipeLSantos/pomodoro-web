import { useCallback, useEffect, useMemo, useState } from 'react';
import { MobilePresetBar } from '../components/MobilePresetBar';
import { Modal, modalStyles } from '../components/Modal';
import { StateInfoCard } from '../components/StateInfoCard';
import { TasksPanel } from '../components/TasksPanel';
import { TimerCard } from '../components/TimerCard';
import { DEFAULT_PRESETS } from '../constants/headerDefaults';
import {
  BRAZILIAN_STATES_INFO,
  INITIAL_TASKS,
  sortTasks,
} from '../constants/pomodoroData';
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
} from '../domain/sessionEngine';
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
} from '../storage/pomodoroStorage';
import type { PresetOption } from '../types/header';
import type {
  ActiveSession,
  StudyTask,
  TaskPriority,
  TaskStatus,
  TimerPhase,
  UiPreferences,
} from '../types/pomodoro';
import styles from './PomodoroPage.module.css';

const STATUS_SEQUENCE: TaskStatus[] = [
  'A fazer',
  'Em execução',
  'Concluída',
  'Cancelada',
  'Backlog',
];

type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
} | null;

function advanceStateCodeBySteps(currentCode: string, steps: number): string {
  if (steps <= 0) {
    return currentCode;
  }
  const idx = BRAZILIAN_STATES_INFO.findIndex((s) => s.code === currentCode);
  const safeIdx = idx >= 0 ? idx : 0;
  const nextIdx = (safeIdx + steps) % BRAZILIAN_STATES_INFO.length;
  return BRAZILIAN_STATES_INFO[nextIdx].code;
}

interface InitialBootstrapState {
  presets: PresetOption[];
  tasks: StudyTask[];
  preferences: UiPreferences;
  activeSession: ActiveSession | null;
  resumedNotice: string | null;
  corruptedSession: boolean;
  storageError: string | null;
}

function loadInitialState(): InitialBootstrapState {
  const now = Date.now();
  const presetsResult = loadPresets(DEFAULT_PRESETS);
  const tasksResult = loadTasks(sortTasks(INITIAL_TASKS));

  const fallbackPrefs: UiPreferences = {
    selectedPresetId: presetsResult.data[0].id,
    selectedStateCode: 'RJ',
    cycleSwitchEnabled: true,
  };
  const prefsResult = loadPreferences(fallbackPrefs);

  const validSelectedPresetId = presetsResult.data.some(
    (p) => p.id === prefsResult.data.selectedPresetId
  )
    ? prefsResult.data.selectedPresetId
    : presetsResult.data[0].id;

  const validSelectedStateCode = BRAZILIAN_STATES_INFO.some(
    (s) => s.code === prefsResult.data.selectedStateCode
  )
    ? prefsResult.data.selectedStateCode
    : 'RJ';

  let preferences: UiPreferences = {
    selectedPresetId: validSelectedPresetId,
    selectedStateCode: validSelectedStateCode,
    cycleSwitchEnabled: prefsResult.data.cycleSwitchEnabled,
  };

  const sessionResult = loadActiveSession();
  let activeSession: ActiveSession | null = null;
  let resumedNotice: string | null = null;

  if (sessionResult.data) {
    const reconciled = reconcileSessionWithNow(sessionResult.data, now);
    activeSession = reconciled.session;

    if (
      preferences.cycleSwitchEnabled &&
      reconciled.completedFocusPhases > 0
    ) {
      preferences = {
        ...preferences,
        selectedStateCode: advanceStateCodeBySteps(
          preferences.selectedStateCode,
          reconciled.completedFocusPhases
        ),
      };
      savePreferences(preferences);
    }

    if (reconciled.phasesAdvanced > 0) {
      saveActiveSession(activeSession);
    }

    if (activeSession.status === 'completed') {
      resumedNotice =
        'Todas as fases da sessão salva foram concluídas enquanto a página estava fechada.';
    } else if (activeSession.status === 'paused') {
      resumedNotice =
        'Sessão pausada restaurada automaticamente do armazenamento local.';
    } else {
      resumedNotice =
        'Sessão em andamento retomada automaticamente com base nos timestamps salvos.';
    }
  }

  const storageError =
    presetsResult.error ??
    tasksResult.error ??
    prefsResult.error ??
    sessionResult.error ??
    null;

  return {
    presets: presetsResult.data,
    tasks: sortTasks(tasksResult.data),
    preferences,
    activeSession,
    resumedNotice,
    corruptedSession: sessionResult.corrupted,
    storageError,
  };
}

export function PomodoroPage() {
  const [bootstrap] = useState<InitialBootstrapState>(loadInitialState);

  const [presets, setPresets] = useState<PresetOption[]>(bootstrap.presets);
  const [preferences, setPreferences] = useState<UiPreferences>(
    bootstrap.preferences
  );
  const [tasks, setTasks] = useState<StudyTask[]>(bootstrap.tasks);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    bootstrap.activeSession
  );

  // Idle timer state when no active session exists
  const [idlePhase, setIdlePhase] = useState<TimerPhase>('focus');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Persistence notices
  const [resumedNotice, setResumedNotice] = useState<string | null>(
    bootstrap.resumedNotice
  );
  const [corruptedSession, setCorruptedSession] = useState<boolean>(
    bootstrap.corruptedSession
  );
  const [storageError, setStorageError] = useState<string | null>(
    bootstrap.storageError
  );

  // Confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);

  // Preset modal state
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newFocusMin, setNewFocusMin] = useState(25);
  const [newShortBreakMin, setNewShortBreakMin] = useState(5);
  const [newCyclesBeforeLongBreak, setNewCyclesBeforeLongBreak] = useState(
    DEFAULT_CYCLES_BEFORE_LONG_BREAK
  );
  const [newLongBreakMin, setNewLongBreakMin] = useState(15);

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Média');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Backlog');

  const selectedPreset = useMemo(
    () =>
      presets.find((p) => p.id === preferences.selectedPresetId) ?? presets[0],
    [presets, preferences.selectedPresetId]
  );

  // When a session is active, TimerCard displays the session's immutable snapshot (RN-05)
  const displayedPreset = useMemo<PresetOption>(() => {
    if (!activeSession) {
      return selectedPreset;
    }
    const snap = activeSession.snapshotPreset;
    return {
      id: activeSession.presetId,
      name: snap.name,
      label: `${snap.name} (${snap.focusMinutes}/${snap.shortBreakMinutes}/${snap.longBreakMinutes})`,
      focusMinutes: snap.focusMinutes,
      shortBreakMinutes: snap.shortBreakMinutes,
      cyclesBeforeLongBreak: snap.cyclesBeforeLongBreak,
      longBreakMinutes: snap.longBreakMinutes,
    };
  }, [activeSession, selectedPreset]);

  const activeStateInfo = useMemo(
    () =>
      BRAZILIAN_STATES_INFO.find(
        (s) => s.code === preferences.selectedStateCode
      ) ?? BRAZILIAN_STATES_INFO[0],
    [preferences.selectedStateCode]
  );

  const persistPresets = useCallback((next: PresetOption[]) => {
    setPresets(next);
    const result = savePresets(next);
    if (!result.ok) {
      setStorageError(result.error);
    }
  }, []);

  const persistTasks = useCallback((next: StudyTask[]) => {
    const sorted = sortTasks(next);
    setTasks(sorted);
    const result = saveTasks(sorted);
    if (!result.ok) {
      setStorageError(result.error);
    }
  }, []);

  const persistPreferences = useCallback(
    (updater: (prev: UiPreferences) => UiPreferences) => {
      setPreferences((prev) => {
        const next = updater(prev);
        const result = savePreferences(next);
        if (!result.ok) {
          setStorageError(result.error);
        }
        return next;
      });
    },
    []
  );

  const persistSession = useCallback((next: ActiveSession | null) => {
    setActiveSession(next);
    const result = saveActiveSession(next);
    if (!result.ok) {
      setStorageError(result.error);
    }
  }, []);

  const handleNextState = useCallback(
    (steps = 1) => {
      persistPreferences((prev) => ({
        ...prev,
        selectedStateCode: advanceStateCodeBySteps(
          prev.selectedStateCode,
          steps
        ),
      }));
    },
    [persistPreferences]
  );

  const isRunning = activeSession?.status === 'running';
  const currentPhase: TimerPhase = activeSession
    ? activeSession.phase
    : idlePhase;
  const currentCycle = activeSession ? activeSession.cycle : 1;
  const totalCyclesBeforeLongBreak =
    displayedPreset.cyclesBeforeLongBreak ?? DEFAULT_CYCLES_BEFORE_LONG_BREAK;

  const secondsLeft = activeSession
    ? getRemainingSeconds(activeSession, nowMs)
    : getPhaseDurationSeconds(
        {
          focusMinutes: selectedPreset.focusMinutes,
          shortBreakMinutes: selectedPreset.shortBreakMinutes,
          longBreakMinutes: selectedPreset.longBreakMinutes,
        },
        idlePhase
      );

  // Wall-clock timestamp tick while running (RNF-03, R-02)
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'running') {
      return;
    }

    const tick = () => {
      const currentNow = Date.now();
      setNowMs(currentNow);

      if (currentNow >= activeSession.phaseEndsAt) {
        const reconciled = reconcileSessionWithNow(activeSession, currentNow);
        if (reconciled.phasesAdvanced > 0) {
          persistSession(reconciled.session);
          if (
            preferences.cycleSwitchEnabled &&
            reconciled.completedFocusPhases > 0
          ) {
            handleNextState(reconciled.completedFocusPhases);
          }
          if (reconciled.session.status === 'completed') {
            setResumedNotice('Sessão concluída! Todos os ciclos foram finalizados.');
          }
        }
      }
    };

    const timerId = window.setInterval(tick, 250);
    return () => window.clearInterval(timerId);
  }, [
    activeSession,
    handleNextState,
    persistSession,
    preferences.cycleSwitchEnabled,
  ]);

  const handleToggleRun = () => {
    const currentNow = Date.now();
    setNowMs(currentNow);
    setResumedNotice(null);

    if (!activeSession || activeSession.status === 'completed') {
      const created = createActiveSession(
        selectedPreset,
        idlePhase,
        1,
        currentNow
      );
      persistSession(created);
      return;
    }

    if (activeSession.status === 'running') {
      persistSession(pauseSession(activeSession, currentNow));
    } else {
      persistSession(resumeSession(activeSession, currentNow));
    }
  };

  // RN-02 / UC09: selecting another preset ends the current active session automatically
  const handlePresetChange = (presetId: string) => {
    const nextPreset = presets.find((p) => p.id === presetId);
    if (!nextPreset) {
      return;
    }
    if (activeSession) {
      persistSession(null);
      setResumedNotice(null);
    }
    setIdlePhase('focus');
    persistPreferences((prev) => ({
      ...prev,
      selectedPresetId: presetId,
    }));
  };

  const handlePhaseChange = (nextPhase: TimerPhase) => {
    const currentNow = Date.now();
    setNowMs(currentNow);

    if (activeSession && activeSession.status !== 'completed') {
      persistSession(setSessionPhase(activeSession, nextPhase, currentNow));
    } else {
      setIdlePhase(nextPhase);
    }
  };

  const handleSkipPhase = () => {
    const currentNow = Date.now();
    setNowMs(currentNow);
    setResumedNotice(null);

    if (!activeSession || activeSession.status === 'completed') {
      const nextIdlePhase: TimerPhase =
        idlePhase === 'focus'
          ? 'shortBreak'
          : idlePhase === 'shortBreak'
            ? 'focus'
            : 'focus';
      setIdlePhase(nextIdlePhase);
      return;
    }

    const skipped = skipSessionPhase(activeSession, currentNow);
    if (skipped === null) {
      persistSession(null);
      setIdlePhase('focus');
    } else {
      persistSession(skipped);
    }
  };

  const handleResetCycles = () => {
    if (!activeSession) {
      setIdlePhase('focus');
      return;
    }

    setConfirmDialog({
      title: 'Reiniciar ciclos',
      message:
        'Deseja zerar a contagem de ciclos e retornar ao primeiro ciclo de foco?',
      confirmLabel: 'Reiniciar ciclos',
      onConfirm: () => {
        const currentNow = Date.now();
        setNowMs(currentNow);
        persistSession(resetSessionCycles(activeSession, currentNow));
        setResumedNotice(null);
        setConfirmDialog(null);
      },
    });
  };

  const handleEndSession = () => {
    if (!activeSession) {
      setIdlePhase('focus');
      return;
    }

    setConfirmDialog({
      title: 'Encerrar sessão',
      message:
        'Deseja encerrar a sessão atual e removê-la do armazenamento local?',
      confirmLabel: 'Encerrar sessão',
      onConfirm: () => {
        persistSession(null);
        setIdlePhase('focus');
        setResumedNotice(null);
        setConfirmDialog(null);
      },
    });
  };

  const handleDiscardResumedSession = () => {
    setConfirmDialog({
      title: 'Descartar sessão retomada',
      message:
        'Deseja descartar a sessão retomada sem contabilizar progresso? O preset voltará a ficar liberado.',
      confirmLabel: 'Descartar sessão',
      onConfirm: () => {
        persistSession(null);
        setIdlePhase('focus');
        setResumedNotice(null);
        setConfirmDialog(null);
      },
    });
  };

  const handleClearCorruptedSession = () => {
    persistSession(null);
    setCorruptedSession(false);
  };

  const openNewPresetModal = () => {
    setNewPresetName('');
    setNewFocusMin(25);
    setNewShortBreakMin(5);
    setNewCyclesBeforeLongBreak(DEFAULT_CYCLES_BEFORE_LONG_BREAK);
    setNewLongBreakMin(15);
    setIsPresetModalOpen(true);
  };

  const handleCreatePreset = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newPresetName.trim();
    if (!trimmed) {
      return;
    }
    const now = Date.now();
    const created: PresetOption = {
      id: `custom-${now}`,
      name: trimmed,
      label: `${trimmed} (${newFocusMin}/${newShortBreakMin}/${newLongBreakMin})`,
      focusMinutes: newFocusMin,
      shortBreakMinutes: newShortBreakMin,
      cyclesBeforeLongBreak: newCyclesBeforeLongBreak,
      longBreakMinutes: newLongBreakMin,
      createdAt: now,
      updatedAt: now,
    };
    persistPresets([...presets, created]);

    // Only switch immediately if no session is running; otherwise keep running session intact
    if (!activeSession) {
      persistPreferences((prev) => ({
        ...prev,
        selectedPresetId: created.id,
      }));
      setIdlePhase('focus');
    }
    setIsPresetModalOpen(false);
  };

  const openAddTaskModal = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskPriority('Média');
    setTaskStatus('Backlog');
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
      persistTasks(
        tasks.map((item) =>
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
      );
    } else {
      const created: StudyTask = {
        id: `task-${now}`,
        title: trimmed,
        priority: taskPriority,
        status: taskStatus,
        createdAt: now,
        updatedAt: now,
      };
      persistTasks([...tasks, created]);
    }
    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    const target = tasks.find((item) => item.id === taskId);
    setConfirmDialog({
      title: 'Excluir tarefa',
      message: target
        ? `Tem certeza que deseja excluir a tarefa "${target.title}"?`
        : 'Tem certeza que deseja excluir esta tarefa?',
      confirmLabel: 'Excluir',
      onConfirm: () => {
        persistTasks(tasks.filter((item) => item.id !== taskId));
        setConfirmDialog(null);
      },
    });
  };

  const handleCycleTaskStatus = (taskId: string) => {
    const now = Date.now();
    persistTasks(
      tasks.map((item) => {
        if (item.id !== taskId) {
          return item;
        }
        const currentIdx = STATUS_SEQUENCE.indexOf(item.status);
        const nextStatus =
          STATUS_SEQUENCE[(currentIdx + 1) % STATUS_SEQUENCE.length];
        return { ...item, status: nextStatus, updatedAt: now };
      })
    );
  };

  return (
    <MainLayout
      headerProps={{
        presets,
        selectedPresetId: selectedPreset.id,
        onPresetChange: handlePresetChange,
        onNewPresetClick: openNewPresetModal,
        cycleSwitchEnabled: preferences.cycleSwitchEnabled,
        onCycleSwitchToggle: () =>
          persistPreferences((prev) => ({
            ...prev,
            cycleSwitchEnabled: !prev.cycleSwitchEnabled,
          })),
        states: BRAZILIAN_STATES_INFO,
        selectedStateCode: preferences.selectedStateCode,
        onStateChange: (stateCode) =>
          persistPreferences((prev) => ({
            ...prev,
            selectedStateCode: stateCode,
          })),
      }}
    >
      <div className={styles.workspace}>
        <MobilePresetBar
          presets={presets}
          selectedPresetId={selectedPreset.id}
          onPresetChange={handlePresetChange}
          onNewPresetClick={openNewPresetModal}
        />

        {storageError && (
          <div
            className={`${styles.noticeBanner} ${styles.noticeBannerWarning}`}
            role="alert"
          >
            <p className={styles.noticeText}>{storageError}</p>
            <div className={styles.noticeActions}>
              <button
                type="button"
                className={styles.noticeButton}
                onClick={() => setStorageError(null)}
              >
                Dispensar
              </button>
            </div>
          </div>
        )}

        {corruptedSession && (
          <div
            className={`${styles.noticeBanner} ${styles.noticeBannerWarning}`}
            role="alert"
          >
            <p className={styles.noticeText}>
              Os dados da sessão anterior no armazenamento local estavam
              corrompidos.
            </p>
            <div className={styles.noticeActions}>
              <button
                type="button"
                className={`${styles.noticeButton} ${styles.noticeButtonDanger}`}
                onClick={handleClearCorruptedSession}
              >
                Descartar dados inválidos
              </button>
            </div>
          </div>
        )}

        {resumedNotice && activeSession && (
          <div className={styles.noticeBanner} role="status">
            <p className={styles.noticeText}>{resumedNotice}</p>
            <div className={styles.noticeActions}>
              <button
                type="button"
                className={styles.noticeButton}
                onClick={() => setResumedNotice(null)}
              >
                Continuar
              </button>
              <button
                type="button"
                className={`${styles.noticeButton} ${styles.noticeButtonDanger}`}
                onClick={handleDiscardResumedSession}
              >
                Descartar sessão
              </button>
            </div>
          </div>
        )}

        <div className={styles.topStage}>
          <div className={styles.timerSlot}>
            <TimerCard
              preset={displayedPreset}
              phase={currentPhase}
              secondsLeft={secondsLeft}
              isRunning={isRunning}
              cycle={currentCycle}
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
              onNextState={() => handleNextState(1)}
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
              maxLength={40}
              className={modalStyles.input}
              placeholder="Ex.: Revisão Intensiva"
              value={newPresetName}
              onChange={(event) => setNewPresetName(event.target.value)}
              required
            />
          </div>

          <div className={modalStyles.twoCol}>
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
                Pausa curta (min)
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
              <label htmlFor="preset-cycles" className={modalStyles.label}>
                Ciclos antes da longa
              </label>
              <input
                id="preset-cycles"
                type="number"
                min={1}
                max={12}
                className={modalStyles.input}
                value={newCyclesBeforeLongBreak}
                onChange={(event) =>
                  setNewCyclesBeforeLongBreak(Number(event.target.value))
                }
                required
              />
            </div>

            <div className={modalStyles.field}>
              <label htmlFor="preset-long" className={modalStyles.label}>
                Pausa longa (min)
              </label>
              <input
                id="preset-long"
                type="number"
                min={1}
                max={60}
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
              maxLength={100}
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
                <option value="Backlog">Backlog</option>
                <option value="A fazer">A fazer</option>
                <option value="Em execução">Em execução</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
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

      <Modal
        title={confirmDialog?.title ?? ''}
        isOpen={confirmDialog !== null}
        onClose={() => setConfirmDialog(null)}
      >
        <p className={styles.confirmMessage}>{confirmDialog?.message}</p>
        <div className={modalStyles.footer}>
          <button
            type="button"
            className={modalStyles.cancelButton}
            onClick={() => setConfirmDialog(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={modalStyles.submitButton}
            onClick={() => confirmDialog?.onConfirm()}
          >
            {confirmDialog?.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </Modal>
    </MainLayout>
  );
}
