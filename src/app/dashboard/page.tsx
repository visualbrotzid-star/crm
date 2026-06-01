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

  if (loading) {
    return <div className="p-8 text-gray-400 text-sm">Loading dashboard...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-sm text-gray-400 mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900">Team Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Weekly KPI progress across your sales team</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4"><p className="text-xs text-gray-400 mb-1">Total Reps</p><p className="text-2xl font-bold text-gray-900">{reps.length}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-400 mb-1">On Track</p><p className="text-2xl font-bold text-emerald-600">{onTrack}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-400 mb-1">Behind</p><p className="text-2xl font-bold text-red-500">{behind}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-400 mb-1">Deals Closed (week)</p><p className="text-2xl font-bold text-brand-600">{teamMetrics.deals_closed}</p></div>
      </div>

      <div className="card p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Team Totals This Week</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {[
            { label: 'Contacted', value: teamMetrics.businesses_contacted },
            { label: 'Follow-ups', value: teamMetrics.follow_ups },
            { label: 'Meetings', value: teamMetrics.meetings_booked },
            { label: 'Demos', value: teamMetrics.demos_done },
            { label: 'Proposals', value: teamMetrics.proposals_sent },
            { label: 'Deals', value: teamMetrics.deals_closed },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <h2 className="font-semibold text-gray-900 mb-4">Individual Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {summaries.map(s => <RepRow key={s.rep.id} summary={s} />)}
        {!summaries.length && (
          <div className="col-span-3 card p-12 text-center">
            <p className="font-medium text-gray-700">No reps yet</p>
            <p className="text-sm text-gray-400 mt-1">Add reps to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
