import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { z } from 'zod';
import type { Sprint } from '../types';
import { addDays, formatDate } from '../utils/date';

export type MilestonePatch = {
  finalTestDate?: string;
  regressionStartDate?: string;
  regressionEndDate?: string;
  releaseDate?: string;
};

type Props = {
  sprint: Sprint;
  onSave: (patch: MilestonePatch) => void;
  onClose: () => void;
};

/** 以 sprint 起迄為邊界建立 zod schema。空字串視為未設、略過 range 檢查。 */
function makeSchema(sprintStart: string, sprintEnd: string) {
  const inRange = (label: string) =>
    z.string().refine(
      (v) => !v || (v >= sprintStart && v <= sprintEnd),
      `${label}需在 ${formatDate(sprintStart)} ~ ${formatDate(sprintEnd)} 之內`
    );

  return z
    .object({
      finalTestDate: inRange('QA 最後進測日'),
      regressionStartDate: inRange('回歸測試開始'),
      regressionEndDate: inRange('回歸測試結束'),
      releaseDate: inRange('全站更新'),
    })
    .refine(
      (v) =>
        !v.regressionStartDate ||
        !v.regressionEndDate ||
        v.regressionEndDate >= v.regressionStartDate,
      {
        message: '回歸測試結束不能早於開始',
        path: ['regressionEndDate'],
      }
    );
}

type FieldKey =
  | 'finalTestDate'
  | 'regressionStartDate'
  | 'regressionEndDate'
  | 'releaseDate';

export function MilestoneEditModal({ sprint, onSave, onClose }: Props) {
  const [finalTestDate, setFinalTestDate] = useState(sprint.finalTestDate ?? '');
  const [regressionStartDate, setRegressionStartDate] = useState(
    sprint.regressionStartDate ?? ''
  );
  // 向後相容：舊資料只有 start 沒 end → pre-fill start+1（延續原本 2 天默契）
  const [regressionEndDate, setRegressionEndDate] = useState(
    sprint.regressionEndDate ??
      (sprint.regressionStartDate
        ? addDays(sprint.regressionStartDate, 1)
        : '')
  );
  const [releaseDate, setReleaseDate] = useState(sprint.releaseDate ?? '');

  // Esc 關閉
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const schema = useMemo(
    () => makeSchema(sprint.startDate, sprint.endDate),
    [sprint.startDate, sprint.endDate]
  );

  const values = {
    finalTestDate,
    regressionStartDate,
    regressionEndDate,
    releaseDate,
  };

  const result = schema.safeParse(values);
  const errors: Partial<Record<FieldKey, string>> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as FieldKey | undefined;
      if (key && !errors[key]) errors[key] = issue.message;
    }
  }
  const canSubmit = result.success;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSave({
      finalTestDate: finalTestDate || undefined,
      regressionStartDate: regressionStartDate || undefined,
      regressionEndDate: regressionEndDate || undefined,
      releaseDate: releaseDate || undefined,
    });
  };

  const clear = (setter: (v: string) => void) => () => setter('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">編輯里程碑</h3>
            <p className="mt-1 text-xs text-slate-500">
              留白即不設定。日期需落在 Sprint 區間內（
              {formatDate(sprint.startDate)} ~ {formatDate(sprint.endDate)}）。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <MilestoneDateField
            dotClass="bg-orange-500"
            label="QA 最後進測日"
            value={finalTestDate}
            onChange={setFinalTestDate}
            onClear={clear(setFinalTestDate)}
            focusRing="focus:border-orange-500 focus:ring-orange-200"
            error={errors.finalTestDate}
          />
          <MilestoneDateField
            dotClass="bg-purple-500"
            label="回歸測試開始"
            value={regressionStartDate}
            onChange={setRegressionStartDate}
            onClear={clear(setRegressionStartDate)}
            focusRing="focus:border-purple-500 focus:ring-purple-200"
            error={errors.regressionStartDate}
          />
          <MilestoneDateField
            dotClass="bg-purple-500"
            label="回歸測試結束"
            value={regressionEndDate}
            onChange={setRegressionEndDate}
            onClear={clear(setRegressionEndDate)}
            focusRing="focus:border-purple-500 focus:ring-purple-200"
            error={errors.regressionEndDate}
          />
          <MilestoneDateField
            dotClass="bg-amber-500"
            label="全站更新"
            value={releaseDate}
            onChange={setReleaseDate}
            onClear={clear(setReleaseDate)}
            focusRing="focus:border-amber-500 focus:ring-amber-200"
            error={errors.releaseDate}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:bg-slate-300"
          >
            儲存
          </button>
        </div>
      </form>
    </div>
  );
}

type FieldProps = {
  dotClass: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  focusRing: string;
  error?: string;
};

function MilestoneDateField({
  dotClass,
  label,
  hint,
  value,
  onChange,
  onClear,
  focusRing,
  error,
}: FieldProps) {
  const hasError = Boolean(error);
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-slate-500">（{hint}）</span>}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 rounded-md border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
            hasError ? 'border-rose-400 focus:ring-rose-200' : `border-slate-300 ${focusRing}`
          }`}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            清除
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
