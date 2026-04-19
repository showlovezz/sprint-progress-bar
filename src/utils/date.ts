import { TAIWAN_HOLIDAYS } from '../config/holidays';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// -----------------------------------------------------------------------------
// Timezone 策略：
//   全專案以 Asia/Taipei 作為「今天」的真理（透過 todayTaipei() 取得）。
//   其他所有日期計算都用 UTC 解析 yyyy-mm-dd，與本機時區完全無關。
//   這樣主管在 JP (+9) 打開，看到的 sprint 進度跟 TW 同事同步。
// -----------------------------------------------------------------------------

/** Asia/Taipei 時區的今天，yyyy-mm-dd 字串。全專案唯一讀系統時鐘的 gateway。 */
export function todayTaipei(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** yyyy-mm-dd → UTC 零點 timestamp（純算天數用） */
function isoToUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** UTC timestamp → yyyy-mm-dd 字串 */
function utcMsToIso(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function totalDays(startISO: string, endISO: string): number {
  const diff = isoToUtcMs(endISO) - isoToUtcMs(startISO);
  return Math.floor(diff / MS_PER_DAY) + 1;
}

export type SprintStatus = 'upcoming' | 'in-progress' | 'done';

export function sprintStatus(startISO: string, endISO: string): SprintStatus {
  const today = todayTaipei();
  // yyyy-mm-dd 字串按字典序比較，等同日期比較
  if (today < startISO) return 'upcoming';
  if (today > endISO) return 'done';
  return 'in-progress';
}

export function sprintProgress(startISO: string, endISO: string) {
  const today = todayTaipei();
  const total = totalDays(startISO, endISO);
  const status = sprintStatus(startISO, endISO);

  if (status === 'upcoming') {
    return { percent: 0, dayIndex: 0, total, status };
  }
  if (status === 'done') {
    return { percent: 100, dayIndex: total, total, status };
  }
  const pastDays =
    (isoToUtcMs(today) - isoToUtcMs(startISO)) / MS_PER_DAY;
  const span = (isoToUtcMs(endISO) - isoToUtcMs(startISO)) / MS_PER_DAY;
  const percent = span > 0 ? Math.round((pastDays / span) * 100) : 100;
  return { percent, dayIndex: pastDays + 1, total, status };
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${y}/${m}/${d}`;
}

export function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${m}/${d}`;
}

/** 列出區間內每一天（含起訖），回傳 yyyy-mm-dd 字串陣列 */
export function eachDayInRange(startISO: string, endISO: string): string[] {
  const start = isoToUtcMs(startISO);
  const end = isoToUtcMs(endISO);
  const days: string[] = [];
  for (let t = start; t <= end; t += MS_PER_DAY) {
    days.push(utcMsToIso(t));
  }
  return days;
}

/** 取得某天是星期幾（0=日, 6=六）— UTC 基準，時區無關 */
export function dayOfWeek(iso: string): number {
  return new Date(isoToUtcMs(iso)).getUTCDay();
}

/** 是否為週末（週六或週日） */
export function isWeekend(iso: string): boolean {
  const d = dayOfWeek(iso);
  return d === 0 || d === 6;
}

/** 是否為週一（用來畫週界分隔線） */
export function isMonday(iso: string): boolean {
  return dayOfWeek(iso) === 1;
}

/** 若該日是國定假日回傳假日名稱，否則回傳 null */
export function holidayName(iso: string): string | null {
  return TAIWAN_HOLIDAYS[iso] ?? null;
}

/** 週末或國定假日 */
export function isRestDay(iso: string): boolean {
  return isWeekend(iso) || holidayName(iso) !== null;
}

/** 回傳 iso + N 天的 ISO 字串 */
export function addDays(iso: string, days: number): string {
  return utcMsToIso(isoToUtcMs(iso) + days * MS_PER_DAY);
}

/** 計算區間內扣除週末 + 國定假日的工作天數（含起訖） */
export function countWorkdays(startISO: string, endISO: string): number {
  if (endISO < startISO) return 0;
  let count = 0;
  for (const d of eachDayInRange(startISO, endISO)) {
    if (!isRestDay(d)) count++;
  }
  return count;
}
