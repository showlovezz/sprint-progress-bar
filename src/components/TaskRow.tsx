import type { Task } from '../types';
import { formatShortDate } from '../utils/date';
import { jiraUrl } from '../utils/jira';
import { StatusPill } from './StatusPill';

type Props = {
  task: Task;
  jiraBaseUrl?: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskRow({ task, jiraBaseUrl, onEdit, onDelete }: Props) {
  const jiraHref = jiraUrl(task.jiraKey, jiraBaseUrl);
  return (
    <li className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md">
      <div className="min-w-0 flex-1">
        <p
          className="flex items-center gap-2 truncate text-sm font-medium text-slate-900"
          title={task.title}
        >
          {task.jiraKey &&
            (jiraHref ? (
              <a
                href={jiraHref}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
              >
                {task.jiraKey}
              </a>
            ) : (
              <span
                className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
                title="設定 Jira base URL 後會變成超連結"
              >
                {task.jiraKey}
              </span>
            ))}
          <span className="truncate">{task.title}</span>
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
