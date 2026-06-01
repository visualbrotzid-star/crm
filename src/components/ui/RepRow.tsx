'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { RepSummary } from '@/types'
import { getStatusColor, getStatusBg, getStatusLabel } from '@/lib/kpi'
import clsx from 'clsx'

export default function RepRow({ summary }: { summary: RepSummary }) {
  const { t } = useI18n()
  const { rep, totals, targets, completion_pct } = summary
  const initials = rep.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Link href={`/dashboard/rep/${rep.id}`} className="block">
      <div className="card p-4 hover:border-brand-200 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{rep.full_name}</p>
              <p className="text-xs text-gray-400">{rep.email}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={clsx('text-lg font-bold', getStatusColor(completion_pct))}>{completion_pct}%</p>
            <p className={clsx('text-xs font-medium', getStatusColor(completion_pct))}>{getStatusLabel(completion_pct)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
          <div
            className={clsx('h-full rounded-full transition-all', getStatusBg(completion_pct))}
            style={{ width: `${completion_pct}%` }}
          />
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{totals.businesses_contacted}</p>
            <p className="text-xs text-gray-400">{t('reports.contacted')}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{totals.meetings_booked}</p>
            <p className="text-xs text-gray-400">{t('reports.meetings')}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{totals.deals_closed}</p>
            <p className="text-xs text-gray-400">{t('reports.deals')}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
