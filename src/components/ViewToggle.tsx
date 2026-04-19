export type TaskView = 'list' | 'timeline';

type Props = {
  value: TaskView;
  onChange: (v: TaskView) => void;
};

const options: { value: TaskView; label: string }[] = [
  { value: 'list', label: '清單' },
  { value: 'timeline', label: '時間軸' },
];

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-md bg-slate-200 p-0.5 text-sm">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded px-3 py-1 font-medium transition ${
              active
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
