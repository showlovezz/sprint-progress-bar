import { useEffect, useState } from 'react';
import type { Sprint, SprintInput } from '../types';

const STORAGE_KEY = 'sprint-progressbar.sprints';

function loadSprints(): Sprint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSprints(sprints: Sprint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sprints));
}

export function useSprints() {
  const [sprints, setSprints] = useState<Sprint[]>(() => loadSprints());

  useEffect(() => {
    saveSprints(sprints);
  }, [sprints]);

  const addSprint = (input: SprintInput) => {
    const sprint: Sprint = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setSprints((prev) => [sprint, ...prev]);
  };

  const updateSprint = (id: string, input: SprintInput) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...input } : s))
    );
  };

  const deleteSprint = (id: string) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
  };

  return { sprints, addSprint, updateSprint, deleteSprint };
}
