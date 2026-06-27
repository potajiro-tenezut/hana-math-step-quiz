import { useEffect, useRef, useState } from "react";

export function useStepTimer(active: boolean, resetKey: string, onTimeout: () => void) {
  const [remaining, setRemaining] = useState(20);
  const firedRef = useRef(false);

  useEffect(() => {
    setRemaining(20);
    firedRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (active && remaining === 0 && !firedRef.current) {
      firedRef.current = true;
      onTimeout();
    }
  }, [active, onTimeout, remaining]);

  return remaining;
}
