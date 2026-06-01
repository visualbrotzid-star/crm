'use client'
import clsx from 'clsx'

const PERIODS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'quarterly', label: 'This Quarter' },
] as const

type Period = typeof PERIODS[number]['value']

interface Props {
  value: Period
  onChange: (p: Period) => void
}

export default function PeriodTabs({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            value === p.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
