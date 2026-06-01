import { KpiMetric, KPI_LABELS, KPI_ICONS } from '@/types'
import { getStatusBg } from '@/lib/kpi'
import clsx from 'clsx'

interface Props {
  metric: KpiMetric
  actual: number
  target: number
}

export default function KpiCard({ metric, actual, target }: Props) {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{KPI_ICONS[metric]}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{KPI_LABELS[metric]}</span>
        </div>
        <span className="text-xs font-medium text-gray-400">{pct}%</span>
      </div>

      <div className="flex items-end gap-1 mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{actual}</span>
        <span className="text-sm text-gray-400 mb-0.5">/ {target}</span>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', getStatusBg(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
