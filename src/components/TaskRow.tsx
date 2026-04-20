import type { Task } from '../types';
import { formatShortDate } from '../utils/date';
import { StatusPill } from './StatusPill';

type Props = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskRow({ task, onEdit, onDelete }: Props) {
  return (
    <li className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md">
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium text-slate-900"
          title={task.title}
        >
          {task.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
          {task.pm && <span>PM · {task.pm}</span>}
          {task.feOwners && task.feOwners.length > 0 && (
            <span>FE · {task.feOwners.join(', ')}</span>
          )}
          {task.beApiDeliveryDate && (
            <span className="text-slate-600">
              BE 交付 {formatShortDate(task.beApiDeliveryDate)}
            </span>
          )}
        </p>
      </div>
      <div className="shrink-0">
        <StatusPill status={task.status} />
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          編輯
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          刪除
        </button>
      </div>
    </li>
  );
}
