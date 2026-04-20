/** 多人字串 ↔ 陣列的共用轉換 —
 *  CSV 匯入跟 TaskForm 都會用到，放這裡去重。 */

/** 多人字串轉陣列：支援逗號 / 頓號 / 分號 / 換行分隔，去空白去空值。 */
export function toOwnersArray(s: string): string[] {
  return s
    .split(/[，,、;；\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** 陣列轉顯示字串（UI 輸入框預設顯示值用）。 */
export function fromOwnersArray(arr?: string[]): string {
  return (arr ?? []).join(', ');
}
