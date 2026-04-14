import { useEffect } from "react";

const SUFFIX = "HusKlar";

/**
 * Sets the document title when the component mounts.
 * Format: "{pageTitle} — HusKlar"
 */
export function useDocumentTitle(pageTitle: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} — ${SUFFIX}` : SUFFIX;
  }, [pageTitle]);
}
