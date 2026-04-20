import type { Sprint } from '../types';
import { SprintCard } from './SprintCard';

type Props = {
  sprints: Sprint[];
  editingSprintId?: string | null;
  onOpenDetail: (sprint: Sprint) => void;
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprint: Sprint) => void;
};

export function SprintList({
  sprints,
  editingSprintId,
  onOpenDetail,
  onEdit,
  onDelete,
}: Props) {
  if (sprints.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
        <p className="text-slate-500">
          還沒有 Sprint，點右上角「新增 Sprint」開始。
        </p>
      </div>
    );
  }

  const sorted = [...sprints].sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sorted.map((sprint) => (
        <SprintCard
          key={sprint.id}
          sprint={sprint}
          isEditing={sprint.id === editingSprintId}
          onOpenDetail={onOpenDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
