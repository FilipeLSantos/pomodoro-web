import { useEffect, useId, useRef, useState } from 'react';
import type { BrazilianStateOption } from '../../types/header';
import styles from './header.module.css';

export interface StateDropdownProps {
    states: BrazilianStateOption[];
    selectedStateCode: string;
    onStateChange?: (stateCode: string) => void;
    variant: 'desktop' | 'mobile';
}

export function StateDropdown({
    states,
    selectedStateCode,
    onStateChange,
    variant,
}: StateDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const listboxId = useId();

    const selectedIndex = Math.max(
        0,
        states.findIndex((s) => s.code === selectedStateCode)
    );
    const selectedState = states[selectedIndex] ?? states[0];

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || highlightedIndex < 0 || !listRef.current) {
            return;
        }
        const optionEl = listRef.current.children[highlightedIndex] as
            | HTMLElement
            | undefined;
        optionEl?.scrollIntoView({ block: 'nearest' });
    }, [isOpen, highlightedIndex]);

    const openMenu = () => {
        setHighlightedIndex(selectedIndex);
        setIsOpen(true);
    };

    const handleSelect = (code: string) => {
        onStateChange?.(code);
        setIsOpen(false);
        triggerRef.current?.focus();
    };

    const handleTriggerKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        if (states.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!isOpen) {
                openMenu();
            } else {
                setHighlightedIndex((prev) => (prev + 1) % states.length);
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!isOpen) {
                openMenu();
            } else {
                setHighlightedIndex((prev) =>
                    prev <= 0 ? states.length - 1 : prev - 1
                );
            }
        } else if ((event.key === 'Enter' || event.key === ' ') && isOpen) {
            event.preventDefault();
            const chosen = states[highlightedIndex];
            if (chosen) {
                handleSelect(chosen.code);
            }
        }
    };

    const isDesktop = variant === 'desktop';
    const triggerLabel = selectedState
        ? isDesktop
            ? `${selectedState.name} (${selectedState.code})`
            : selectedState.code
        : selectedStateCode;

    return (
        <div
            ref={containerRef}
            className={
                isDesktop ? styles.stateSelectWrapper : styles.mobileStateWrapper
            }
        >
            <button
                ref={triggerRef}
                type="button"
                className={
                    isDesktop
                        ? styles.stateTriggerButton
                        : styles.mobileStateTriggerButton
                }
                aria-label="Selecionar estado brasileiro"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen ? listboxId : undefined}
                onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
                onKeyDown={handleTriggerKeyDown}
            >
                <span className={styles.stateTriggerText}>{triggerLabel}</span>
                <svg
                    className={
                        isOpen
                            ? `${styles.dropdownChevron} ${styles.dropdownChevronOpen}`
                            : styles.dropdownChevron
                    }
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {isOpen && (
                <ul
                    ref={listRef}
                    id={listboxId}
                    role="listbox"
                    aria-label="Estados brasileiros"
                    className={styles.stateMenu}
                >
                    {states.map((state, index) => {
                        const isSelected = state.code === selectedStateCode;
                        const isHighlighted = index === highlightedIndex;
                        return (
                            <li
                                key={state.code}
                                role="option"
                                aria-selected={isSelected}
                                className={[
                                    styles.stateOption,
                                    isSelected ? styles.stateOptionSelected : '',
                                    isHighlighted ? styles.stateOptionHighlighted : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                onClick={() => handleSelect(state.code)}
                            >
                                <span className={styles.stateOptionName}>
                                    {state.name}
                                </span>
                                <span className={styles.stateOptionRight}>
                                    <span className={styles.stateOptionCode}>
                                        {state.code}
                                    </span>
                                    {isSelected && (
                                        <svg
                                            className={styles.stateOptionCheck}
                                            viewBox="0 0 12 12"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M2.5 6.2L5 8.7L9.5 3.5"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
