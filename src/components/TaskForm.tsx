import { useState, type FormEvent } from 'react';
import { TASK_STATUSES, type Task, type TaskInput, type TaskStatus } from '../types';
import { fromOwnersArray, toOwnersArray } from '../utils/owners';

type Props = {
  sprintId: string;
  sprintStartDate: string;
  sprintEndDate: string;
  initial?: Task;
  onSubmit: (input: TaskInput) => void;
  onCancel: () => void;
};

const inputClass =
  'rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

const labelSpanClass = 'font-medium text-slate-700';
const hintClass = 'ml-1 text-xs font-normal text-slate-500';

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
  const [jiraKey, setJiraKey] = useState(initial?.jiraKey ?? '');
  const [pm, setPm] = useState(initial?.pm ?? '');
  const [be, setBe] = useState(fromOwnersArray(initial?.beOwners));
  const [fe, setFe] = useState(fromOwnersArray(initial?.feOwners));
  const [ba, setBa] = useState(fromOwnersArray(initial?.baOwners));
  const [qa, setQa] = useState(fromOwnersArray(initial?.qaOwners));
  const [startDate, setStartDate] = useState(initial?.startDate ?? sprintStartDate);
  const [endDate, setEndDate] = useState(initial?.endDate ?? sprintEndDate);
  const [beApiDeliveryDate, setBeApiDeliveryDate] = useState(
    initial?.beApiDeliveryDate ?? ''
  );
  const [feExpectedCompleteDate, setFeExpectedCompleteDate] = useState(
    initial?.feExpectedCompleteDate ?? ''
  );
  const [plannedQaDate, setPlannedQaDate] = useState(initial?.plannedQaDate ?? '');
  const [actualQaDate, setActualQaDate] = useState(initial?.actualQaDate ?? '');
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initial);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const p = pm.trim();

    if (!t) return setError('標題不能空白');
    if (!p) return setError('PM 不能空白');
    if (!startDate) return setError('開始日期為必填');
    if (!endDate) return setError('結束日期為必填');
    if (new Date(endDate) < new Date(startDate)) {
      return setError('結束日期不能早於開始日期');
    }
    if (startDate < sprintStartDate || startDate > sprintEndDate) {
      return setError(`開始日期需落在 Sprint 區間內（${sprintStartDate} ~ ${sprintEndDate}）`);
    }
    // 結束日期允許晚於 sprint（跨 sprint 功能）— 只擋早於 sprint 起始
    if (beApiDeliveryDate && (beApiDeliveryDate < startDate || beApiDeliveryDate > endDate)) {
      return setError('後端預計完成日期需落在任務起迄區間內');
    }

    setError(null);
    const beOwners = toOwnersArray(be);
    const feOwners = toOwnersArray(fe);
    const baOwners = toOwnersArray(ba);
    const qaOwners = toOwnersArray(qa);

    onSubmit({
      sprintId,
      title: t,
      status,
      pm: p,
      beOwners: beOwners.length > 0 ? beOwners : undefined,
      feOwners: feOwners.length > 0 ? feOwners : undefined,
      baOwners: baOwners.length > 0 ? baOwners : undefined,
      qaOwners: qaOwners.length > 0 ? qaOwners : undefined,
      jiraKey: jiraKey.trim() || undefined,
      startDate,
      endDate,
      beApiDeliveryDate: beApiDeliveryDate || undefined,
      feExpectedCompleteDate: feExpectedCompleteDate || undefined,
      plannedQaDate: plannedQaDate || undefined,
      actualQaDate: actualQaDate || undefined,
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
        {/* 標題 */}
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={labelSpanClass}>標題</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：登入優化"
            className={inputClass}
            autoFocus
          />
        </label>

        {/* 狀態 / 工單 */}
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>狀態</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className={`${inputClass} bg-white`}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>
            工單
            <span className={hintClass}>（Jira key，例 TKW-22313）</span>
          </span>
          <input
            type="text"
            value={jiraKey}
            onChange={(e) => setJiraKey(e.target.value)}
            placeholder="TKW-22313"
            className={inputClass}
          />
        </label>

        {/* 角色 */}
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>PM</span>
          <input
            type="text"
            value={pm}
            onChange={(e) => setPm(e.target.value)}
            placeholder="例：Maruko"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>
            BE<span className={hintClass}>（多人用逗號分隔）</span>
          </span>
          <input
            type="text"
            value={be}
            onChange={(e) => setBe(e.target.value)}
            placeholder="例：Eason, Marco"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>
            FE<span className={hintClass}>（多人用逗號分隔）</span>
          </span>
          <input
            type="text"
            value={fe}
            onChange={(e) => setFe(e.target.value)}
            placeholder="例：Jason, Paula"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>
            BA<span className={hintClass}>（多人用逗號分隔）</span>
          </span>
          <input
            type="text"
            value={ba}
            onChange={(e) => setBa(e.target.value)}
            placeholder="例：Tina, Yun"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={labelSpanClass}>
            QA<span className={hintClass}>（多人用逗號分隔）</span>
          </span>
          <input
            type="text"
            value={qa}
            onChange={(e) => setQa(e.target.value)}
            placeholder="例：Wesker, Freedom, Ting"
            className={inputClass}
          />
        </label>

        {/* 日期 — start / end */}
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>開始日期</span>
          <input
            type="date"
            value={startDate}
            min={sprintStartDate}
            max={sprintEndDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>
            結束日期
            <span className={hintClass}>（可超過 Sprint 結束日，用於跨 Sprint 大功能）</span>
          </span>
          <input
            type="date"
            value={endDate}
            min={sprintStartDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className={inputClass}
          />
        </label>

        {/* 日期 — 關鍵節點 */}
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>
            後端預計完成日期
            <span className={hintClass}>（= BE 交付 API 日；選填）</span>
          </span>
          <input
            type="date"
            value={beApiDeliveryDate}
            min={startDate || sprintStartDate}
            max={endDate || sprintEndDate}
            onChange={(e) => setBeApiDeliveryDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>
            前端預計完成日期
            <span className={hintClass}>（選填）</span>
          </span>
          <input
            type="date"
            value={feExpectedCompleteDate}
            onChange={(e) => setFeExpectedCompleteDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>
            預計進測日期
            <span className={hintClass}>（選填）</span>
          </span>
          <input
            type="date"
            value={plannedQaDate}
            onChange={(e) => setPlannedQaDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelSpanClass}>
            實際進測日期
            <span className={hintClass}>（選填）</span>
          </span>
          <input
            type="date"
            value={actualQaDate}
            onChange={(e) => setActualQaDate(e.target.value)}
            className={inputClass}
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
