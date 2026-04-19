import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSprints } from '../hooks/useSprints';
import { useTasks } from '../hooks/useTasks';
import { ImportTasksModal } from '../components/ImportTasksModal';
import { MilestoneEditModal, type MilestonePatch } from '../components/MilestoneEditModal';
import { ProgressBar } from '../components/ProgressBar';
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { TaskTimeline } from '../components/TaskTimeline';
import { ViewToggle, type TaskView } from '../components/ViewToggle';
import {
  addDays,
  countWorkdays,
  formatDate,
  formatShortDate,
  sprintProgress,
} from '../utils/date';
import type { Sprint, Task, TaskInput } from '../types';

/** 開發工作天 = startDate ~ QA 最後進測日（含當天），扣週末假日。
 *  語意：進測日當天 end of day 前交付 QA，所以當天仍算 dev day。
 *  若沒設 finalTestDate，回 0 — 強制使用者明確設定進測 deadline，避免模糊估算。 */
function devWorkdaysOf(sprint: Sprint): number {
  if (!sprint.finalTestDate) return 0;
  return countWorkdays(sprint.startDate, sprint.finalTestDate);
}

type FormState =
  | { mode: 'idle' }
  | { mode: 'create' }
  | { mode: 'edit'; task: Task };

const statusMeta = {
  upcoming: { label: '未開始', tone: 'slate' as const },
  'in-progress': { label: '進行中', tone: 'blue' as const },
  done: { label: '已結束', tone: 'green' as const },
};

