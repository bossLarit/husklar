import { useCallback, useEffect, useState } from "react";
import {
  type Checklist,
  type PhaseId,
  defaultChecklist,
  newId,
} from "../../domain/checklistTemplate";

const STORAGE_KEY = "husklar.checklist.v1";

function loadFromStorage(): Checklist | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      (parsed as { version: unknown }).version === 1
    ) {
      return parsed as Checklist;
    }
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(checklist: Checklist): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checklist));
  } catch {
    // Quota exceeded or localStorage disabled — silent fail
  }
}

export function useChecklistState() {
  const [checklist, setChecklist] = useState<Checklist>(() => {
    return loadFromStorage() ?? defaultChecklist();
  });

  useEffect(() => {
    saveToStorage(checklist);
  }, [checklist]);

  const updatePhase = useCallback(
    (phaseId: PhaseId, updater: (phase: Checklist["phases"][number]) => Checklist["phases"][number]) => {
      setChecklist((c) => ({
        ...c,
        phases: c.phases.map((p) => (p.id === phaseId ? updater(p) : p)),
      }));
    },
    [],
  );

  const toggleItem = useCallback(
    (phaseId: PhaseId, itemId: string) => {
      updatePhase(phaseId, (p) => ({
        ...p,
        items: p.items.map((it) =>
          it.id === itemId ? { ...it, checked: !it.checked } : it,
        ),
      }));
    },
    [updatePhase],
  );

  const updateNote = useCallback(
    (phaseId: PhaseId, itemId: string, note: string) => {
      updatePhase(phaseId, (p) => ({
        ...p,
        items: p.items.map((it) =>
          it.id === itemId ? { ...it, note: note || undefined } : it,
        ),
      }));
    },
    [updatePhase],
  );

  const addItem = useCallback(
    (phaseId: PhaseId, label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      updatePhase(phaseId, (p) => ({
        ...p,
        items: [
          ...p.items,
          { id: newId("chk"), label: trimmed, checked: false, custom: true },
        ],
      }));
    },
    [updatePhase],
  );

  const removeItem = useCallback(
    (phaseId: PhaseId, itemId: string) => {
      updatePhase(phaseId, (p) => ({
        ...p,
        items: p.items.filter((it) => it.id !== itemId),
      }));
    },
    [updatePhase],
  );

  const reset = useCallback(() => {
    setChecklist(defaultChecklist());
  }, []);

  return {
    checklist,
    toggleItem,
    updateNote,
    addItem,
    removeItem,
    reset,
  };
}
