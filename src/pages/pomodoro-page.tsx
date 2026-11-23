import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MobilePresetBar } from "../components/MobilePresetBar";
import { Modal, modalStyles } from "../components/modal";
import { StateInfoCard } from "../components/state-info-card";
import { TasksPanel } from "../components/TasksPanel";
import { TimerCard } from "../components/TimerCard";
import { DEFAULT_PRESETS } from "../constants/header-defaults";
import { BRAZILIAN_STATES_INFO, sortTasks } from "../constants/pomodoro-data";
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
} from "../domain";
import { MainLayout } from "../layouts";
import {
  loadActiveSession,
  loadPreferences,
  loadPresets,
  loadTasks,
  saveActiveSession,
  savePreferences,
  savePresets,
  saveTasks,
} from "../storage";
import type { PresetOption } from "../types/header";
import type {
  ActiveSession,
  StudyTask,
  TaskPriority,
  TaskStatus,
  TimerPhase,
} from "../types/pomodoro";
import styles from "./pomodoro-page.module.css";

const DEFAULT_STATE_CODE = "RJ";

const STATUS_SEQUENCE: TaskStatus[] = [
  "A fazer",
  "Em execução",
  "Concluída",
  "Cancelada",
  "Backlog",
];

function createId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
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
  wasRestored: boolean;
  storageProblem: string | null;
}

function loadInitialPomodoroState(): InitialPomodoroState {
  const presetLoad = loadPresets(DEFAULT_PRESETS);
  const loadedPresets = presetLoad.data;
  const loadedPrefs = loadPreferences({
    selectedPresetId: loadedPresets[0]?.id ?? "",
    selectedStateCode: DEFAULT_STATE_CODE,
    cycleSwitchEnabled: true,
  }).data;

  const validPresetId = loadedPresets.some(
    (p) => p.id === loadedPrefs.selectedPresetId,
  )
    ? loadedPrefs.selectedPresetId
    : (loadedPresets[0]?.id ?? "");

  let validStateCode = BRAZILIAN_STATES_INFO.some(
    (s) => s.code === loadedPrefs.selectedStateCode,
  )
    ? loadedPrefs.selectedStateCode
    : DEFAULT_STATE_CODE;

  const sessionLoad = loadActiveSession();
  const loadedSession = sessionLoad.data;
  let activeSession: ActiveSession | null = null;

  if (loadedSession) {
    const reconciled = reconcileSessionWithNow(loadedSession, Date.now());
    if (reconciled.completedFocusPhases > 0 && loadedPrefs.cycleSwitchEnabled) {
      validStateCode = stepStateCode(
        validStateCode,
        reconciled.completedFocusPhases,
      );
    }
    activeSession = reconciled.session;
  }

  const taskLoad = loadTasks([]);
  const loadedTasks = sortTasks(taskLoad.data);
  const corrupted =
    presetLoad.corrupted || taskLoad.corrupted || sessionLoad.corrupted;
  const storageProblem =
    presetLoad.error ||
    taskLoad.error ||
    sessionLoad.error ||
    (corrupted
      ? "Foram encontrados dados inválidos no armazenamento local. Eles não foram carregados."
      : null);

  return {
    presets: loadedPresets,
    selectedPresetId:
      activeSession &&
      loadedPresets.some((p) => p.id === activeSession.presetId)
        ? activeSession.presetId
        : validPresetId,
    selectedStateCode: validStateCode,
    cycleSwitchEnabled: loadedPrefs.cycleSwitchEnabled,
    activeSession,
    tasks: loadedTasks,
    wasRestored: activeSession !== null,
    storageProblem,
  };
}

