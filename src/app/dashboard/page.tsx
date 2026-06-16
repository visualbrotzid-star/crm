'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DailyLog, KpiTarget, Profile, KpiMetric } from '@/types'
import { sumLogs, calcCompletionPct } from '@/lib/kpi'
import { useI18n } from '@/lib/i18n/I18nProvider'
import RepRow from '@/components/ui/RepRow'
import GreetingBanner from '@/components/ui/GreetingBanner'
import { format } from 'date-fns'

export default function DashboardPage() {
  const [reps, setReps] = useState<Profile[]>([])
  const [summaries, setSummaries] = useState<any[]>([])
  const [teamMetrics, setTeamMetrics] = useState<Record<KpiMetric, number>>({
    businesses_contacted: 0, follow_ups: 0, meetings_booked: 0, demos_done: 0, proposals_sent: 0, deals_closed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()
  const { t, lang } = useI18n()

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: me } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(me)
    }
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

  async function handleRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    const onFocus = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const onTrack = summaries.filter(s => s.completion_pct >= 90).length
  const behind = summaries.filter(s => s.completion_pct < 60).length
  const today = format(new Date(), 'EEEE, MMMM d yyyy')

  if (loading) return <div className="p-4 md:p-8 text-gray-400 text-sm">{t('common.loading')}</div>

  const summaryCards = [
    { label: t('dash.totalReps'), value: reps.length, accent: 'text-gray-900 dark:text-gray-100' },
    { label: t('dash.onTrack'), value: onTrack, accent: 'text-emerald-600 dark:text-emerald-400' },
    { label: t('dash.behind'), value: behind, accent: 'text-red-500 dark:text-red-400' },
    { label: t('dash.dealsWeek'), value: teamMetrics.deals_closed, accent: 'text-brand-600 dark:text-brand-400' },
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
      {profile && <GreetingBanner name={profile.full_name?.split(' ')[0] || profile.full_name} lang={lang} />}
      <div className="flex items-start justify-between mb-6 md:mb-8">
        <div>
          <p className="text-xs md:text-sm text-gray-400 mb-1">{today}</p>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dash.teamOverview')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('dash.weeklyProgress')}</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors mt-1" title="Refresh">
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
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
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('dash.teamTotals')}</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 text-center">
          {teamTotals.map(item => (
            <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
              <p className="text-xs text-gray-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('dash.individualPerf')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {summaries.map(s => <RepRow key={s.rep.id} summary={s} />)}
        {!summaries.length && (
          <div className="col-span-full card p-12 text-center">
            <p className="font-medium text-gray-700 dark:text-gray-300">{t('dash.noReps')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('dash.noRepsHint')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
