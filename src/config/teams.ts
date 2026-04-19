/**
 * 前端團隊小組設定。
 *
 * Owner → Team 的對照表目前是 hardcode；日後做 Excel 匯入或
 * 後端時可以改成動態載入 / 使用者自己編輯。
 */
export const TEAMS = ['主管', '前台小組', '後台小組', '未分配'] as const;
export type Team = (typeof TEAMS)[number];

export const OWNER_TEAM: Record<string, Team> = {
  Jenny: '主管',
  Vita: '前台小組',
  Henry: '前台小組',
  Willy: '前台小組',
  Leon: '前台小組',
  Sunny: '後台小組',
  Paula: '後台小組',
  Mary: '未分配',
  Jason: '未分配',
};

/** 找不到對照的 Owner 預設歸在「未分配」 */
export function teamFor(owner: string): Team {
  return OWNER_TEAM[owner] ?? '未分配';
}

/** 回傳 team 在 TEAMS 陣列中的位置，排序用 */
export function teamOrder(team: Team): number {
  return TEAMS.indexOf(team);
}
