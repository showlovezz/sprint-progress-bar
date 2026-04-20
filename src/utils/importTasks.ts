import * as XLSX from 'xlsx';
import { z } from 'zod';
import { TASK_STATUSES, type Sprint, type TaskInput, type TaskStatus } from '../types';

/**
 * CSV / XLSX 匯入：一個檔案 → 一串 ParsedRow（逐列成功或失敗）。
 * 同檔案能處理 CSV 跟 XLSX 是因為 SheetJS 的 XLSX.read 兩種都吃。
 *
 * 錯誤策略：每一列獨立驗證，不因為某一列爛就放棄整份。
 * Modal 那層會顯示清單、讓使用者決定是否送出有效列。
 */

export type ParsedRow =
  | { ok: true; rowIndex: number; task: TaskInput; raw: Record<string, string> }
  | { ok: false; rowIndex: number; raw: Record<string, string>; errors: string[] };

const HEADERS = {
  title: '標題',
  owner: 'Owner',
  status: '狀態',
  startDate: '開始日期',
  endDate: '結束日期',
  beApiDeliveryDate: 'BE 交付日期',
} as const;

/** sentinel：normalizeDate 無法解析時回傳這個，讓 schema 辨識為錯誤格式。 */
const INVALID_DATE = '__INVALID_DATE__';

/**
 * 把不同來源的日期值統一成 yyyy-mm-dd。
 * - XLSX cell（cellDates: true）→ JS Date，取 UTC 組字串（跟專案其他地方一致、避開時區偏移）
 * - CSV 字串 → 2026-04-24 / 2026/04/24 / 2026.04.24 三種分隔皆可
 * - 空值 → undefined（留給 schema optional 處理）
 * - 解析不出來 → sentinel，讓 schema 報錯
 */
function normalizeDate(raw: unknown): string | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  if (raw instanceof Date) {
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, '0');
    const d = String(raw.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(raw).trim();
  if (!s) return undefined;
  const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!m) return INVALID_DATE;
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** 讀 raw row（header → value）中某欄位的原始值，統一成 string（空白 trim 後）。
 *  Date 物件（SheetJS 在 cellDates:true 時會把像日期的 cell 轉 Date）→ 格式化 yyyy-mm-dd
 *  給使用者看，不要露出 "Sat Apr 25 2026 08:00:00 GMT..." 這種完整 toString。 */
function readCell(row: Record<string, unknown>, header: string): string {
  const v = row[header];
  if (v === null || v === undefined) return '';
  if (v instanceof Date) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, '0');
    const d = String(v.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v).trim();
}

/** 整列是否整個空白（所有欄位都 undefined/空字串）。 */
function isEmptyRow(row: Record<string, unknown>): boolean {
  return Object.values(HEADERS).every((h) => readCell(row, h) === '');
}

function makeRowSchema(sprint: Sprint) {
  const { startDate: sStart, endDate: sEnd } = sprint;

  const dateInSprint = (label: string, { required }: { required: boolean }) =>
    z
      .string()
      .optional()
      .refine((v) => !required || (v !== undefined && v !== INVALID_DATE), {
        message: `${label}為必填`,
      })
      .refine((v) => v !== INVALID_DATE, {
        message: `${label}格式不合法（需 yyyy-mm-dd 或 Excel 日期）`,
      })
      .refine((v) => !v || (v >= sStart && v <= sEnd), {
        message: `${label}需在 ${sStart} ~ ${sEnd} 之內`,
      });

  return z
    .object({
      title: z.string().min(1, '標題不能空白'),
      owner: z.string().min(1, 'Owner 不能空白'),
      status: z
        .string()
        .optional()
        .refine(
          (v) => !v || (TASK_STATUSES as readonly string[]).includes(v),
          {
            message: `狀態必須是：${TASK_STATUSES.join(' / ')}`,
          }
        ),
      startDate: dateInSprint('開始日期', { required: true }),
      endDate: dateInSprint('結束日期', { required: true }),
      beApiDeliveryDate: dateInSprint('BE 交付日期', { required: false }),
    })
    .refine(
      (v) => !v.startDate || !v.endDate || v.endDate >= v.startDate,
      { message: '結束日期不能早於開始日期', path: ['endDate'] }
    )
    .refine(
      (v) => {
        // BE 交付日：若 task 有自己的範圍，要在範圍內；否則上面的 sprint 範圍已擋
        if (!v.beApiDeliveryDate) return true;
        if (v.startDate && v.beApiDeliveryDate < v.startDate) return false;
        if (v.endDate && v.beApiDeliveryDate > v.endDate) return false;
        return true;
      },
      { message: 'BE 交付日期需落在任務起迄區間內', path: ['beApiDeliveryDate'] }
    );
}

