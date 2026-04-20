import { Fragment } from 'react';
import { TEAMS, teamFor, type Team } from '../config/teams';
import type { Sprint, Task } from '../types';
import {
  addDays,
  eachDayInRange,
  formatShortDate,
  holidayName,
  isMonday,
  isRestDay,
} from '../utils/date';
import { StatusPill } from './StatusPill';

type Props = {
  sprint: Sprint;
  tasks: Task[];
  onEdit: (task: Task) => void;
};

const statusBarClass: Record<string, string> = {
  待辦: 'bg-slate-400',
  開發中: 'bg-blue-500',
  測試中: 'bg-orange-500',
  'ready to prod': 'bg-purple-500',
  已完成: 'bg-green-500',
};

type MilestoneSpec = {
  key: string;
  label: string;
  bg: string;
  textColor: string;
  startDate: string;
  endDate: string;
};

/** 某天若落在某個 milestone 區間內，回傳該 spec；否則 null */
function findMilestoneForDay(
  iso: string,
  milestones: MilestoneSpec[]
): MilestoneSpec | null {
  return (
    milestones.find((m) => iso >= m.startDate && iso <= m.endDate) ?? null
  );
}

function getMilestones(sprint: Sprint): MilestoneSpec[] {
  const out: MilestoneSpec[] = [];
  if (sprint.finalTestDate) {
    out.push({
      key: 'final-test',
      label: 'QA 最後進測日',
      bg: 'bg-orange-100',
      textColor: 'text-orange-800',
      startDate: sprint.finalTestDate,
      endDate: sprint.finalTestDate,
    });
  }
  if (sprint.regressionStartDate) {
    out.push({
      key: 'regression',
      label: '回歸測試',
      bg: 'bg-purple-100',
      textColor: 'text-purple-800',
      startDate: sprint.regressionStartDate,
      // 向後相容：舊資料沒 regressionEndDate 時 fallback 用 start+1
      endDate:
        sprint.regressionEndDate ?? addDays(sprint.regressionStartDate, 1),
    });
  }
  if (sprint.releaseDate) {
    out.push({
      key: 'release',
      label: '全站更新',
      bg: 'bg-amber-100',
      textColor: 'text-amber-800',
      startDate: sprint.releaseDate,
      endDate: sprint.releaseDate,
    });
  }
  return out;
}

