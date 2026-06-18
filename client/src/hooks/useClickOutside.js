import { useEffect } from "react";

export const useClickOutside = (ref, onClickOutside, enabled = true) => {
  useEffect(() => {
    if (!enabled) return undefined;

    const handleMouseDown = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }

      onClickOutside(event);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [enabled, onClickOutside, ref]);
};

