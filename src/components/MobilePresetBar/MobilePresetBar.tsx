import { useId } from 'react';
import type { PresetOption } from '../../types/header';
import styles from './MobilePresetBar.module.css';

export interface MobilePresetBarProps {
  presets: PresetOption[];
  selectedPresetId: string;
  onPresetChange: (presetId: string) => void;
  onNewPresetClick: () => void;
  isPresetLocked?: boolean;
}

export function MobilePresetBar({
  presets,
  selectedPresetId,
  onPresetChange,
  onNewPresetClick,
  isPresetLocked = false,
}: MobilePresetBarProps) {
  const selectId = useId();

  return (
    <div className={styles.bar} role="region" aria-label="Seletor de Presets Mobile">
      <div className={styles.selectGroup}>
        <label htmlFor={selectId} className={styles.label}>
          Preset:
        </label>
        <div className={styles.selectWrapper}>
          <select
            id={selectId}
            className={styles.select}
            value={selectedPresetId}
            disabled={isPresetLocked}
            aria-disabled={isPresetLocked}
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
        disabled={isPresetLocked}
        onClick={onNewPresetClick}
      >
        + Novo
      </button>
    </div>
  );
}
