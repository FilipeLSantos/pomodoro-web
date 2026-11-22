import { useEffect, useRef } from "react";
import styles  from './modal.module.css';

export interface ModalProps{
    title: string;
    isOpen: boolean;
    onClose: ()=> void;
    children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({title, isOpen, onClose, children}: ModalProps){
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect (() => {
        if(!isOpen)
            return;

        const previousActiveElement = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const focusTimer = window.requestAnimationFrame(() => {
            const dialog = dialogRef.current;
            if (!dialog) return;
            const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            const firstTarget = focusables[1] ?? focusables[0] ?? dialog;
            firstTarget.focus();
        });

        const handleKeyDown = (event: KeyboardEvent) => {
            if(event.key === 'Escape') {
                onClose();
                return;
            }

            if (event.key === 'Tab' && dialogRef.current) {
                const focusables = Array.from(
                    dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
                );
                if (focusables.length === 0) {
                    event.preventDefault();
                    return;
                }
                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.cancelAnimationFrame(focusTimer);
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previousActiveElement?.focus?.();
        };
    }, [isOpen, onClose]);

    if(!isOpen)
        return null;

    return(
        <div
            className={styles.backdrop}
            role="presentation"
            onClick={(event) => {
                if(event.target === event.currentTarget)
                    onClose();
            }}
        >
            <div
                ref={dialogRef}
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
            >
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button
                        type="button"
                        className={styles.closeButton}
                        aria-label="Fechar"
                        onClick={onClose}
                    
                    >
                        X
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}