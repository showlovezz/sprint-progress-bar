import { useEffect, useState, type FormEvent } from 'react';
import type { AppConfig } from '../hooks/useConfig';

type Props = {
  config: AppConfig;
  onSave: (patch: AppConfig) => void;
  onClose: () => void;
};

export function SettingsModal({ config, onSave, onClose }: Props) {
  const [jiraBaseUrl, setJiraBaseUrl] = useState(config.jiraBaseUrl ?? '');

  // Esc 關閉（跟 MilestoneEditModal / ImportTasksModal 的慣例一致）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trimmed = jiraBaseUrl.trim();
  const invalidUrl =
    trimmed !== '' && !/^https?:\/\//i.test(trimmed);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (invalidUrl) return;
    onSave({ jiraBaseUrl: trimmed || undefined });
  };

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
            <h3 className="text-lg font-semibold text-slate-900">專案設定</h3>
            <p className="mt-1 text-xs text-slate-500">
              設定儲存在本機，暫時不同步到其他裝置。
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

        <div className="mt-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">
              Jira base URL
              <span className="ml-1 text-xs font-normal text-slate-500">
                （設了之後任務卡上的工單號碼會變可點擊超連結）
              </span>
            </span>
            <input
              type="url"
              value={jiraBaseUrl}
              onChange={(e) => setJiraBaseUrl(e.target.value)}
              placeholder="https://jira.tktech.org"
              className={`rounded-md border px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 ${
                invalidUrl
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
            />
          </label>
          {invalidUrl && (
            <p className="mt-1 text-xs text-rose-600">
              需要是 http:// 或 https:// 開頭的完整網址
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            範例：工單 <code className="rounded bg-slate-100 px-1">TKW-22313</code>{' '}
            會組成 <code className="rounded bg-slate-100 px-1">{trimmed || '{base}'}/browse/TKW-22313</code>
          </p>
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
            disabled={invalidUrl}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:bg-slate-300"
          >
            儲存
          </button>
        </div>
      </form>
    </div>
  );
}
