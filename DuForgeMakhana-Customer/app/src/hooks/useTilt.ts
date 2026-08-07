import { useCallback, useEffect, useRef } from "react";

/**
 * Pointer-tracking 3D tilt. Spread the returned handlers on an element with
 * the `.tilt` class (inside a `.tilt-wrap` for perspective). The element
 * rotates toward the cursor and exposes --gx/--gy for a glare highlight.
 *
 * Decorative only:
 *  - disabled for `prefers-reduced-motion: reduce`
 *  - disabled for touch pointers (no hover)
 *  - the pending animation frame is cancelled on unmount
 */
export function useTilt(maxDeg = 7) {
  const frame = useRef<number | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => (reduced.current = mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => {
      mq.removeEventListener?.("change", update);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (reduced.current || e.pointerType === "touch") return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.classList.add("tilting");
        el.style.setProperty("--ry", `${(px - 0.5) * 2 * maxDeg}deg`);
        el.style.setProperty("--rx", `${(0.5 - py) * 2 * maxDeg}deg`);
        el.style.setProperty("--gx", `${px * 100}%`);
        el.style.setProperty("--gy", `${py * 100}%`);
      });
    },
    [maxDeg]
  );

  const onPointerLeave = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.classList.remove("tilting");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  return { onPointerMove, onPointerLeave };
}
