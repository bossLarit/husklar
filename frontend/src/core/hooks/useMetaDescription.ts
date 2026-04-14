import { useEffect } from "react";

/**
 * Updates `<meta name="description">` when the component mounts.
 * Falls back to the document's default description on unmount.
 */
export function useMetaDescription(description: string) {
  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!existing) return;

    const previous = existing.content;
    existing.content = description;
    return () => {
      existing.content = previous;
    };
  }, [description]);
}