export function TaskTimeline({ sprint, tasks, onEdit }: Props) {
  const days = eachDayInRange(sprint.startDate, sprint.endDate);
  const dayCount = days.length;
  const dayIndex = new Map(days.map((d, i) => [d, i]));

  const scheduled = tasks.filter((t) => t.startDate && t.endDate);
  const unscheduled = tasks.filter((t) => !t.startDate || !t.endDate);

  const milestones = getMilestones(sprint);
  const hasMilestones = milestones.length > 0;

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
        <p className="text-sm text-slate-500">
          沒有任務可以顯示。先到「清單」檢視新增任務。
        </p>
      </div>
    );
  }

  // Group scheduled tasks by team
  const byTeam = new Map<Team, Task[]>();
  for (const t of scheduled) {
    const team = teamFor(t.owner);
    if (!byTeam.has(team)) byTeam.set(team, []);
    byTeam.get(team)!.push(t);
  }
  for (const arr of byTeam.values()) {
    arr.sort((a, b) => {
      if (a.owner !== b.owner) return a.owner.localeCompare(b.owner);
      return (a.startDate ?? '').localeCompare(b.startDate ?? '');
    });
  }

  // Build interleaved rows: tasks grouped by team with separator between teams
  type TimelineRow =
    | { kind: 'task'; task: Task; rowNum: number }
    | { kind: 'separator'; rowNum: number };

  const headerRow = 1;
  const taskStartRow = 2;
  const rowsPlan: TimelineRow[] = [];
  let currentRow = taskStartRow;
  let firstTeamAdded = false;
  for (const team of TEAMS) {
    const group = byTeam.get(team);
    if (!group || group.length === 0) continue;
    if (firstTeamAdded) {
      rowsPlan.push({ kind: 'separator', rowNum: currentRow });
      currentRow++;
    }
    firstTeamAdded = true;
    for (const task of group) {
      rowsPlan.push({ kind: 'task', task, rowNum: currentRow });
      currentRow++;
    }
  }
  const lastRow = currentRow - 1;

  const gridTemplateColumns = `120px minmax(160px, 1fr) 96px repeat(${dayCount}, minmax(32px, 1fr))`;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="min-w-[720px]">
        <div style={{ display: 'grid', gridTemplateColumns }}>
          {/* === Header row (sticky at top on page scroll) === */}
          <div
            style={{ gridRow: headerRow, gridColumn: 1, position: 'sticky', top: 0, zIndex: 20 }}
            className="border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
          >
            Owner
          </div>
          <div
            style={{ gridRow: headerRow, gridColumn: 2, position: 'sticky', top: 0, zIndex: 20 }}
            className="border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
          >
            標題
          </div>
          <div
            style={{ gridRow: headerRow, gridColumn: 3, position: 'sticky', top: 0, zIndex: 20 }}
            className="border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
          >
            狀態
          </div>
          {days.map((d, i) => {
            const rest = isRestDay(d);
            const hName = holidayName(d);
            const m = findMilestoneForDay(d, milestones);
            const weekBoundary = isMonday(d) ? 'border-l-2 border-l-slate-300' : '';
            return (
              <div
                key={`h-${d}`}
                title={hName ?? undefined}
                style={{ gridRow: headerRow, gridColumn: 4 + i, position: 'sticky', top: 0, zIndex: 20 }}
                className={`border-b border-r ${weekBoundary} border-slate-200 ${
                  m?.bg ?? 'bg-slate-50'
                } px-1 py-2 text-center text-xs font-medium shadow-sm ${
                  rest ? 'font-semibold text-rose-600' : 'text-slate-600'
                }`}
              >
                {formatShortDate(d)}
              </div>
            );
          })}

          {/* === Task row info + background cells; separators between teams === */}
          {rowsPlan.map((r) => {
            if (r.kind === 'separator') {
              return (
                <div
                  key={`sep-${r.rowNum}`}
                  style={{
                    gridRow: r.rowNum,
                    gridColumnStart: 1,
                    gridColumnEnd: 4,
                    minHeight: 12,
                  }}
                  className="bg-slate-200"
                />
              );
            }
            const { task, rowNum: row } = r;
            return (
              <Fragment key={`row-${task.id}`}>
                <div
                  style={{ gridRow: row, gridColumn: 1 }}
                  className="border-b border-r border-slate-100 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  {task.owner}
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  style={{ gridRow: row, gridColumn: 2 }}
                  className="border-b border-r border-slate-100 bg-white px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-50"
                  title="點擊編輯"
                >
                  {task.title}
                </button>
                <div
                  style={{ gridRow: row, gridColumn: 3 }}
                  className="flex items-center border-b border-r border-slate-100 bg-white px-3 py-2"
                >
                  <StatusPill status={task.status} />
                </div>
                {days.map((d, i) => {
                  const weekBoundary = isMonday(d)
                    ? 'border-l-2 border-l-slate-300'
                    : '';
                  return (
                    <div
                      key={`bg-${task.id}-${i}`}
                      style={{ gridRow: row, gridColumn: 4 + i, minHeight: 44 }}
                      className={`border-b border-r ${weekBoundary} border-slate-100 bg-white`}
                    />
                  );
                })}
              </Fragment>
            );
          })}

          {/* === Milestone vertical stripes spanning from header bottom through all task rows === */}
          {hasMilestones &&
            milestones.map((m) => {
              const sIdx = dayIndex.get(m.startDate);
              const eIdx = dayIndex.has(m.endDate)
                ? dayIndex.get(m.endDate)!
                : sIdx;
              if (sIdx === undefined || eIdx === undefined) return null;
              return (
                <div
                  key={`stripe-${m.key}`}
                  style={{
                    gridRowStart: taskStartRow,
                    gridRowEnd: lastRow + 1,
                    gridColumnStart: 4 + sIdx,
                    gridColumnEnd: 4 + eIdx + 1,
                    position: 'relative',
                    zIndex: 1,
                  }}
                  className={`${m.bg} flex items-center justify-center overflow-hidden`}
                >
                  <span
                    className={`text-xs font-semibold ${m.textColor}`}
                    style={{
                      writingMode: 'vertical-rl',
                      textOrientation: 'upright',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.3,
                    }}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}

          {/* === Task bars (highest z — overlay everything) === */}
          {rowsPlan.map((r) => {
            if (r.kind !== 'task') return null;
            const { task, rowNum: row } = r;
            const startIdx = dayIndex.get(task.startDate!) ?? 0;
            const endDateInRange = dayIndex.has(task.endDate!);
            const endIdx = endDateInRange
              ? dayIndex.get(task.endDate!)!
              : dayCount - 1;
            // 結束日晚於 sprint 結束 → bar 視覺會 clip 在最後一欄，右側加「→ 實際結束日」標示
            const extendsBeyond = !endDateInRange && task.endDate! > sprint.endDate;
            const beIdx = task.beApiDeliveryDate
              ? dayIndex.get(task.beApiDeliveryDate)
              : undefined;
            const showMarker =
              beIdx !== undefined && beIdx >= startIdx && beIdx <= endIdx;
            const baseColor = statusBarClass[task.status] ?? 'bg-slate-800';
            const tooltipParts = [task.title];
            if (extendsBeyond) {
              tooltipParts.push(`結束 ${task.endDate}（跨 Sprint）`);
            }
            if (showMarker) {
              tooltipParts.push(`BE 交付 ${task.beApiDeliveryDate}`);
            }
            const tooltip = tooltipParts.join('｜');

            return (
              <Fragment key={`bar-${task.id}`}>
                <div
                  className={`my-2 flex items-center justify-start gap-1 overflow-hidden rounded-md px-2 text-xs font-medium text-white shadow-sm ${baseColor}`}
                  style={{
                    gridRow: row,
                    gridColumnStart: 4 + startIdx,
                    gridColumnEnd: 4 + endIdx + 1,
                    alignSelf: 'center',
                    minHeight: 28,
                    position: 'relative',
                    zIndex: 10,
                  }}
                  title={tooltip}
                >
                  <span className="truncate">{task.title}</span>
                  {extendsBeyond && (
                    <span className="ml-auto flex shrink-0 items-center gap-0.5 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 shadow-sm ring-1 ring-slate-300">
                      → {formatShortDate(task.endDate!)}
                    </span>
                  )}
                </div>

                {/* BE 交付日小標籤：疊在 bar 上對應日期那一欄 */}
                {showMarker && (
                  <div
                    style={{
                      gridRow: row,
                      gridColumn: 4 + beIdx,
                      alignSelf: 'center',
                      zIndex: 11,
                      pointerEvents: 'none',
                    }}
                    className="flex items-center justify-center"
                    title={`BE 交付 API ${task.beApiDeliveryDate}`}
                  >
                    <span className="rounded bg-white/95 px-1 py-0.5 text-[10px] font-semibold text-slate-800 shadow ring-1 ring-slate-300">
                      {formatShortDate(task.beApiDeliveryDate!)}
                    </span>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {unscheduled.length > 0 && (
        <div className="border-t border-slate-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          還有 {unscheduled.length} 項任務沒有起迄日期，不會顯示在時間軸上：
          {unscheduled.map((t, i) => (
            <span key={t.id}>
              {i > 0 && '、'}
              <span className="font-semibold">「{t.title}」</span>
              <span className="text-amber-700">（{t.owner}）</span>
            </span>
          ))}
          。到「清單」檢視編輯補上日期。
        </div>
      )}
    </div>
  );
}
