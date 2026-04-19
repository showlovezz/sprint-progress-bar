import { useEffect, useMemo, useState } from 'react';
import type { Task, TaskInput } from '../types';

const STORAGE_KEY = 'sprint-progressbar.tasks';

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function useTasks(sprintId?: string) {
  const [allTasks, setAllTasks] = useState<Task[]>(() => loadTasks());

  useEffect(() => {
    saveTasks(allTasks);
  }, [allTasks]);

  const tasks = useMemo(
    () => (sprintId ? allTasks.filter((t) => t.sprintId === sprintId) : allTasks),
    [allTasks, sprintId]
  );

  const addTask = (input: TaskInput) => {
    const task: Task = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setAllTasks((prev) => [task, ...prev]);
  };

  /** 批次新增（匯入用）：一次 state update、一次 localStorage 寫入。
   *  刻意跟 addTask 分開而不是 loop addTask，避免 N 次 re-render 與 N 次寫磁碟。 */
  const addTasks = (inputs: TaskInput[]): Task[] => {
    const now = new Date().toISOString();
    const newTasks: Task[] = inputs.map((input) => ({
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
    }));
    setAllTasks((prev) => [...newTasks, ...prev]);
    return newTasks;
  };

  const updateTask = (id: string, input: TaskInput) => {
    setAllTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...input } : t))
    );
  };

  const deleteTask = (id: string) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const deleteTasksBySprint = (sid: string) => {
    setAllTasks((prev) => prev.filter((t) => t.sprintId !== sid));
  };

  return { tasks, addTask, addTasks, updateTask, deleteTask, deleteTasksBySprint };
}
