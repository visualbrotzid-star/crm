import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { DailyLog, KpiTarget, KpiMetric, KPI_LABELS, KPI_ICONS } from '@/types'
import { sumLogs, filterLogsByPeriod, calcCompletionPct, getStatusColor, getStatusBg, getStatusLabel } from '@/lib/kpi'
import KpiCard from '@/components/ui/KpiCard'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'

export default async function RepDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'manager') redirect('/dashboard')

  const { data: rep } = await supabase.from('profiles').select('*').eq('id', params.id).single()
  if (!rep) notFound()

  const { data: logs } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('rep_id', params.id)
    .order('log_date', { ascending: false })
    .limit(60)

  const { data: targets } = await supabase.from('kpi_targets').select('*')

  const getTarget = (period: string) => (targets || []).find((t: KpiTarget) => t.period === period) as KpiTarget | null

  const periods = ['daily', 'weekly', 'monthly', 'quarterly'] as const
  const periodLabels = { daily: 'Today', weekly: 'This Week', monthly: 'This Month', quarterly: 'This Quarter' }

  const metrics: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']
  const initials = rep.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const weeklyLogs = filterLogsByPeriod(logs || [], 'weekly')
  const weeklyTotals = sumLogs(weeklyLogs)
  const weeklyPct = calcCompletionPct(weeklyTotals, getTarget('weekly'))

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{rep.full_name}</h1>
          <p className="text-gray-400 text-sm">{rep.email}</p>
        </div>
        <div className="ml-auto text-right">
          <p className={clsx('text-3xl font-bold', getStatusColor(weeklyPct))}>{weeklyPct}%</p>
          <p className={clsx('text-sm font-medium', getStatusColor(weeklyPct))}>{getStatusLabel(weeklyPct)}</p>
        </div>
      </div>

      {/* Period breakdowns */}
      {periods.map(period => {
        const periodLogs = filterLogsByPeriod(logs || [], period)
        const totals = sumLogs(periodLogs)
        const target = getTarget(period)
        const pct = calcCompletionPct(totals, target)

        return (
          <div key={period} className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{periodLabels[period]}</h2>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                  <div className={clsx('h-full rounded-full', getStatusBg(pct))} style={{ width: `${pct}%` }} />
                </div>
                <span className={clsx('text-sm font-semibold', getStatusColor(pct))}>{pct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {metrics.map(m => (
                <KpiCard key={m} metric={m} actual={totals[m]} target={target?.[m] || 0} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Recent logs */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Activity Log</h2>
        {(!logs || !logs.length) ? (
          <p className="text-gray-400 text-sm text-center py-8">No logs yet</p>
        ) : (
          <div className="space-y-2">
            {(logs || []).slice(0, 14).map((log: DailyLog) => (
              <div key={log.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-20 flex-shrink-0">
                  <p className="text-xs font-medium text-gray-500">{format(parseISO(log.log_date), 'MMM d')}</p>
                </div>
                <div className="flex gap-4 flex-wrap flex-1">
                  {metrics.map(m => (
                    <div key={m} className="text-center min-w-[48px]">
                      <p className="text-sm font-semibold text-gray-900">{log[m]}</p>
                      <p className="text-xs text-gray-400">{KPI_ICONS[m]}</p>
                    </div>
                  ))}
                </div>
                {log.notes && <p className="text-xs text-gray-400 italic max-w-[200px] truncate">{log.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
