import { formatShortDate } from '../utils/date';

type Tone = 'orange' | 'purple' | 'amber';

const toneStyles: Record<Tone, { bg: string; dot: string; text: string }> = {
  orange: {
    bg: 'bg-orange-50 ring-orange-200',
    dot: 'bg-orange-500',
    text: 'text-orange-700',
  },
  purple: {
    bg: 'bg-purple-50 ring-purple-200',
    dot: 'bg-purple-500',
    text: 'text-purple-700',
  },
  amber: {
    bg: 'bg-amber-50 ring-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
  },
};

type Props = {
  tone: Tone;
  label: string;
  /** 單日 */
  date?: string;
  /** 日期區間（回歸測試用） */
  dateRange?: [string, string];
};

export function MilestoneChip({ tone, label, date, dateRange }: Props) {
  const s = toneStyles[tone];

  const dateText = date
    ? formatShortDate(date)
    : dateRange
      ? `${formatShortDate(dateRange[0])} – ${formatShortDate(dateRange[1])}`
      : '';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 ring-inset ${s.bg}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      <span className={`font-medium ${s.text}`}>{label}</span>
      <span className="text-slate-600">{dateText}</span>
    </div>
  );
}
