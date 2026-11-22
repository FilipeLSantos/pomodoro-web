import { Header } from '../components/header';
import type { HeaderProps } from '../components/header';
import styles from './main-layout.module.css';

const stateBackgroundModules = import.meta.glob<string>(
    '../assets/*.{jpg,jpeg,png,webp}',
    { eager: true, import: 'default' }
);

const STATE_BACKGROUNDS: Record<string, string> = Object.fromEntries(
    Object.entries(stateBackgroundModules).map(([path, url]) => {
        const fileName = path.split('/').pop() ?? '';
        const code = fileName.replace(/\.[^.]+$/, '').toLowerCase();
        return [code, url];
    })
);

function getStateBackgroundUrl(stateCode?: string): string | undefined {
    if (!stateCode) return undefined;
    return STATE_BACKGROUNDS[stateCode.toLowerCase()];
}

export interface MainLayoutProps {
    children: React.ReactNode;
    headerProps?: HeaderProps;
    stateCode?: string;
}

export function MainLayout({
    children,
    headerProps,
    stateCode,
}: MainLayoutProps) {
    const backgroundUrl = getStateBackgroundUrl(stateCode);
    const shellStyle = backgroundUrl
        ? {
              backgroundImage: `linear-gradient(180deg, rgba(10, 14, 22, 0.34) 0%, rgba(10, 14, 22, 0.42) 100%), url(${backgroundUrl})`,
          }
        : undefined;

    return (
        <div className={styles.shell} style={shellStyle}>
            <Header {...headerProps} />
            <main className={styles.main}>{children}</main>
        </div>
    );
}
