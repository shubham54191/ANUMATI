"use client";
import { useEffect, useRef, useState } from "react";

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useCountUp(target: number, duration = 900, delay = 0) {
  const [value, setValue] = useState(() => (prefersReduced() ? target : 0));
  const from = useRef(0);
  const raf = useRef<number>();

  useEffect(() => {
    if (prefersReduced()) {
      setValue(target);
      return;
    }
    const start = from.current;
    const delta = target - start;
    if (delta === 0) return;

    let t0 = 0;
    const step = (now: number) => {
      if (!t0) t0 = now;
      const elapsed = now - t0 - delay;
      if (elapsed < 0) {
        raf.current = requestAnimationFrame(step);
        return;
      }
      const p = Math.min(elapsed / duration, 1);

      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      const next = Math.round(start + delta * eased);
      setValue(next);
      from.current = next;
      if (p < 1) raf.current = requestAnimationFrame(step);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, delay]);

  return value;
}