/**
 * 單列解析：normalize → zod validate → 組 TaskInput。
 * rowIndex 是「檔案裡的邏輯列號」（header = row 1，第一筆資料 = row 2）— 給 UI 顯示用。
 */
function parseRow(
  row: Record<string, unknown>,
  rowIndex: number,
  sprint: Sprint,
  schema: ReturnType<typeof makeRowSchema>
): ParsedRow {
  // raw 留原字串給 Modal 顯示、也給錯誤列看得到原資料
  const raw: Record<string, string> = {
    [HEADERS.title]: readCell(row, HEADERS.title),
    [HEADERS.owner]: readCell(row, HEADERS.owner),
    [HEADERS.status]: readCell(row, HEADERS.status),
    [HEADERS.startDate]: readCell(row, HEADERS.startDate),
    [HEADERS.endDate]: readCell(row, HEADERS.endDate),
    [HEADERS.beApiDeliveryDate]: readCell(row, HEADERS.beApiDeliveryDate),
  };

  const candidate = {
    title: readCell(row, HEADERS.title),
    owner: readCell(row, HEADERS.owner),
    status: readCell(row, HEADERS.status) || undefined,
    startDate: normalizeDate(row[HEADERS.startDate]),
    endDate: normalizeDate(row[HEADERS.endDate]),
    beApiDeliveryDate: normalizeDate(row[HEADERS.beApiDeliveryDate]),
  };

  const result = schema.safeParse(candidate);
  if (!result.success) {
    const errors = result.error.issues.map((i) => i.message);
    return { ok: false, rowIndex, raw, errors };
  }

  const parsed = result.data;
  const task: TaskInput = {
    sprintId: sprint.id,
    title: parsed.title,
    status: (parsed.status ?? '待辦') as TaskStatus,
    owner: parsed.owner,
    startDate: parsed.startDate || undefined,
    endDate: parsed.endDate || undefined,
    beApiDeliveryDate: parsed.beApiDeliveryDate || undefined,
  };
  return { ok: true, rowIndex, task, raw };
}

/**
 * 主入口：把 File（CSV 或 XLSX）拆成一串 ParsedRow。
 * 失敗不 throw — parse 階段的系統錯誤（如檔案壞）會 throw，schema 階段的錯誤會走 ok:false。
 */
export async function parseImportFile(
  file: File,
  sprint: Sprint
): Promise<ParsedRow[]> {
  const isXlsx = /\.xlsx?$/i.test(file.name);
  // CSV 必須先 UTF-8 decode 成字串 — 不然 SheetJS 會用 Latin-1 解 bytes、中文 header 全亂碼。
  // XLSX 是 zip binary，維持 ArrayBuffer 路徑讓 SheetJS 自己處理。
  const input: string | ArrayBuffer = isXlsx
    ? await file.arrayBuffer()
    : await file.text();
  const workbook = XLSX.read(input, {
    cellDates: true,
    type: isXlsx ? 'array' : 'string',
  });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });

  const schema = makeRowSchema(sprint);
  const out: ParsedRow[] = [];
  rows.forEach((row, idx) => {
    if (isEmptyRow(row)) return; // 空白列直接跳過、不計錯
    // rowIndex = 2 是檔案裡的第一筆資料列（header 是第 1 列）
    const rowIndex = idx + 2;
    out.push(parseRow(row, rowIndex, sprint, schema));
  });
  return out;
}

export { HEADERS };
