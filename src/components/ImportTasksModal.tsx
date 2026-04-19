import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { HEADERS, parseImportFile, type ParsedRow } from '../utils/importTasks';
import type { Sprint, TaskInput } from '../types';

type Props = {
  sprint: Sprint;
  onImport: (inputs: TaskInput[]) => void;
  onClose: () => void;
};

type Phase = 'idle' | 'parsing' | 'preview' | 'done';

/**
 * 匯入任務 Modal。
 * 流程：idle（選檔）→ parsing → preview（審核有效/無效列）→ done（匯入成功訊息、auto close）。
 * 無效列不擋匯入，只是不送進 addTasks。使用者可以在 Modal 內切「只看錯誤列」專心 review 要修的部分。
 */
export function ImportTasksModal({ sprint, onImport, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  // Esc 關閉（對齊 MilestoneEditModal 慣例）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { valid, invalid } = useMemo(() => {
    const v: Extract<ParsedRow, { ok: true }>[] = [];
    const iv: Extract<ParsedRow, { ok: false }>[] = [];
    for (const r of rows) {
      if (r.ok) v.push(r);
      else iv.push(r);
    }
    return { valid: v, invalid: iv };
  }, [rows]);

  const visibleRows = showOnlyErrors ? invalid : rows;

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPhase('parsing');
    setParseError(null);
    try {
      const parsed = await parseImportFile(file, sprint);
      setRows(parsed);
      setPhase('preview');
    } catch (err) {
      console.error('[ImportTasksModal] parse failed', err);
      setParseError('檔案解析失敗，請確認是 CSV 或 XLSX 格式且未損壞。');
      setPhase('idle');
    }
    // reset input so user can re-pick same file
    e.target.value = '';
  };

  const handleConfirm = () => {
    if (valid.length === 0) return;
    const inputs: TaskInput[] = valid.map((r) => r.task);
    onImport(inputs);
    setDoneCount(inputs.length);
    setPhase('done');
    setTimeout(() => onClose(), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">匯入任務</h3>
            <p className="mt-1 text-xs text-slate-500">
              支援 .csv / .xlsx；欄位順序：
              <span className="font-mono">
                {Object.values(HEADERS).join(' | ')}
              </span>
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

        {/* Body — scrollable */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {phase === 'idle' && (
            <IdleView
              onFile={handleFile}
              fileName={fileName}
              parseError={parseError}
            />
          )}
          {phase === 'parsing' && (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              解析中…
            </div>
          )}
          {phase === 'preview' && (
            <PreviewView
              rows={visibleRows}
              totalCount={rows.length}
              validCount={valid.length}
              invalidCount={invalid.length}
              showOnlyErrors={showOnlyErrors}
              onToggleOnlyErrors={setShowOnlyErrors}
              fileName={fileName}
            />
          )}
          {phase === 'done' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-5xl">✓</div>
              <p className="mt-3 text-sm text-slate-700">
                已匯入 {doneCount} 筆任務
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {phase !== 'done' && (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              取消
            </button>
            {phase === 'preview' && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={valid.length === 0}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:bg-slate-300"
              >
                確認匯入 {valid.length} 筆
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function IdleView({
  onFile,
  fileName,
  parseError,
}: {
  onFile: (e: ChangeEvent<HTMLInputElement>) => void;
  fileName: string;
  parseError: string | null;
}) {
  return (
    <div className="py-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <div className="text-4xl">📥</div>
        <div>
          <p className="text-sm font-medium text-slate-700">選擇檔案</p>
          <p className="mt-1 text-xs text-slate-500">
            .csv 或 .xlsx；第一列需為欄位名稱（header）
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          選擇檔案
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFile}
            className="hidden"
          />
        </label>
        {fileName && (
          <p className="text-xs text-slate-500">已選擇：{fileName}</p>
        )}
        {parseError && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {parseError}
          </p>
        )}
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span>第一次用？下載範本開始填</span>
          <a
            href="/task-template.csv"
            download="task-template.csv"
            className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
          >
            下載範本 CSV
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function PreviewView({
  rows,
  totalCount,
  validCount,
  invalidCount,
  showOnlyErrors,
  onToggleOnlyErrors,
  fileName,
}: {
  rows: ParsedRow[];
  totalCount: number;
  validCount: number;
  invalidCount: number;
  showOnlyErrors: boolean;
  onToggleOnlyErrors: (v: boolean) => void;
  fileName: string;
}) {
  if (totalCount === 0) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        這個檔案沒有可匯入的資料列。請確認第一列是欄位名稱、資料從第二列開始。
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-700">
          <span className="font-medium">{fileName}</span>
          <span className="mx-2 text-slate-300">|</span>
          共 {totalCount} 筆
          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            ✓ {validCount} 有效
          </span>
          {invalidCount > 0 && (
            <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
              ✗ {invalidCount} 錯誤
            </span>
          )}
        </div>
        {invalidCount > 0 && (
          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={showOnlyErrors}
              onChange={(e) => onToggleOnlyErrors(e.target.checked)}
              className="rounded border-slate-300"
            />
            只看錯誤列
          </label>
        )}
      </div>

      {/* Preview table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-600">
            <tr>
              <th className="px-2 py-2 text-left">#</th>
              <th className="px-2 py-2 text-center">狀態</th>
              <th className="px-2 py-2 text-left">{HEADERS.title}</th>
              <th className="px-2 py-2 text-left">{HEADERS.owner}</th>
              <th className="px-2 py-2 text-left">{HEADERS.status}</th>
              <th className="px-2 py-2 text-left">{HEADERS.startDate}</th>
              <th className="px-2 py-2 text-left">{HEADERS.endDate}</th>
              <th className="px-2 py-2 text-left">{HEADERS.beApiDeliveryDate}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <PreviewRow key={r.rowIndex} row={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PreviewRow({ row }: { row: ParsedRow }) {
  if (row.ok) {
    const { task } = row;
    return (
      <tr className="border-t border-slate-100 bg-green-50/40">
        <td className="px-2 py-2 text-xs text-slate-500">{row.rowIndex}</td>
        <td className="px-2 py-2 text-center text-green-600">✓</td>
        <td className="px-2 py-2 font-medium text-slate-900">{task.title}</td>
        <td className="px-2 py-2 text-slate-700">{task.owner}</td>
        <td className="px-2 py-2 text-slate-700">{task.status}</td>
        <td className="px-2 py-2 text-slate-600">{task.startDate ?? '—'}</td>
        <td className="px-2 py-2 text-slate-600">{task.endDate ?? '—'}</td>
        <td className="px-2 py-2 text-slate-600">
          {task.beApiDeliveryDate ?? '—'}
        </td>
      </tr>
    );
  }

  // invalid
  return (
    <>
      <tr className="border-t border-slate-100 bg-rose-50/60">
        <td className="px-2 py-2 text-xs text-slate-500">{row.rowIndex}</td>
        <td className="px-2 py-2 text-center text-rose-600">✗</td>
        <td className="px-2 py-2 font-medium text-slate-900">
          {row.raw[HEADERS.title] || <em className="text-slate-400">(空)</em>}
        </td>
        <td className="px-2 py-2 text-slate-700">
          {row.raw[HEADERS.owner] || <em className="text-slate-400">(空)</em>}
        </td>
        <td className="px-2 py-2 text-slate-700">{row.raw[HEADERS.status]}</td>
        <td className="px-2 py-2 text-slate-600">{row.raw[HEADERS.startDate]}</td>
        <td className="px-2 py-2 text-slate-600">{row.raw[HEADERS.endDate]}</td>
        <td className="px-2 py-2 text-slate-600">
          {row.raw[HEADERS.beApiDeliveryDate]}
        </td>
      </tr>
      <tr className="bg-rose-50/60">
        <td />
        <td colSpan={7} className="px-2 pb-2 text-xs text-rose-700">
          {row.errors.map((err, i) => (
            <div key={i}>└ {err}</div>
          ))}
        </td>
      </tr>
    </>
  );
}
