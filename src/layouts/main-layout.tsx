import { Header } from '../components/header';
import type { HeaderProps } from '../components/header';
//import { LiquidGlassFilters } from '../components/LiquidGlassFilters';
import styles from './main-layout.module.css';

export interface MainLayoutProps {
  children: React.ReactNode;
  headerProps?: HeaderProps;
}

export function MainLayout({ children, headerProps }: MainLayoutProps) {
  return (
    <div className={styles.shell}>
      {/* <LiquidGlassFilters /> */}
      <Header {...headerProps} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
