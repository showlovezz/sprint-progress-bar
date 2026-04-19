import type { Task } from '../types';
import { TASK_STATUSES } from '../types';
import { TaskRow } from './TaskRow';

type Props = {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

const statusOrder: Record<string, number> = TASK_STATUSES.reduce(
  (acc, s, i) => {
    acc[s] = i;
    return acc;
  },
  {} as Record<string, number>
);

export function TaskList({ tasks, onEdit, onDelete }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <p className="text-sm text-slate-500">
          這個 Sprint 還沒有任務，點上面「+ 新增任務」開始。
        </p>
      </div>
    );
  }

  const sorted = [...tasks].sort((a, b) => {
    const statusDiff =
      (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
