import { useId } from "react";
import type { PresetOption } from "../../types/header";
import styles from "./MobilePresetBar.module.css";

export interface MobilePresetBarProps {
  presets: PresetOption[];
  selectedPresetId: string;
  onPresetChange: (presetId: string) => void;
  onNewPresetClick: () => void;
  onEditPresetClick: () => void;
  onDeletePresetClick: () => void;
  isPresetLocked?: boolean;
}

export function MobilePresetBar({
  presets,
  selectedPresetId,
  onPresetChange,
  onNewPresetClick,
  onEditPresetClick,
  onDeletePresetClick,
  isPresetLocked = false,
}: MobilePresetBarProps) {
  const selectId = useId();

  return (
    <div
      className={styles.bar}
      role="region"
      aria-label="Seletor de Presets Mobile"
    >
      <div className={styles.selectGroup}>
        <label htmlFor={selectId} className={styles.label}>
          Preset:
        </label>
        <div className={styles.selectWrapper}>
          <select
            id={selectId}
            className={styles.select}
            value={selectedPresetId}
            onChange={(event) => onPresetChange(event.target.value)}
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
          <span className={styles.caret} aria-hidden="true">
            ▾
          </span>
        </div>
      </div>

      <button
        type="button"
        className={styles.newButton}
        onClick={onNewPresetClick}
      >
        + Novo
      </button>
      <button
        type="button"
        className={styles.newButton}
        onClick={onEditPresetClick}
        disabled={isPresetLocked || presets.length === 0}
        aria-label="Editar preset"
      >
        Editar
      </button>
      <button
        type="button"
        className={styles.newButton}
        onClick={onDeletePresetClick}
        disabled={isPresetLocked || presets.length === 0}
        aria-label="Excluir preset"
      >
        Excluir
      </button>
    </div>
  );
}
