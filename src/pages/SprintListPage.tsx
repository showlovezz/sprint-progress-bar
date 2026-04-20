import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSprints } from '../hooks/useSprints';
import { useTasks } from '../hooks/useTasks';
import { SprintForm } from '../components/SprintForm';
import { SprintList } from '../components/SprintList';
import type { Sprint, SprintInput } from '../types';

type FormState =
  | { mode: 'idle' }
  | { mode: 'create' }
  | { mode: 'edit'; sprint: Sprint };

export function SprintListPage() {
  const { sprints, addSprint, updateSprint, deleteSprint } = useSprints();
  const { deleteTasksBySprint } = useTasks();
  const [formState, setFormState] = useState<FormState>({ mode: 'idle' });
  const formRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (formState.mode !== 'idle') {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [formState]);

  const handleSubmit = (input: SprintInput) => {
    if (formState.mode === 'edit') {
      updateSprint(formState.sprint.id, input);
    } else {
      addSprint(input);
    }
    setFormState({ mode: 'idle' });
  };

  const handleDelete = (sprint: Sprint) => {
    const ok = window.confirm(
      `確定刪除 Sprint ${sprint.code}？這會一併刪掉底下所有任務，此動作無法復原。`
    );
    if (ok) {
      deleteTasksBySprint(sprint.id);
      deleteSprint(sprint.id);
    }
  };

  const handleOpenDetail = (sprint: Sprint) => {
    navigate(`/sprint/${sprint.id}`);
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Sprint Progressbar
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              管理 sprint 編號與起迄日期，即時看到目前進度。
            </p>
          </div>
          {formState.mode === 'idle' && (
            <button
              type="button"
              onClick={() => setFormState({ mode: 'create' })}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              + 新增 Sprint
            </button>
          )}
        </header>

        {formState.mode !== 'idle' && (
          <div ref={formRef} className="mt-6 scroll-mt-6">
            <SprintForm
              key={formState.mode === 'edit' ? formState.sprint.id : 'new'}
              initial={formState.mode === 'edit' ? formState.sprint : undefined}
              existingCodes={sprints.map((s) => s.code)}
              onSubmit={handleSubmit}
              onCancel={() => setFormState({ mode: 'idle' })}
            />
          </div>
        )}

        <div className="mt-8">
          <SprintList
            sprints={sprints}
            editingSprintId={
              formState.mode === 'edit' ? formState.sprint.id : null
            }
            onOpenDetail={handleOpenDetail}
            onEdit={(sprint) => setFormState({ mode: 'edit', sprint })}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
