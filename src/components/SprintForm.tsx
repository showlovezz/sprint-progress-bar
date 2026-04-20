import { useState, type FormEvent } from 'react';
import type { Sprint, SprintInput } from '../types';

type Props = {
  initial?: Sprint;
  existingCodes: string[];
  onSubmit: (input: SprintInput) => void;
  onCancel: () => void;
};

export function SprintForm({ initial, existingCodes, onSubmit, onCancel }: Props) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initial);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();

    if (!trimmed) {
      setError('Sprint 編號不能空白');
      return;
    }
    if (!startDate || !endDate) {
      setError('請選擇開始與結束日期');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('結束日期不能早於開始日期');
      return;
    }
    const conflict = existingCodes
      .filter((c) => c !== initial?.code)
      .some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (conflict) {
      setError(`Sprint 編號 "${trimmed}" 已經存在`);
      return;
    }

    setError(null);
    // 保留既有的里程碑欄位（由詳情頁的 Modal 維護）
    onSubmit({
      code: trimmed,
      startDate,
      endDate,
      finalTestDate: initial?.finalTestDate,
      regressionStartDate: initial?.regressionStartDate,
      releaseDate: initial?.releaseDate,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900">
        {isEditing ? `編輯 Sprint ${initial!.code}` : '新增 Sprint'}
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        里程碑（進測 / 回歸 / 上線）進 Sprint 詳情頁再設定。
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">編號</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="例：5.10"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">開始日期</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">結束日期</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
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
