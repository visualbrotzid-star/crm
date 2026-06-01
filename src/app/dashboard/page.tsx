'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DailyLog, KpiTarget, Profile, KpiMetric } from '@/types'
import { sumLogs, calcCompletionPct } from '@/lib/kpi'
import RepRow from '@/components/ui/RepRow'
import { format } from 'date-fns'

export default function DashboardPage() {
  const [reps, setReps] = useState<Profile[]>([])
  const [summaries, setSummaries] = useState<any[]>([])
  const [teamMetrics, setTeamMetrics] = useState<Record<KpiMetric, number>>({
    businesses_contacted: 0, follow_ups: 0, meetings_booked: 0, demos_done: 0, proposals_sent: 0, deals_closed: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: repsData } = await supabase.from('profiles').select('*').eq('role', 'rep').order('full_name')
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
      const { data: logs } = await supabase.from('rep_daily_kpis').select('*').gte('log_date', weekStart.toISOString().split('T')[0])
      const { data: targets } = await supabase.from('kpi_targets').select('*').eq('period', 'weekly').single()
      const sums = (repsData || []).map(rep => {
        const repLogs = (logs || []).filter((l: DailyLog) => l.rep_id === rep.id)
        const totals = sumLogs(repLogs)
        const completion_pct = calcCompletionPct(totals, targets as KpiTarget | null)
        return { rep, logs: repLogs, totals, targets, completion_pct }
      })
      setReps(repsData || [])
      setSummaries(sums)
      setTeamMetrics({
        businesses_contacted: sums.reduce((s, r) => s + r.totals.businesses_contacted, 0),
        follow_ups: sums.reduce((s, r) => s + r.totals.follow_ups, 0),
        meetings_booked: sums.reduce((s, r) => s + r.totals.meetings_booked, 0),
        demos_done: sums.reduce((s, r) => s + r.totals.demos_done, 0),
        proposals_sent: sums.reduce((s, r) => s + r.totals.proposals_sent, 0),
        deals_closed: sums.reduce((s, r) => s + r.totals.deals_closed, 0),
      })
      setLoading(false)
    }
    load()
  }, [])

  const onTrack = summaries.filter(s => s.completion_pct >= 90).length
  const behind = summaries.filter(s => s.completion_pct < 60).length
  const today = format(new Date(), 'EEEE, MMMM d yyyy')

  if (loading) return <div className="p-4 md:p-8 text-gray-400 text-sm">Loading dashboard...</div>

  const summaryCards = [
    { label: 'Total Reps', value: reps.length, accent: 'text-gray-900 dark:text-gray-100' },
    { label: 'On Track', value: onTrack, accent: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Behind', value: behind, accent: 'text-red-500 dark:text-red-400' },
    { label: 'Deals (week)', value: teamMetrics.deals_closed, accent: 'text-brand-600 dark:text-brand-400' },
  ]

  const teamTotals = [
    { label: 'Contacted', value: teamMetrics.businesses_contacted },
    { label: 'Follow-ups', value: teamMetrics.follow_ups },
    { label: 'Meetings', value: teamMetrics.meetings_booked },
    { label: 'Demos', value: teamMetrics.demos_done },
    { label: 'Proposals', value: teamMetrics.proposals_sent },
    { label: 'Deals', value: teamMetrics.deals_closed },
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <p className="text-xs md:text-sm text-gray-400 mb-1">{today}</p>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Team Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Weekly KPI progress across your sales team</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {summaryCards.map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-gray-400 mb-1">{c.label}</p>
            <p className={`text-2xl md:text-3xl font-bold ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 md:p-6 mb-6 md:mb-8">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Team Totals This Week</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 text-center">
          {teamTotals.map(item => (
            <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
              <p className="text-xs text-gray-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Individual Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {summaries.map(s => <RepRow key={s.rep.id} summary={s} />)}
        {!summaries.length && (
          <div className="col-span-full card p-12 text-center">
            <p className="font-medium text-gray-700 dark:text-gray-300">No reps yet</p>
            <p className="text-sm text-gray-400 mt-1">Add reps from the Team page to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
