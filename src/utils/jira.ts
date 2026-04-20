/** 把 jiraKey (TKW-22313) 跟 base URL 組成完整 URL。
 *  base 沒設、key 沒值、或兩者皆無 → null（顯示端就不 render 連結，只顯示 key）。 */
export function jiraUrl(
  key: string | undefined,
  base: string | undefined
): string | null {
  if (!key) return null;
  if (!base) return null;
  const trimmed = base.replace(/\/+$/, '');
  return `${trimmed}/browse/${encodeURIComponent(key)}`;
}
