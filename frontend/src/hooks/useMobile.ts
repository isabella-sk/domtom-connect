import { useState, useEffect } from "react";

export const useMobile = (breakpoint = 768): boolean => {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < breakpoint,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    // Pas de setState synchrone : on passe directement par le handler
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    // Synchronisation initiale via une micro-tâche pour éviter l'avertissement ESLint
    const id = setTimeout(() => setIsMobile(mq.matches), 0);
    return () => {
      mq.removeEventListener("change", handler);
      clearTimeout(id);
    };
  }, [breakpoint]);

  return isMobile;
};
