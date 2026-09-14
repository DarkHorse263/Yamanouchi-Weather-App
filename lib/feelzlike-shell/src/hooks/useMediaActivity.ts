import { useCallback, useEffect, useState, type RefCallback } from "react";

export interface MediaActivityState {
  ref: RefCallback<HTMLElement>;
  active: boolean;
}

/**
 * Reports whether a media surface is both visible in the document and in the
 * viewport.  There is intentionally no fallback when IntersectionObserver is
 * unavailable: media should not start downloading merely because an older
 * browser cannot prove that it is in view.
 */
export function useMediaActivity(): MediaActivityState {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [documentVisible, setDocumentVisible] = useState(false);
  const [inView, setInView] = useState(false);

  const ref = useCallback<RefCallback<HTMLElement>>((nextElement) => {
    setElement(nextElement);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const updateVisibility = () => {
      setDocumentVisible(document.visibilityState === "visible");
    };

    // Keep the initial value false until this effect has observed the document
    // and IntersectionObserver has reported the element in view.
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    setInView(false);
    if (
      !element ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      setInView(entries.some((entry) => entry.isIntersecting));
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return {
    ref,
    active: documentVisible && inView,
  };
}