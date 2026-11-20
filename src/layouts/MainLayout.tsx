import { Header } from '../components/Header';
import type { HeaderProps } from '../components/Header';
import { LiquidGlassFilters } from '../components/LiquidGlassFilters';
import styles from './MainLayout.module.css';

export interface MainLayoutProps {
  children: React.ReactNode;
  headerProps?: HeaderProps;
}

/**
 * Shared page layout that renders the reusable Header and Liquid Glass SVG filters across all pages.
 */
export function MainLayout({ children, headerProps }: MainLayoutProps) {
  return (
    <div className={styles.shell}>
      <LiquidGlassFilters />
      <Header {...headerProps} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
