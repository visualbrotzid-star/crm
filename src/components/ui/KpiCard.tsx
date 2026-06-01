'use client'

import { KpiMetric } from '@/types'
import { useLabels } from '@/lib/i18n/I18nProvider'
import { getStatusBg } from '@/lib/kpi'
import clsx from 'clsx'

interface Props {
  metric: KpiMetric
  actual: number
  target: number
}

export default function KpiCard({ metric, actual, target }: Props) {
  const L = useLabels()
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{L.kpi(metric)}</span>
        <span className="text-xs font-medium text-gray-400">{pct}%</span>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{actual}</span>
        <span className="text-sm text-gray-400">/ {target}</span>
      </div>

      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-500', getStatusBg(pct))} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
