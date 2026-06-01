import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DailyLog, KpiTarget, Profile, KpiMetric } from '@/types'
import { sumLogs, filterLogsByPeriod, calcCompletionPct } from '@/lib/kpi'
import RepRow from '@/components/ui/RepRow'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Reps get sent to their own dashboard
  if (profile.role === 'rep') redirect('/rep')

  // Fetch all reps
  const { data: reps } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'rep')
    .order('full_name')

  // Fetch all logs for this week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  const { data: logs } = await supabase
    .from('daily_logs')
    .select('*')
    .gte('log_date', weekStart.toISOString().split('T')[0])

  // Fetch daily targets
  const { data: targets } = await supabase
    .from('kpi_targets')
    .select('*')
    .eq('period', 'weekly')
    .single()

  const today = format(new Date(), 'EEEE, MMMM d yyyy')

  // Build rep summaries
  const summaries = (reps || []).map(rep => {
    const repLogs = (logs || []).filter((l: DailyLog) => l.rep_id === rep.id)
    const totals = sumLogs(repLogs)
    const completion_pct = calcCompletionPct(totals, targets as KpiTarget | null)
    return { rep: rep as Profile, logs: repLogs, totals, targets: targets as KpiTarget | null, completion_pct }
  })

  const teamMetrics: Record<KpiMetric, number> = {
    businesses_contacted: summaries.reduce((s, r) => s + r.totals.businesses_contacted, 0),
    follow_ups: summaries.reduce((s, r) => s + r.totals.follow_ups, 0),
    meetings_booked: summaries.reduce((s, r) => s + r.totals.meetings_booked, 0),
    demos_done: summaries.reduce((s, r) => s + r.totals.demos_done, 0),
    proposals_sent: summaries.reduce((s, r) => s + r.totals.proposals_sent, 0),
    deals_closed: summaries.reduce((s, r) => s + r.totals.deals_closed, 0),
  }

  const onTrack = summaries.filter(s => s.completion_pct >= 90).length
  const behind = summaries.filter(s => s.completion_pct < 60).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900">Team Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Weekly KPI progress across your sales team</p>
      </div>

      {/* Team summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">Total Reps</p>
          <p className="text-2xl font-bold text-gray-900">{reps?.length || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">On Track</p>
          <p className="text-2xl font-bold text-emerald-600">{onTrack}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">Behind</p>
          <p className="text-2xl font-bold text-red-500">{behind}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-400 mb-1">Deals Closed (week)</p>
          <p className="text-2xl font-bold text-brand-600">{teamMetrics.deals_closed}</p>
        </div>
      </div>

      {/* Team KPI totals */}
      <div className="card p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Team Totals This Week</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {[
            { label: 'Contacted', value: teamMetrics.businesses_contacted, icon: '🏢' },
            { label: 'Follow-ups', value: teamMetrics.follow_ups, icon: '🔁' },
            { label: 'Meetings', value: teamMetrics.meetings_booked, icon: '📅' },
            { label: 'Demos', value: teamMetrics.demos_done, icon: '💻' },
            { label: 'Proposals', value: teamMetrics.proposals_sent, icon: '📄' },
            { label: 'Deals', value: teamMetrics.deals_closed, icon: '🤝' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xl mb-1">{item.icon}</p>
              <p className="text-xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rep cards */}
      <h2 className="font-semibold text-gray-900 mb-4">Individual Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {summaries.map(s => (
          <RepRow key={s.rep.id} summary={s} />
        ))}
        {(!summaries.length) && (
          <div className="col-span-3 card p-12 text-center">
            <p className="text-3xl mb-2">👥</p>
            <p className="font-medium text-gray-700">No reps yet</p>
            <p className="text-sm text-gray-400 mt-1">Add reps via Supabase dashboard to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