export function PomodoroPage() {
  const [initialState] = useState<InitialPomodoroState>(
    loadInitialPomodoroState,
  );

  const [presets, setPresets] = useState<PresetOption[]>(initialState.presets);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    initialState.selectedPresetId,
  );
  const [cycleSwitchEnabled, setCycleSwitchEnabled] = useState<boolean>(
    initialState.cycleSwitchEnabled,
  );
  const [selectedStateCode, setSelectedStateCode] = useState<string>(
    initialState.selectedStateCode,
  );
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    initialState.activeSession,
  );
  const [idlePhase, setIdlePhase] = useState<TimerPhase>("focus");
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetError, setPresetError] = useState("");
  const [newPresetName, setNewPresetName] = useState("");
  const [newFocusMin, setNewFocusMin] = useState(25);
  const [newShortBreakMin, setNewShortBreakMin] = useState(5);
  const [newLongBreakMin, setNewLongBreakMin] = useState(15);
  const [newCycles, setNewCycles] = useState(4);
  const [wasRestored, setWasRestored] = useState(initialState.wasRestored);
  const [storageError, setStorageError] = useState(initialState.storageProblem);
  const audioContextRef = useRef<AudioContext | null>(null);
  const storageFailureReported = useRef(false);

  const [tasks, setTasks] = useState<StudyTask[]>(initialState.tasks);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("Média");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("Backlog");
  const activePreset = useMemo(
    () =>
      presets.find((p) => p.id === selectedPresetId) ??
      presets[0] ??
      DEFAULT_PRESETS[0],
    [presets, selectedPresetId],
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
      cyclesBeforeLongBreak: activeSession.snapshotPreset.cyclesBeforeLongBreak,
      longBreakMinutes: activeSession.snapshotPreset.longBreakMinutes,
    };
  }, [activePreset, activeSession]);

  const phase: TimerPhase = activeSession ? activeSession.phase : idlePhase;
  const cycle: number = activeSession ? activeSession.cycle : 1;
  const isRunning: boolean = activeSession?.status === "running";
  const totalCyclesBeforeLongBreak: number =
    timerPreset.cyclesBeforeLongBreak ?? DEFAULT_CYCLES_BEFORE_LONG_BREAK;

  const secondsLeft: number = activeSession
    ? getRemainingSeconds(activeSession, nowMs)
    : getPhaseDurationSeconds(activePreset, idlePhase);

  const tocarAlerta = useCallback(() => {
    const context = audioContextRef.current;
    if (!context || context.state !== "running") return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.25);
    } catch {
      // Alguns navegadores bloqueiam a reprodução automática.
    }
  }, []);

  useEffect(() => {
    const result = savePresets(presets);
    if (!result.ok && result.error && !storageFailureReported.current) {
      storageFailureReported.current = true;
      window.alert(result.error);
    }
  }, [presets]);

  useEffect(() => {
    const result = saveTasks(tasks);
    if (!result.ok && result.error && !storageFailureReported.current) {
      storageFailureReported.current = true;
      window.alert(result.error);
    }
  }, [tasks]);

  useEffect(() => {
    const result = saveActiveSession(activeSession);
    if (!result.ok && result.error && !storageFailureReported.current) {
      storageFailureReported.current = true;
      window.alert(result.error);
    }
  }, [activeSession]);

  useEffect(() => {
    const result = savePreferences({
      selectedPresetId,
      selectedStateCode,
      cycleSwitchEnabled,
    });
    if (!result.ok && result.error && !storageFailureReported.current) {
      storageFailureReported.current = true;
      window.alert(result.error);
    }
  }, [selectedPresetId, selectedStateCode, cycleSwitchEnabled]);

  const activeStateInfo = useMemo(
    () =>
      BRAZILIAN_STATES_INFO.find((s) => s.code === selectedStateCode) ??
      BRAZILIAN_STATES_INFO[0],
    [selectedStateCode],
  );

  const advanceStateBy = useCallback((steps = 1) => {
    setSelectedStateCode((currentCode) => stepStateCode(currentCode, steps));
  }, []);

  const handleNextState = useCallback(() => {
    advanceStateBy(1);
  }, [advanceStateBy]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== "running") {
      return;
    }

    const tick = () => {
      const now = Date.now();
      setNowMs(now);

      if (now >= activeSession.phaseEndsAt) {
        const result = reconcileSessionWithNow(activeSession, now);
        if (result.phasesAdvanced > 0) {
          tocarAlerta();
        }
        if (result.completedFocusPhases > 0 && cycleSwitchEnabled) {
          advanceStateBy(result.completedFocusPhases);
        }
        setActiveSession(result.session);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", tick);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", tick);
    };
  }, [activeSession, cycleSwitchEnabled, advanceStateBy, tocarAlerta]);

  // O navegador só permite áudio após interação do usuário.
  const habilitarSom = () => {
    try {
      if (!audioContextRef.current)
        audioContextRef.current = new AudioContext();
      if (audioContextRef.current.state === "suspended") {
        void audioContextRef.current.resume();
      }
    } catch {
      // Sem suporte de áudio, o restante da aplicação continua funcionando.
    }
  };

  const handleToggleRun = () => {
    habilitarSom();
    const now = Date.now();
    setNowMs(now);

    if (!activeSession || activeSession.status === "completed") {
      if (presets.length === 0) {
        window.alert("Cadastre um temporizador antes de iniciar.");
        return;
      }
      setWasRestored(false);
      setActiveSession(createActiveSession(activePreset, "focus", 1, now));
      return;
    }

    if (activeSession.status === "running") {
      setActiveSession(pauseSession(activeSession, now));
    } else if (activeSession.status === "paused") {
      setActiveSession(resumeSession(activeSession, now));
    }
  };

  const handleSkipPhase = () => {
    const now = Date.now();
    setNowMs(now);

    if (!activeSession) {
      setIdlePhase((prev) => (prev === "focus" ? "shortBreak" : "focus"));
      return;
    }

    const nextSession = skipSessionPhase(activeSession, now);
    if (!nextSession) {
      setActiveSession(null);
      setIdlePhase("focus");
    } else {
      setActiveSession(nextSession);
    }
  };

  const handlePresetChange = (presetId: string) => {
    const nextPreset = presets.find((p) => p.id === presetId);
    if (!nextPreset) {
      return;
    }
    if (presetId === selectedPresetId) return;
    setSelectedPresetId(presetId);
    setIdlePhase("focus");
    setWasRestored(false);
    if (activeSession && activeSession.status !== "completed") {
      // UC09: troca encerra a sessão anterior e inicia a nova.
      habilitarSom();
      setActiveSession(createActiveSession(nextPreset, "focus", 1));
    } else {
      setActiveSession(null);
    }
  };

  const handlePhaseChange = (nextPhase: TimerPhase) => {
    const now = Date.now();
    setNowMs(now);

    if (activeSession && activeSession.status !== "completed") {
      setActiveSession(setSessionPhase(activeSession, nextPhase, now));
    } else {
      setIdlePhase(nextPhase);
    }
  };

  const handleResetCycles = () => {
    if (
      !activeSession ||
      !window.confirm("Reiniciar os ciclos da sessão atual?")
    )
      return;
    const now = Date.now();
    setNowMs(now);

    if (activeSession && activeSession.status !== "completed") {
      setActiveSession(resetSessionCycles(activeSession, now));
    } else {
      setIdlePhase("focus");
    }
  };

  const handleEndSession = () => {
    if (!activeSession || !window.confirm("Encerrar a sessão atual?")) return;
    setWasRestored(false);
    setActiveSession(null);
    setIdlePhase("focus");
  };

  const openNewPresetModal = () => {
    setEditingPresetId(null);
    setPresetError("");
    setNewPresetName("");
    setNewFocusMin(25);
    setNewShortBreakMin(5);
    setNewLongBreakMin(15);
    setNewCycles(4);
    setIsPresetModalOpen(true);
  };

  const openEditPresetModal = () => {
    if (
      activeSession?.status !== "completed" &&
      activeSession?.presetId === activePreset.id
    ) {
      window.alert("Encerre a sessão antes de editar este preset.");
      return;
    }
    setEditingPresetId(activePreset.id);
    setPresetError("");
    setNewPresetName(activePreset.name ?? activePreset.label);
    setNewFocusMin(activePreset.focusMinutes);
    setNewShortBreakMin(activePreset.shortBreakMinutes);
    setNewLongBreakMin(activePreset.longBreakMinutes);
    setNewCycles(activePreset.cyclesBeforeLongBreak ?? 4);
    setIsPresetModalOpen(true);
  };

  const handleDeletePreset = () => {
    if (
      activeSession?.status !== "completed" &&
      activeSession?.presetId === activePreset.id
    ) {
      window.alert("Encerre a sessão antes de excluir este preset.");
      return;
    }
    if (
      !window.confirm(
        `Excluir o temporizador "${activePreset.name ?? activePreset.label}"?`,
      )
    )
      return;
    const restantes = presets.filter((p) => p.id !== activePreset.id);
    setPresets(restantes);
    setSelectedPresetId(restantes[0]?.id ?? "");
  };

  const handleSavePreset = (event: React.FormEvent) => {
    event.preventDefault();
    const name = newPresetName.trim();
    if (name.length < 1 || name.length > 40) {
      setPresetError("Nome: informe entre 1 e 40 caracteres.");
      return;
    }
    if (!isValidMinutes(newFocusMin, 1, 120)) {
      setPresetError("Foco: informe um número inteiro de 1 a 120 minutos.");
      return;
    }
    if (!isValidMinutes(newShortBreakMin, 1, 60)) {
      setPresetError(
        "Pausa curta: informe um número inteiro de 1 a 60 minutos.",
      );
      return;
    }
    if (!isValidMinutes(newCycles, 1, 12)) {
      setPresetError("Ciclos: informe um número inteiro de 1 a 12.");
      return;
    }
    if (!isValidMinutes(newLongBreakMin, 1, 60)) {
      setPresetError(
        "Pausa longa: informe um número inteiro de 1 a 60 minutos.",
      );
      return;
    }
    if (
      editingPresetId &&
      activeSession?.status !== "completed" &&
      activeSession?.presetId === editingPresetId
    ) {
      setPresetError("O preset em uso não pode ser editado.");
      return;
    }

    const now = Date.now();
    const values = {
      name,
      label: `${name} (${newFocusMin}/${newShortBreakMin}/${newLongBreakMin}, ${newCycles} ciclos)`,
      focusMinutes: newFocusMin,
      shortBreakMinutes: newShortBreakMin,
      longBreakMinutes: newLongBreakMin,
      cyclesBeforeLongBreak: newCycles,
      updatedAt: now,
    };
    if (editingPresetId) {
      setPresets((prev) =>
        prev.map((p) => (p.id === editingPresetId ? { ...p, ...values } : p)),
      );
    } else {
      const created = { id: createId("custom"), ...values, createdAt: now };
      setPresets((prev) => [...prev, created]);
      setSelectedPresetId(created.id);
      if (activeSession && activeSession.status !== "completed") {
        habilitarSom();
        setWasRestored(false);
        setActiveSession(createActiveSession(created, "focus", 1));
      }
    }
    setPresetError("");
    setIsPresetModalOpen(false);
  };

  const handleDiscardRestoredSession = () => {
    if (
      !window.confirm("Descartar a sessão recuperada sem registrar progresso?")
    )
      return;
    setActiveSession(null);
    setIdlePhase("focus");
    setWasRestored(false);
  };

  const openAddTaskModal = () => {
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskPriority("Média");
    setTaskStatus("Backlog");
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
    if (trimmed.length < 1 || trimmed.length > 100) {
      window.alert("O título da tarefa deve ter entre 1 e 100 caracteres.");
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
              : item,
          ),
        ),
      );
    } else {
      const created: StudyTask = {
        id: createId("task"),
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
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta tarefa?",
    );

    if (!confirmed) {
      return;
    }

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
        }),
      ),
    );
  };

  // Funções estáveis: evitam que o modal perca o foco enquanto o cronômetro atualiza.
  const fecharModalPreset = useCallback(() => {
    setIsPresetModalOpen(false);
  }, []);

  const fecharModalTarefa = useCallback(() => {
    setIsTaskModalOpen(false);
  }, []);

  return (
    <MainLayout
      stateCode={selectedStateCode}
      headerProps={{
        onBrandClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
        presets,
        selectedPresetId: activePreset.id,
        onPresetChange: handlePresetChange,
        onNewPresetClick: openNewPresetModal,
        isPresetLocked:
          activeSession?.status !== "completed" &&
          activeSession?.presetId === activePreset.id,
        onEditPresetClick: openEditPresetModal,
        onDeletePresetClick: handleDeletePreset,
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
          isPresetLocked={
            activeSession?.status !== "completed" &&
            activeSession?.presetId === activePreset.id
          }
          onEditPresetClick={openEditPresetModal}
          onDeletePresetClick={handleDeletePreset}
        />

        <div className={styles.topStage}>
          <div className={styles.timerSlot}>
            {storageError && (
              <div className={styles.storageNotice} role="alert">
                {storageError}
                <button
                  className={styles.noticeButton}
                  type="button"
                  onClick={() => setStorageError(null)}
                >
                  Fechar
                </button>
              </div>
            )}
            {wasRestored && activeSession && (
              <div className={styles.sessionNotice}>
                Sessão restaurada do navegador.
                <button
                  type="button"
                  className={styles.noticeButton}
                  onClick={handleDiscardRestoredSession}
                >
                  Descartar sessão retomada
                </button>
              </div>
            )}
            <TimerCard
              preset={timerPreset}
              phase={phase}
              secondsLeft={secondsLeft}
              isRunning={isRunning}
              hasSession={activeSession !== null}
              isCompleted={activeSession?.status === "completed"}
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
        title={editingPresetId ? "Editar preset" : "Novo preset"}
        isOpen={isPresetModalOpen}
        onClose={fecharModalPreset}
      >
        <form className={modalStyles.form} onSubmit={handleSavePreset}>
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
              maxLength={40}
              onChange={(event) => setNewPresetName(event.target.value)}
              required
            />
            {presetError.startsWith("Nome:") && (
              <small role="alert" className={styles.fieldError}>
                {presetError}
              </small>
            )}
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
                value={Number.isNaN(newFocusMin) ? "" : newFocusMin}
                onChange={(event) =>
                  setNewFocusMin(
                    event.target.value === ""
                      ? Number.NaN
                      : Number(event.target.value),
                  )
                }
                required
              />
              {presetError.startsWith("Foco:") && (
                <small role="alert" className={styles.fieldError}>
                  {presetError}
                </small>
              )}
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
                value={Number.isNaN(newShortBreakMin) ? "" : newShortBreakMin}
                onChange={(event) =>
                  setNewShortBreakMin(
                    event.target.value === ""
                      ? Number.NaN
                      : Number(event.target.value),
                  )
                }
                required
              />
              {presetError.startsWith("Pausa curta:") && (
                <small role="alert" className={styles.fieldError}>
                  {presetError}
                </small>
              )}
            </div>

            <div className={modalStyles.field}>
              <label htmlFor="preset-cycles" className={modalStyles.label}>
                Ciclos antes da pausa longa
              </label>
              <input
                id="preset-cycles"
                type="number"
                min={1}
                max={12}
                step={1}
                className={modalStyles.input}
                value={Number.isNaN(newCycles) ? "" : newCycles}
                onChange={(event) =>
                  setNewCycles(
                    event.target.value === ""
                      ? Number.NaN
                      : Number(event.target.value),
                  )
                }
                required
              />
              {presetError.startsWith("Ciclos:") && (
                <small role="alert" className={styles.fieldError}>
                  {presetError}
                </small>
              )}
            </div>

            <div className={modalStyles.field}>
              <label htmlFor="preset-long" className={modalStyles.label}>
                Longa (min)
              </label>
              <input
                id="preset-long"
                type="number"
                min={1}
                max={60}
                step={1}
                className={modalStyles.input}
                value={Number.isNaN(newLongBreakMin) ? "" : newLongBreakMin}
                onChange={(event) =>
                  setNewLongBreakMin(
                    event.target.value === ""
                      ? Number.NaN
                      : Number(event.target.value),
                  )
                }
                required
              />
              {presetError.startsWith("Pausa longa:") && (
                <small role="alert" className={styles.fieldError}>
                  {presetError}
                </small>
              )}
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
              {editingPresetId ? "Salvar alterações" : "Salvar preset"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title={editingTaskId ? "Editar tarefa" : "Nova tarefa"}
        isOpen={isTaskModalOpen}
        onClose={fecharModalTarefa}
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
                <option value="A fazer">A fazer</option>
                <option value="Em execução">Em execução</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Backlog">Backlog</option>
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
              {editingTaskId ? "Atualizar" : "Adicionar"}
            </button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
