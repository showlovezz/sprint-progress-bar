import { useEffect, useState } from 'react';

/** 專案層級設定（localStorage；未來接 Supabase 時搬到使用者 profile）。 */
export type AppConfig = {
  /** Jira base URL，例：https://jira.tktech.org
   *  TaskRow / Timeline 顯示 jiraKey 時拼成 `${baseUrl}/browse/${key}` 當超連結。 */
  jiraBaseUrl?: string;
};

const STORAGE_KEY = 'sprint-progressbar.config';

function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  return { config, setConfig };
}
