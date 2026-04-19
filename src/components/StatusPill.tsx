import type { TaskStatus } from '../types';

const statusStyles: Record<TaskStatus, string> = {
  待辦: 'bg-slate-100 text-slate-700 ring-slate-300',
  開發中: 'bg-blue-50 text-blue-700 ring-blue-200',
  測試中: 'bg-orange-50 text-orange-700 ring-orange-200',
  'ready to prod': 'bg-purple-50 text-purple-700 ring-purple-200',
  已完成: 'bg-green-50 text-green-700 ring-green-200',
};

type Props = {
  status: TaskStatus;
};

export function StatusPill({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
