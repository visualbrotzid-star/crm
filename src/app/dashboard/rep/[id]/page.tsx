'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DailyLog, KpiTarget, KpiMetric, Lead, LeadActivity, LEAD_STATUS_COLORS } from '@/types'
import { useI18n, useLabels } from '@/lib/i18n/I18nProvider'
import { sumLogs, filterLogsByPeriod, calcCompletionPct, getStatusColor, getStatusBg, getStatusLabel } from '@/lib/kpi'
import { businessNow, businessToday } from '@/lib/date'
import { useLiveRefresh } from '@/lib/useLiveRefresh'
import KpiCard from '@/components/ui/KpiCard'
import { format, parseISO, startOfWeek, startOfMonth, startOfQuarter } from 'date-fns'
import Link from 'next/link'
import clsx from 'clsx'

const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']

function getPeriodStart(period: string): string {
  const now = businessNow()
  switch (period) {
    case 'daily': return businessToday()
    case 'weekly': return format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    case 'monthly': return format(startOfMonth(now), 'yyyy-MM-dd')
    case 'quarterly': return format(startOfQuarter(now), 'yyyy-MM-dd')
    default: return businessToday()
  }
}

export default function RepDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [rep, setRep] = useState<any>(null)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [targets, setTargets] = useState<KpiTarget[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [periodLeads, setPeriodLeads] = useState<Lead[]>([])
  const [loadingPeriod, setLoadingPeriod] = useState(false)

  const supabase = createClient()
  const { t } = useI18n()
  const L = useLabels()

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    const { data: repData } = await supabase.from('profiles').select('*').eq('id', id).single()
    const { data: logsData } = await supabase.from('rep_daily_kpis').select('*').eq('rep_id', id).order('log_date', { ascending: false }).limit(60)
    const { data: tData } = await supabase.from('kpi_targets').select('*')
    const { data: leadsData } = await supabase.from('leads').select('*').eq('rep_id', id).order('updated_at', { ascending: false })
    const { data: actData } = await supabase.from('lead_activities').select('*').eq('rep_id', id).order('created_at', { ascending: false }).limit(50)
    setRep(repData)
    setLogs(logsData || [])
    setTargets(tData || [])
    setLeads(leadsData || [])
    setActivities(actData || [])
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
  }, [id])

  // Live: refresh this rep's KPIs the instant they log activity
  useLiveRefresh(load, `rep-detail-${id}`)

  async function openPeriodDetail(period: string) {
    setSelectedPeriod(period)
    setLoadingPeriod(true)
    const startDate = getPeriodStart(period)
    const today = businessToday()

    const { data: actData } = await supabase
      .from('lead_activities')
      .select('lead_id')
      .eq('rep_id', id)
      .gte('activity_date', startDate)
      .lte('activity_date', today)

    const uniqueLeadIds = Array.from(new Set((actData || []).map((a: any) => a.lead_id)))
    const matchedLeads = leads.filter(l => uniqueLeadIds.includes(l.id))
    setPeriodLeads(matchedLeads)
    setLoadingPeriod(false)
  }

  if (loading) return <div className="p-4 md:p-8 text-gray-400 text-sm">Loading...</div>
  if (!rep) return <div className="p-4 md:p-8 text-gray-400 text-sm">{t('leads.repNotFound')}</div>

  const getTarget = (period: string) => targets.find((t: KpiTarget) => t.period === period) as KpiTarget | null
  const periods = ['daily', 'weekly', 'monthly', 'quarterly'] as const
  const periodsWithClientDrilldown = ['daily', 'weekly', 'monthly']
  const initials = rep.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const weeklyLogs = filterLogsByPeriod(logs, 'weekly')
  const weeklyPct = calcCompletionPct(sumLogs(weeklyLogs), getTarget('weekly'))
  const leadName = (leadId: string) => leads.find(l => l.id === leadId)?.business_name || 'a lead'

  const selectedPeriodLabel = selectedPeriod ? L.period(selectedPeriod) : ''

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Link href="/dashboard/team" className="text-sm text-brand-600 dark:text-brand-400 hover:underline mb-4 inline-block">&larr; Back to team</Link>

      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-lg md:text-xl font-bold flex-shrink-0">{initials}</div>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{rep.full_name}</h1>
          <p className="text-gray-400 text-sm truncate">{rep.email}</p>
        </div>
        <div className="ml-auto text-right flex-shrink-0 flex items-center gap-3">
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Refresh">
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <div>
            <p className={clsx('text-2xl md:text-3xl font-bold', getStatusColor(weeklyPct))}>{weeklyPct}%</p>
            <p className={clsx('text-xs md:text-sm font-medium', getStatusColor(weeklyPct))}>{getStatusLabel(weeklyPct)}</p>
          </div>
        </div>
      </div>

      {periods.map(period => {
        const periodLogs = filterLogsByPeriod(logs, period)
        const totals = sumLogs(periodLogs)
        const target = getTarget(period)
        const pct = calcCompletionPct(totals, target)
        return (
          <div key={period} className="card p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{L.period(period)}</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 md:w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full', getStatusBg(pct))} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={clsx('text-sm font-semibold', getStatusColor(pct))}>{pct}%</span>
                </div>
                {periodsWithClientDrilldown.includes(period) && (
                  <button
                    onClick={() => openPeriodDetail(period)}
                    className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    Lihat Client
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {METRICS.map(m => <KpiCard key={m} metric={m} actual={totals[m]} target={target?.[m] || 0} />)}
            </div>
          </div>
        )
      })}

      {/* Lead pipeline summary */}
      <div className="card p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Leads ({leads.length})</h2>
        {!leads.length ? (
          <p className="text-sm text-gray-400 py-4 text-center">{t('leads.noLeads')}</p>
        ) : (
          <div className="space-y-2">
            {leads.slice(0, 10).map(lead => (
              <div key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{lead.business_name}</p>
                  {lead.location && <p className="text-xs text-gray-400 truncate">{lead.location}</p>}
                </div>
                <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0', LEAD_STATUS_COLORS[lead.status])}>{L.status(lead.status)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity history */}
      <div className="card p-4 md:p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('leads.recentActivity')}</h2>
        {!activities.length ? (
          <p className="text-sm text-gray-400 py-4 text-center">{t('leads.noActivityRecorded')}</p>
        ) : (
          <div className="space-y-3">
            {activities.map(a => (
              <div key={a.id} className="flex gap-3 pb-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-emerald-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{L.kpi(a.activity_type)}</span>
                    {' · '}{leadName(a.lead_id)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(parseISO(a.created_at), 'MMM d, h:mm a')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Period clients modal */}
      {selectedPeriod && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPeriod(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Client {selectedPeriodLabel}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{rep.full_name}</p>
              </div>
              <button onClick={() => setSelectedPeriod(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">
              {loadingPeriod ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-gray-400">Loading...</p>
                </div>
              ) : !periodLeads.length ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada client</p>
                  <p className="text-sm text-gray-400 mt-1">Tidak ada aktivitas tercatat untuk periode ini</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400 mb-2">{periodLeads.length} client dicontact</p>
                  {periodLeads.map(lead => (
                    <div key={lead.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
                      {/* Name + status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{lead.business_name}</h3>
                        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0', LEAD_STATUS_COLORS[lead.status])}>
                          {L.status(lead.status)}
                        </span>
                      </div>

                      {/* Details grid */}
                      <div className="space-y-1.5">
                        {lead.location && (
                          <div className="flex items-start gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{lead.location}</p>
                          </div>
                        )}
                        {lead.contact_number && (
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.9 1.26h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l1.1-1.1a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>
                            <a href={`tel:${lead.contact_number}`} className="text-sm text-brand-600 dark:text-brand-400 hover:underline">{lead.contact_number}</a>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            <a href={`mailto:${lead.email}`} className="text-sm text-brand-600 dark:text-brand-400 hover:underline truncate">{lead.email}</a>
                          </div>
                        )}
                        {lead.instagram_id && (
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{lead.instagram_id}</p>
                          </div>
                        )}
                        {lead.website && (
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 dark:text-brand-400 hover:underline truncate">{lead.website}</a>
                          </div>
                        )}
                        {lead.remarks && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-400 leading-relaxed">{lead.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              <button onClick={() => setSelectedPeriod(null)} className="btn-secondary w-full">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
