'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DailyLog, KpiTarget, KpiMetric, Lead, LeadActivity, KPI_LABELS, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types'
import { useI18n, useLabels } from '@/lib/i18n/I18nProvider'
import { sumLogs, filterLogsByPeriod, calcCompletionPct, getStatusColor, getStatusBg, getStatusLabel } from '@/lib/kpi'
import KpiCard from '@/components/ui/KpiCard'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import clsx from 'clsx'

const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']

export default function RepDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [rep, setRep] = useState<any>(null)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [targets, setTargets] = useState<KpiTarget[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { t } = useI18n()
  const L = useLabels()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: repData } = await supabase.from('profiles').select('*').eq('id', id).single()
      const { data: logsData } = await supabase.from('rep_daily_kpis').select('*').eq('rep_id', id).order('log_date', { ascending: false }).limit(60)
      const { data: t } = await supabase.from('kpi_targets').select('*')
      const { data: leadsData } = await supabase.from('leads').select('*').eq('rep_id', id).order('updated_at', { ascending: false })
      const { data: actData } = await supabase.from('lead_activities').select('*').eq('rep_id', id).order('created_at', { ascending: false }).limit(50)
      setRep(repData)
      setLogs(logsData || [])
      setTargets(t || [])
      setLeads(leadsData || [])
      setActivities(actData || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="p-4 md:p-8 text-gray-400 text-sm">Loading...</div>
  if (!rep) return <div className="p-4 md:p-8 text-gray-400 text-sm">{t('leads.repNotFound')}</div>

  const getTarget = (period: string) => targets.find((t: KpiTarget) => t.period === period) as KpiTarget | null
  const periods = ['daily', 'weekly', 'monthly', 'quarterly'] as const
    const initials = rep.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const weeklyLogs = filterLogsByPeriod(logs, 'weekly')
  const weeklyPct = calcCompletionPct(sumLogs(weeklyLogs), getTarget('weekly'))
  const leadName = (leadId: string) => leads.find(l => l.id === leadId)?.business_name || 'a lead'

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Link href="/dashboard/team" className="text-sm text-brand-600 dark:text-brand-400 hover:underline mb-4 inline-block">&larr; Back to team</Link>

      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-lg md:text-xl font-bold flex-shrink-0">{initials}</div>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{rep.full_name}</h1>
          <p className="text-gray-400 text-sm truncate">{rep.email}</p>
        </div>
        <div className="ml-auto text-right flex-shrink-0">
          <p className={clsx('text-2xl md:text-3xl font-bold', getStatusColor(weeklyPct))}>{weeklyPct}%</p>
          <p className={clsx('text-xs md:text-sm font-medium', getStatusColor(weeklyPct))}>{getStatusLabel(weeklyPct)}</p>
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
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 md:w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
    </div>
  )
}
