'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DailyLog, KpiTarget, KpiMetric } from '@/types'
import { sumLogs, filterLogsByPeriod, calcCompletionPct, getStatusColor, getStatusBg, getStatusLabel } from '@/lib/kpi'
import KpiCard from '@/components/ui/KpiCard'
import { format } from 'date-fns'
import clsx from 'clsx'

const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']

export default function RepDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [targets, setTargets] = useState<KpiTarget[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      const { data: logsData } = await supabase.from('rep_daily_kpis').select('*').eq('rep_id', session.user.id).order('log_date', { ascending: false }).limit(90)
      const { data: t } = await supabase.from('kpi_targets').select('*')
      setProfile(prof)
      setLogs(logsData || [])
      setTargets(t || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>

  const getTarget = (p: string) => targets.find((t: KpiTarget) => t.period === p) as KpiTarget | null
  const periods = [
    { key: 'daily' as const, label: 'Today' },
    { key: 'weekly' as const, label: 'This Week' },
    { key: 'monthly' as const, label: 'This Month' },
    { key: 'quarterly' as const, label: 'This Quarter' },
  ]
  const today = format(new Date(), 'EEEE, MMMM d')
  const todayStr = new Date().toISOString().split('T')[0]
  const loggedToday = logs.some((l: DailyLog) => l.log_date === todayStr)

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-gray-400 mb-1">{today}</p>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">My Performance</h1>
          <p className="text-gray-500 text-sm mt-1">Hi {profile?.full_name?.split(' ')[0]} - here is how you are tracking</p>
        </div>
        {!loggedToday ? (
          <a href="/rep/leads" className="btn-primary">Add a Lead</a>
        ) : (
          <span className="bg-emerald-50 text-emerald-700 text-sm font-medium px-3 py-2 rounded-xl">Active</span>
        )}
      </div>
      <div className="space-y-6">
        {periods.map(({ key, label }) => {
          const periodLogs = filterLogsByPeriod(logs, key)
          const totals = sumLogs(periodLogs)
          const target = getTarget(key)
          const pct = calcCompletionPct(totals, target)
          return (
            <div key={key} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">{label}</h2>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full transition-all', getStatusBg(pct))} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={clsx('text-sm font-bold', getStatusColor(pct))}>{pct}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {METRICS.map(m => <KpiCard key={m} metric={m} actual={totals[m]} target={target?.[m] || 0} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
