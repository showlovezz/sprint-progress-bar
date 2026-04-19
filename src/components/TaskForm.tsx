import { useState, type FormEvent } from 'react';
import { TASK_STATUSES, type Task, type TaskInput, type TaskStatus } from '../types';

type Props = {
  sprintId: string;
  sprintStartDate: string;
  sprintEndDate: string;
  initial?: Task;
  onSubmit: (input: TaskInput) => void;
  onCancel: () => void;
};

export function TaskForm({
  sprintId,
  sprintStartDate,
  sprintEndDate,
  initial,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? '待辦');
  const [owner, setOwner] = useState(initial?.owner ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? sprintStartDate);
  const [endDate, setEndDate] = useState(initial?.endDate ?? sprintEndDate);
  const [beApiDeliveryDate, setBeApiDeliveryDate] = useState(
    initial?.beApiDeliveryDate ?? ''
  );
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initial);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const o = owner.trim();

    if (!t) return setError('標題不能空白');
    if (!o) return setError('Owner 不能空白');
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return setError('結束日期不能早於開始日期');
    }
    if (startDate && (startDate < sprintStartDate || startDate > sprintEndDate)) {
      return setError(`開始日期需落在 Sprint 區間內（${sprintStartDate} ~ ${sprintEndDate}）`);
    }
    if (endDate && (endDate < sprintStartDate || endDate > sprintEndDate)) {
      return setError(`結束日期需落在 Sprint 區間內（${sprintStartDate} ~ ${sprintEndDate}）`);
    }
    if (beApiDeliveryDate && startDate && endDate) {
      if (beApiDeliveryDate < startDate || beApiDeliveryDate > endDate) {
        return setError('BE 交付 API 日需落在任務起迄區間內');
      }
    }

    setError(null);
    onSubmit({
      sprintId,
      title: t,
      status,
      owner: o,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      beApiDeliveryDate: beApiDeliveryDate || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="text-base font-semibold text-slate-900">
        {isEditing ? '編輯任務' : '新增任務'}
      </h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">標題</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：登入優化"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">狀態</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Owner</span>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="例：Vita"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">開始日期</span>
          <input
            type="date"
            value={startDate}
            min={sprintStartDate}
            max={sprintEndDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">結束日期</span>
          <input
            type="date"
            value={endDate}
            min={sprintStartDate}
            max={sprintEndDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">
            BE 交付 API 日
            <span className="ml-1 text-xs font-normal text-slate-500">
              （選填；純前/純後端任務可留白）
            </span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={beApiDeliveryDate}
              min={startDate || sprintStartDate}
              max={endDate || sprintEndDate}
              onChange={(e) => setBeApiDeliveryDate(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {beApiDeliveryDate && (
              <button
                type="button"
                onClick={() => setBeApiDeliveryDate('')}
                className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                清除
              </button>
            )}
          </div>
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          取消
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {isEditing ? '儲存' : '新增'}
        </button>
      </div>
    </form>
  );
}
