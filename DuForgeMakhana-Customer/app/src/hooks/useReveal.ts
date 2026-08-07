import { useEffect, useRef } from "react";

/**
 * Scroll-reveal driver. Attach the returned ref to a container; every
 * descendant with `.reveal` / `.reveal-scale` gets `.is-visible` when it
 * enters the viewport. Stagger siblings by setting `--reveal-delay` inline
 * or via the optional `stagger` (ms) applied in DOM order.
 */
export function useReveal<T extends HTMLElement>(stagger = 0) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof window === "undefined") return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>(".reveal, .reveal-scale"));
    if (targets.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    if (stagger > 0) {
      targets.forEach((el, i) => {
        if (!el.style.getPropertyValue("--reveal-delay")) {
          el.style.setProperty("--reveal-delay", `${(i % 8) * stagger}ms`);
        }
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });

  return ref;
}
