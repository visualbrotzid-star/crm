import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DailyLog, KpiTarget, KpiMetric } from '@/types'
import { sumLogs, filterLogsByPeriod, calcCompletionPct, getStatusColor, getStatusBg, getStatusLabel } from '@/lib/kpi'
import KpiCard from '@/components/ui/KpiCard'
import { format } from 'date-fns'
import clsx from 'clsx'

const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']

export default async function RepDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: logs } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('rep_id', user.id)
    .order('log_date', { ascending: false })
    .limit(90)

  const { data: targets } = await supabase.from('kpi_targets').select('*')
  const getTarget = (p: string) => (targets || []).find((t: KpiTarget) => t.period === p) as KpiTarget | null

  const periods = [
    { key: 'daily' as const, label: 'Today' },
    { key: 'weekly' as const, label: 'This Week' },
    { key: 'monthly' as const, label: 'This Month' },
    { key: 'quarterly' as const, label: 'This Quarter' },
  ]

  const today = format(new Date(), 'EEEE, MMMM d')
  const todayStr = new Date().toISOString().split('T')[0]
  const loggedToday = (logs || []).some((l: DailyLog) => l.log_date === todayStr)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-gray-400 mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
          <p className="text-gray-500 text-sm mt-1">Hi {profile.full_name.split(' ')[0]} 👋 — here&apos;s how you&apos;re tracking</p>
        </div>
        {!loggedToday && (
          <a href="/rep/log" className="btn-primary flex items-center gap-2">
            <span>✏️</span> Log Today
          </a>
        )}
        {loggedToday && (
          <span className="bg-emerald-50 text-emerald-700 text-sm font-medium px-3 py-2 rounded-xl">✓ Logged today</span>
        )}
      </div>

      <div className="space-y-6">
        {periods.map(({ key, label }) => {
          const periodLogs = filterLogsByPeriod(logs || [], key)
          const totals = sumLogs(periodLogs)
          const target = getTarget(key)
          const pct = calcCompletionPct(totals, target)

          return (
            <div key={key} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">{label}</h2>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full transition-all', getStatusBg(pct))} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={clsx('text-sm font-bold', getStatusColor(pct))}>{pct}%</span>
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full',
                    pct >= 90 ? 'bg-emerald-50 text-emerald-700' :
                    pct >= 60 ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  )}>{getStatusLabel(pct)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {METRICS.map(m => (
                  <KpiCard key={m} metric={m} actual={totals[m]} target={target?.[m] || 0} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
