import type { Sprint } from '../types';
import { formatDate, sprintProgress } from '../utils/date';
import { ProgressBar } from './ProgressBar';

type Props = {
  sprint: Sprint;
  onOpenDetail: (sprint: Sprint) => void;
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprint: Sprint) => void;
};

const statusMeta = {
  upcoming: { label: '未開始', dot: 'bg-slate-400', tone: 'slate' as const },
  'in-progress': { label: '進行中', dot: 'bg-blue-500', tone: 'blue' as const },
  done: { label: '已結束', dot: 'bg-green-500', tone: 'green' as const },
};

export function SprintCard({ sprint, onOpenDetail, onEdit, onDelete }: Props) {
  const progress = sprintProgress(sprint.startDate, sprint.endDate);
  const meta = statusMeta[progress.status];

  const dayLabel =
    progress.status === 'upcoming'
      ? `共 ${progress.total} 天，尚未開始`
      : progress.status === 'done'
        ? `共 ${progress.total} 天，已結束`
        : `第 ${progress.dayIndex} / ${progress.total} 天`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${meta.dot}`} />
            <span className="text-xs font-medium text-slate-500">
              {meta.label}
            </span>
          </div>
          <h3 className="mt-1 text-2xl font-semibold text-slate-900">
            Sprint {sprint.code}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onOpenDetail(sprint)}
            className="rounded-md px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            詳情
          </button>
          <button
            type="button"
            onClick={() => onEdit(sprint)}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            編輯
          </button>
          <button
            type="button"
            onClick={() => onDelete(sprint)}
            className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            刪除
          </button>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar
          percent={progress.percent}
          tone={meta.tone}
          label={`${dayLabel} · ${progress.percent}%`}
        />
      </div>
    </div>
  );
}
