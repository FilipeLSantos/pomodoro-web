import { useId } from "react";
import {
  DEFAULT_BRAZILIAN_STATES,
  DEFAULT_PRESETS,
} from "../../constants/header-defaults";
import type { BrazilianStateOption, PresetOption } from "../../types/header";
import { StateDropdown } from "./StateDropdown";
import styles from "./header.module.css";

export interface HeaderProps {
  brandName?: string;
  brandHref?: string;
  onBrandClick?: () => void;
  presets?: PresetOption[];
  selectedPresetId?: string;
  onPresetChange?: (presetId: string) => void;
  onNewPresetClick?: () => void;
  onEditPresetClick?: () => void;
  onDeletePresetClick?: () => void;
  isPresetLocked?: boolean;
  showPresetSelector?: boolean;
  cycleSwitchEnabled?: boolean;
  onCycleSwitchToggle?: () => void;
  states?: BrazilianStateOption[];
  selectedStateCode?: string;
  onStateChange?: (stateCode: string) => void;
  showStateSelector?: boolean;
  actionsSlot?: React.ReactNode;
  className?: string;
}

export function Header({
  brandName = "POMODORO BRASIL",
  brandHref = "/",
  onBrandClick,
  presets = DEFAULT_PRESETS,
  selectedPresetId = DEFAULT_PRESETS[0].id,
  onPresetChange,
  onNewPresetClick,
  onEditPresetClick,
  onDeletePresetClick,
  isPresetLocked = false,
  showPresetSelector = true,
  cycleSwitchEnabled = true,
  onCycleSwitchToggle,
  states = DEFAULT_BRAZILIAN_STATES,
  selectedStateCode = "RJ",
  onStateChange,
  showStateSelector = true,
  actionsSlot,
  className,
}: HeaderProps) {
  const presetSelectId = useId();

  const headerClassName = className
    ? `${styles.header} ${className}`
    : styles.header;

  return (
    <header className={headerClassName}>
      <a
        href={brandHref}
        className={styles.brand}
        aria-label={`${brandName} - Página inicial`}
        onClick={(event) => {
          if (onBrandClick) {
            event.preventDefault();
            onBrandClick();
          }
        }}
      >
        <span className={styles.dotDesktop} aria-hidden="true" />
        <span className={styles.dotMobile} aria-hidden="true" />
        <span className={styles.brandTitle}>{brandName}</span>
        <svg
          className={styles.brandFlag}
          viewBox="0 0 22 16"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <rect
            x="1"
            y="1"
            width="20"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <polygon
            points="11,3.2 18.2,8 11,12.8 3.8,8"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <circle
            cx="11"
            cy="8"
            r="2.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </a>

      {showPresetSelector && (
        <div
          className={styles.presetGroup}
          role="region"
          aria-label="Seletor de Presets"
        >
          <label htmlFor={presetSelectId} className={styles.presetLabel}>
            Preset:
          </label>
          <div className={styles.selectWrapper}>
            <select
              id={presetSelectId}
              className={styles.presetSelect}
              value={selectedPresetId}
              onChange={(event) => onPresetChange?.(event.target.value)}
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
          <button
            type="button"
            className={styles.newPresetButton}
            onClick={onNewPresetClick}
          >
            + Novo preset
          </button>
          <button
            type="button"
            className={styles.newPresetButton}
            onClick={onEditPresetClick}
            disabled={isPresetLocked || presets.length === 0}
            title={
              isPresetLocked
                ? "Encerre a sessão para editar este preset"
                : "Editar preset selecionado"
            }
          >
            Editar
          </button>
          <button
            type="button"
            className={styles.newPresetButton}
            onClick={onDeletePresetClick}
            disabled={isPresetLocked || presets.length === 0}
            title={
              isPresetLocked
                ? "Encerre a sessão para excluir este preset"
                : "Excluir preset selecionado"
            }
          >
            Excluir
          </button>
        </div>
      )}

      <div className={styles.rightSection}>
        {actionsSlot}

        {showStateSelector && (
          <>
            <div
              className={styles.stateGroup}
              role="region"
              aria-label="Seletor de Estado Brasileiro"
            >
              <button
                type="button"
                className={styles.cycleButton}
                aria-pressed={cycleSwitchEnabled}
                onClick={onCycleSwitchToggle}
              >
                Troca por ciclo
              </button>
              <StateDropdown
                states={states}
                selectedStateCode={selectedStateCode}
                onStateChange={onStateChange}
                variant="desktop"
              />
            </div>

            <StateDropdown
              states={states}
              selectedStateCode={selectedStateCode}
              onStateChange={onStateChange}
              variant="mobile"
            />
          </>
        )}
      </div>
    </header>
  );
}