export function SprintDetailPage() {
  const { sprintId = '' } = useParams<{ sprintId: string }>();
  const { sprints, updateSprint } = useSprints();
  const { tasks, addTask, addTasks, updateTask, deleteTask } = useTasks(sprintId);
  const [formState, setFormState] = useState<FormState>({ mode: 'idle' });
  const [view, setView] = useState<TaskView>('list');
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const sprint = sprints.find((s) => s.id === sprintId);

  if (!sprint) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">
              Sprint 不存在
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              找不到這個 Sprint，可能已經被刪除。
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              回列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = sprintProgress(sprint.startDate, sprint.endDate);
  const meta = statusMeta[progress.status];

  const dayLabel =
    progress.status === 'upcoming'
      ? `共 ${progress.total} 天，尚未開始`
      : progress.status === 'done'
        ? `共 ${progress.total} 天，已結束`
        : `第 ${progress.dayIndex} / ${progress.total} 天`;

  const handleSubmit = (input: TaskInput) => {
    if (formState.mode === 'edit') {
      updateTask(formState.task.id, input);
    } else {
      addTask(input);
    }
    setFormState({ mode: 'idle' });
  };

  const handleDelete = (task: Task) => {
    const ok = window.confirm(`確定刪除任務「${task.title}」？`);
    if (ok) deleteTask(task.id);
  };

  const handleSaveMilestones = (patch: MilestonePatch) => {
    updateSprint(sprint.id, {
      code: sprint.code,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      finalTestDate: patch.finalTestDate,
      regressionStartDate: patch.regressionStartDate,
      regressionEndDate: patch.regressionEndDate,
      releaseDate: patch.releaseDate,
    });
    setMilestoneOpen(false);
  };

  // For timeline: full-width page
  const containerClass =
    view === 'timeline' ? 'mx-auto max-w-[1400px]' : 'mx-auto max-w-5xl';

  return (
    <div className="min-h-full bg-slate-50">
      <div className={`${containerClass} px-6 py-10`}>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          ← 回列表
        </Link>

        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-slate-500">
                {meta.label}
              </div>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Sprint {sprint.code}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
              </p>
              {sprint.finalTestDate ? (
                <p className="mt-1 text-sm font-medium text-slate-700">
                  共有 {devWorkdaysOf(sprint)} 天開發工作天
                </p>
              ) : (
                <p className="mt-1 text-sm italic text-slate-500">
                  共有 0 天開發工作天（尚未設 QA 最後進測日）
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <MilestoneSlot
              tone="orange"
              label="QA 最後進測日"
              date={sprint.finalTestDate}
              onClick={() => setMilestoneOpen(true)}
            />
            <MilestoneSlot
              tone="purple"
              label="回歸測試"
              dateRange={
                sprint.regressionStartDate
                  ? [
                      sprint.regressionStartDate,
                      sprint.regressionEndDate ??
                        addDays(sprint.regressionStartDate, 1),
                    ]
                  : undefined
              }
              onClick={() => setMilestoneOpen(true)}
            />
            <MilestoneSlot
              tone="amber"
              label="全站更新"
              date={sprint.releaseDate}
              onClick={() => setMilestoneOpen(true)}
            />
          </div>

          <div className="mt-4">
            <ProgressBar
              percent={progress.percent}
              tone={meta.tone}
              label={`${dayLabel} · ${progress.percent}%`}
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">任務</h2>
              <p className="mt-1 text-sm text-slate-600">
                共 {tasks.length} 項
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ViewToggle value={view} onChange={setView} />
              {formState.mode === 'idle' && (
                <>
                  <button
                    type="button"
                    onClick={() => setImportOpen(true)}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    匯入
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormState({ mode: 'create' })}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    + 新增任務
                  </button>
                </>
              )}
            </div>
          </div>

          {formState.mode !== 'idle' && (
            <div className="mt-4">
              <TaskForm
                key={formState.mode === 'edit' ? formState.task.id : 'new'}
                sprintId={sprint.id}
                sprintStartDate={sprint.startDate}
                sprintEndDate={sprint.endDate}
                initial={formState.mode === 'edit' ? formState.task : undefined}
                onSubmit={handleSubmit}
                onCancel={() => setFormState({ mode: 'idle' })}
              />
            </div>
          )}

          <div className="mt-6">
            {view === 'list' ? (
              <TaskList
                tasks={tasks}
                onEdit={(task) => setFormState({ mode: 'edit', task })}
                onDelete={handleDelete}
              />
            ) : (
              <TaskTimeline
                sprint={sprint}
                tasks={tasks}
                onEdit={(task) => setFormState({ mode: 'edit', task })}
              />
            )}
          </div>
        </section>
      </div>

      {milestoneOpen && (
        <MilestoneEditModal
          sprint={sprint}
          onSave={handleSaveMilestones}
          onClose={() => setMilestoneOpen(false)}
        />
      )}

      {importOpen && (
        <ImportTasksModal
          sprint={sprint}
          onImport={(inputs) => addTasks(inputs)}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}

/** 單一里程碑 slot：已設定顯示彩色 chip；未設定顯示虛線「+ 設定」。兩者都 click 開同一個 Modal。 */
type MilestoneTone = 'orange' | 'purple' | 'amber';

const slotStyles: Record<
  MilestoneTone,
  { bg: string; text: string; ring: string; dot: string }
> = {
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    ring: 'ring-orange-200',
    dot: 'bg-orange-500',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    ring: 'ring-purple-200',
    dot: 'bg-purple-500',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
    dot: 'bg-amber-500',
  },
};

function MilestoneSlot({
  tone,
  label,
  date,
  dateRange,
  onClick,
}: {
  tone: MilestoneTone;
  label: string;
  date?: string;
  dateRange?: [string, string];
  onClick: () => void;
}) {
  const s = slotStyles[tone];
  const isSet = Boolean(date || dateRange);

  if (!isSet) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
      >
        <span className={`h-2 w-2 rounded-full ${s.dot} opacity-40`} />
        <span>+ 設定{label}</span>
      </button>
    );
  }

  const text = date
    ? formatShortDate(date)
    : dateRange
      ? `${formatShortDate(dateRange[0])} – ${formatShortDate(dateRange[1])}`
      : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full ${s.bg} px-3 py-1 text-xs ring-1 ring-inset ${s.ring} transition hover:opacity-80`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      <span className={`font-medium ${s.text}`}>{label}</span>
      <span className="text-slate-600">{text}</span>
    </button>
  );
}
