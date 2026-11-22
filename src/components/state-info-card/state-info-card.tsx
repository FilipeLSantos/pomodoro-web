import type { BrazilianStateInfo } from "../../types/pomodoro";
import styles from './state-info-card.module.css';

export interface StateInfoCardProps{
    state: BrazilianStateInfo;
    onNextState: ()=> void;
}

export function StateInfoCard({state, onNextState}:StateInfoCardProps){
    const fullName = `${state.name} (${state.code})`;

    return (
        <aside className={styles.card} aria-label="Informações do Estado Atual">
            <div className={styles.mobileHeader}>
                <span className={styles.mobileTitle}>{fullName}</span>
                <button
                    type="button"
                    className={styles.mobileAction}
                    onClick={onNextState}
                >
                    Trocar estado →
                </button>
            </div>

            <p className={styles.eyebrow}>Cenário Atual</p>
            <h2 className={styles.title}>{fullName}</h2>
            <p className={styles.landmark}>{state.landmark}</p>
            <p className={styles.description}>{state.description}</p>

            <div className={styles.divider} aria-hidden="true"/>

            <div className={styles.footer}>
                <span className={styles.region}>{state.region}</span>
                <button
                    type="button"
                    className={styles.nextButton}
                    onClick={onNextState}
                >
                    Próximo estado →
                </button>
            </div>

        </aside>
    );
}