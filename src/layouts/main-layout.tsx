import { useEffect, useState } from "react";
import { Header } from "../components/header";
import type { HeaderProps } from "../components/header";
import { LiquidGlassFilters } from "../components/LiquidGlassFilters/LiquidGlassFilters";
import styles from "./main-layout.module.css";

const stateBackgroundModules = import.meta.glob<string>(
  "../assets/*.{jpg,jpeg,png,webp}",
  { eager: true, import: "default" },
);

// Procura a imagem do estado no conjunto de arquivos carregados pelo Vite.
function getStateBackgroundUrl(stateCode?: string): string | undefined {
  if (!stateCode) return undefined;

  const code = stateCode.toLowerCase();
  const caminho = Object.keys(stateBackgroundModules).find((path) => {
    const nomeArquivo = path.split("/").pop() ?? "";
    const estadoArquivo = nomeArquivo.split(".")[0].toLowerCase();
    return estadoArquivo === code;
  });

  if (!caminho) return undefined;
  return stateBackgroundModules[caminho];
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
  const [{ activeUrl, previousUrl }, setBgState] = useState<{
    activeUrl: string | undefined;
    previousUrl: string | undefined;
  }>(() => ({
    activeUrl: getStateBackgroundUrl(stateCode),
    previousUrl: undefined,
  }));

  useEffect(() => {
    const nextUrl = getStateBackgroundUrl(stateCode);
    if (!nextUrl || nextUrl === activeUrl) {
      return;
    }

    let cancelled = false;
    const loader = new Image();
    loader.src = nextUrl;

    const commit = () => {
      if (cancelled) return;
      setBgState((prev) =>
        prev.activeUrl === nextUrl
          ? prev
          : { activeUrl: nextUrl, previousUrl: prev.activeUrl },
      );
    };

    if (typeof loader.decode === "function") {
      loader.decode().then(commit, commit);
    } else if (loader.complete) {
      commit();
    } else {
      loader.onload = commit;
      loader.onerror = commit;
    }

    return () => {
      cancelled = true;
    };
  }, [stateCode, activeUrl]);

  return (
    <div className={styles.shell}>
      <div className={styles.backdrop} aria-hidden="true">
        {previousUrl && (
          <div
            className={styles.backdropLayer}
            style={{ backgroundImage: `url("${previousUrl}")` }}
          />
        )}
        {activeUrl && (
          <div
            key={activeUrl}
            className={`${styles.backdropLayer} ${styles.backdropLayerActive}`}
            style={{ backgroundImage: `url("${activeUrl}")` }}
            onAnimationEnd={() =>
              setBgState((prev) =>
                prev.previousUrl === undefined
                  ? prev
                  : { ...prev, previousUrl: undefined },
              )
            }
          />
        )}
        <div className={styles.backdropScrim} />
      </div>
      <LiquidGlassFilters />
      <Header {...headerProps} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
