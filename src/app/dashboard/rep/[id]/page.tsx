'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DailyLog, KpiTarget, KpiMetric } from '@/types'
import { sumLogs, filterLogsByPeriod, calcCompletionPct, getStatusColor, getStatusBg, getStatusLabel } from '@/lib/kpi'
import KpiCard from '@/components/ui/KpiCard'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'

const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']

export default function RepDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [rep, setRep] = useState<any>(null)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [targets, setTargets] = useState<KpiTarget[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: repData } = await supabase.from('profiles').select('*').eq('id', id).single()
      const { data: logsData } = await supabase.from('rep_daily_kpis').select('*').eq('rep_id', id).order('log_date', { ascending: false }).limit(60)
      const { data: t } = await supabase.from('kpi_targets').select('*')
      setRep(repData)
      setLogs(logsData || [])
      setTargets(t || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>
  if (!rep) return <div className="p-8 text-gray-400 text-sm">Rep not found</div>

  const getTarget = (period: string) => targets.find((t: KpiTarget) => t.period === period) as KpiTarget | null
  const periods = ['daily', 'weekly', 'monthly', 'quarterly'] as const
  const periodLabels: any = { daily: 'Today', weekly: 'This Week', monthly: 'This Month', quarterly: 'This Quarter' }
  const initials = rep.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const weeklyLogs = filterLogsByPeriod(logs, 'weekly')
  const weeklyPct = calcCompletionPct(sumLogs(weeklyLogs), getTarget('weekly'))

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold">{initials}</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{rep.full_name}</h1>
          <p className="text-gray-400 text-sm">{rep.email}</p>
        </div>
        <div className="ml-auto text-right">
          <p className={clsx('text-3xl font-bold', getStatusColor(weeklyPct))}>{weeklyPct}%</p>
          <p className={clsx('text-sm font-medium', getStatusColor(weeklyPct))}>{getStatusLabel(weeklyPct)}</p>
        </div>
      </div>
      {periods.map(period => {
        const periodLogs = filterLogsByPeriod(logs, period)
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
              {METRICS.map(m => <KpiCard key={m} metric={m} actual={totals[m]} target={target?.[m] || 0} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
