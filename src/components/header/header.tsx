import { useId } from 'react';
import {DEFAULT_BRAZILIAN_STATES, DEFAULT_PRESETS } from '../../constants/header-defaults';
import type { BrazilianStateOption, PresetOption } from '../../types/header';
import styles from './header.module.css';

export interface HeaderProps {
    brandName?: string;
    brandHref?: string;
    onBrandClick?: () => void;
    presets?: PresetOption[];
    selectedPresetId?: string;
    onPresetChange?: (presetId: string) => void;
    onNewPresetClick?: () => void;
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
    presets = DEFAULT_PRESETS,
    selectedPresetId = DEFAULT_PRESETS[0].id,
    onPresetChange,
    onNewPresetClick,
    showPresetSelector = true,
    cycleSwitchEnabled = true,
    onCycleSwitchToggle,
    states = DEFAULT_BRAZILIAN_STATES,
    selectedStateCode = 'RJ',
    onStateChange,
    showStateSelector = true,
    actionsSlot,
    className,
}: HeaderProps) {
    
    const presetSelectId = useId();
    const stateSelectId = useId();
    const mobileStateSelectId = useId();

    const headerClassName = className
    ? `${styles.header} ${className}`
    : styles.header;

    return (
        <header className={headerClassName}>

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
                <div className={styles.stateSelectWrapper}>
                    <select
                    id={stateSelectId}
                    aria-label="Selecionar estado brasileiro"
                    className={styles.stateSelect}
                    value={selectedStateCode}
                    onChange={(event) => onStateChange?.(event.target.value)}
                    >
                    {states.map((state) => (
                        <option key={state.code} value={state.code}>
                        {state.name} ({state.code})
                        </option>
                    ))}
                    </select>
                    <span className={styles.stateCaret} aria-hidden="true">
                    ▾
                    </span>
                </div>
                </div>

                <div className={styles.mobileStateWrapper}>
                <select
                    id={mobileStateSelectId}
                    aria-label="Selecionar estado brasileiro"
                    className={styles.mobileStateSelect}
                    value={selectedStateCode}
                    onChange={(event) => onStateChange?.(event.target.value)}
                >
                    {states.map((state) => (
                    <option key={state.code} value={state.code}>
                        {state.code}
                    </option>
                    ))}
                </select>
                <span className={styles.mobileStateCaret} aria-hidden="true">
                    ▾
                </span>
                </div>
            </>
            )}
        </div>
        </header>   
    );
}