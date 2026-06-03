'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { DailyLog, KpiMetric } from '@/types'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']
const LABELS = ['Contacted', 'Follow-ups', 'Meetings', 'Demos', 'Proposals', 'Deals']

interface DayActivity {
  id: string
  activity_type: KpiMetric
  note: string | null
  activity_date: string
  leads: { business_name: string }[] | null
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayActivities, setDayActivities] = useState<DayActivity[]>([])
  const [loadingDay, setLoadingDay] = useState(false)
  const [editValues, setEditValues] = useState<Record<KpiMetric, number>>({} as Record<KpiMetric, number>)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { t } = useI18n()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data } = await supabase.from('rep_daily_kpis').select('*').eq('rep_id', session.user.id).order('log_date', { ascending: false }).limit(60)
      setLogs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function openDay(log: DailyLog) {
    setSelectedDate(log.log_date)
    setEditValues({
      businesses_contacted: log.businesses_contacted,
      follow_ups: log.follow_ups,
      meetings_booked: log.meetings_booked,
      demos_done: log.demos_done,
      proposals_sent: log.proposals_sent,
      deals_closed: log.deals_closed,
    })
    setLoadingDay(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('lead_activities')
      .select('id, activity_type, note, activity_date, leads(business_name)')
      .eq('rep_id', session.user.id)
      .eq('activity_date', log.log_date)
      .order('created_at', { ascending: true })
    setDayActivities((data || []) as unknown as DayActivity[])
    setLoadingDay(false)
  }

  async function saveEdit() {
    if (!selectedDate) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('rep_daily_kpis').update(editValues).eq('rep_id', session.user.id).eq('log_date', selectedDate)
    setLogs(prev => prev.map(l => l.log_date === selectedDate ? { ...l, ...editValues } : l))
    setSaving(false)
    setSelectedDate(null)
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>

  const selectedLog = logs.find(l => l.log_date === selectedDate)

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('history.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">Last {logs.length} entries — click a row to see details</p>
        </div>
        <Link href="/rep/leads" className="btn-primary">{t('history.goToLeads')}</Link>
      </div>
      {!logs.length ? (
        <div className="card p-16 text-center">
          <p className="font-medium text-gray-700 dark:text-gray-300">{t('history.noActivity')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('history.noActivityHint')}</p><Link href="/rep/leads" className="btn-primary mt-4 inline-block">{t('history.goToLeads')}</Link>
        </div>
      ) : (
        <>
          {/* Desktop grid */}
          <div className="card overflow-hidden hidden md:block">
            <div className="grid gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs font-medium text-gray-400 uppercase" style={{ gridTemplateColumns: '120px repeat(6, 1fr)' }}>
              <span>{t('history.date')}</span>
              {LABELS.map(l => <span key={l} className="text-center">{l}</span>)}
            </div>
            {logs.map((log: DailyLog) => (
              <button
                key={log.log_date}
                onClick={() => openDay(log)}
                className="w-full grid gap-2 px-6 py-4 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-brand-50 dark:hover:bg-brand-900/10 items-center text-left transition-colors"
                style={{ gridTemplateColumns: '120px repeat(6, 1fr)' }}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{format(parseISO(log.log_date), 'MMM d')}</p>
                {METRICS.map(m => <div key={m} className="text-center text-sm font-semibold text-gray-900 dark:text-gray-100">{log[m as keyof DailyLog] as number}</div>)}
              </button>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {logs.map((log: DailyLog) => (
              <button key={log.log_date} onClick={() => openDay(log)} className="card p-4 w-full text-left hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{format(parseISO(log.log_date), 'EEEE, MMM d')}</p>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {METRICS.map((m, i) => (
                    <div key={m} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{log[m as keyof DailyLog] as number}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">{LABELS[i]}</p>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Day detail modal */}
      {selectedDate && selectedLog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDate(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {format(parseISO(selectedDate), 'EEEE, MMM d yyyy')}
              </h2>
              <button onClick={() => setSelectedDate(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6">
              {/* KPI edit section */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">KPI Numbers</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {METRICS.map((m, i) => (
                  <div key={m}>
                    <label className="label">{LABELS[i]}</label>
                    <input
                      type="number"
                      min={0}
                      className="input text-center"
                      value={editValues[m] ?? 0}
                      onChange={e => setEditValues(prev => ({ ...prev, [m]: Math.max(0, parseInt(e.target.value) || 0) }))}
                    />
                  </div>
                ))}
              </div>

              {/* Lead activities section */}
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Lead Activities</h3>
              {loadingDay ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
              ) : !dayActivities.length ? (
                <p className="text-sm text-gray-400 text-center py-4">No lead activities logged this day</p>
              ) : (
                <div className="space-y-2 mb-6">
                  {dayActivities.map(act => (
                    <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {act.leads?.[0]?.business_name || 'Unknown lead'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{act.note || act.activity_type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setSelectedDate(null)} className="btn-secondary flex-1">Close</button>
                <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
