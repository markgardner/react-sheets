import { useCallback, useEffect } from "react";

export const useWindowEvent = <K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  dependencies: React.DependencyList
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  listener = useCallback(listener, dependencies);

  useEffect(() => {
    window.addEventListener(type, listener);

    return () => {
      window.removeEventListener(type, listener);
    };
  }, [type, listener]);
};
