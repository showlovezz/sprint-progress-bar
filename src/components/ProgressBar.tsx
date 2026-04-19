type Props = {
  percent: number;
  label?: string;
  tone?: 'blue' | 'green' | 'slate';
};

const toneClasses: Record<NonNullable<Props['tone']>, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  slate: 'bg-slate-400',
};

export function ProgressBar({ percent, label, tone = 'blue' }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="w-full">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${toneClasses[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {label && (
        <div className="mt-1 text-xs text-slate-500">{label}</div>
      )}
    </div>
  );
}
