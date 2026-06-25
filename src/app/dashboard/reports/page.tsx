'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n, useLabels } from '@/lib/i18n/I18nProvider'
import { useTheme } from '@/components/theme/ThemeProvider'
import { DailyLog, Profile, KpiMetric, KPI_LABELS } from '@/types'
import { businessNow, businessToday } from '@/lib/date'
import { useLiveRefresh } from '@/lib/useLiveRefresh'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { format, parseISO, subDays } from 'date-fns'

const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']

export default function ReportsPage() {
  const [reps, setReps] = useState<Profile[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const supabase = createClient()
  const { t } = useI18n()
  const L = useLabels()
  const dark = theme === 'dark'
  const axisColor = dark ? '#6b7280' : '#9ca3af'
  const gridColor = dark ? '#1f2937' : '#f0f0f0'

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    const { data: repsData } = await supabase.from('profiles').select('*').eq('role', 'rep').order('full_name')
    const since = format(subDays(businessNow(), 30), 'yyyy-MM-dd')
    const { data: logsData } = await supabase.from('rep_daily_kpis').select('*').gte('log_date', since).order('log_date')
    setReps(repsData || [])
    setLogs(logsData || [])
    setLoading(false)
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

  useLiveRefresh(load, 'reports')

  if (loading) return <div className="p-4 md:p-8 text-gray-400 text-sm">Loading...</div>

  const totals = METRICS.reduce((acc, m) => {
    acc[m] = logs.reduce((s, l) => s + (Number(l[m as keyof DailyLog]) || 0), 0)
    return acc
  }, {} as Record<string, number>)

  const repTotals = reps.map(rep => {
    const repLogs = logs.filter(l => l.rep_id === rep.id)
    return {
      name: rep.full_name.split(' ')[0],
      Contacted: repLogs.reduce((s, l) => s + Number(l.businesses_contacted || 0), 0),
      Meetings: repLogs.reduce((s, l) => s + Number(l.meetings_booked || 0), 0),
      Deals: repLogs.reduce((s, l) => s + Number(l.deals_closed || 0), 0),
    }
  })

  const dateMap: Record<string, any> = {}
  logs.forEach(l => {
    const d = format(parseISO(l.log_date), 'MMM d')
    if (!dateMap[d]) dateMap[d] = { date: d, Contacted: 0, Deals: 0 }
    dateMap[d].Contacted += Number(l.businesses_contacted || 0)
    dateMap[d].Deals += Number(l.deals_closed || 0)
  })
  const trend = Object.values(dateMap)

  function exportCSV() {
    const rows = [['Rep', 'Date', ...METRICS.map(m => KPI_LABELS[m])]]
    logs.forEach(l => {
      const rep = reps.find(r => r.id === l.rep_id)
      rows.push([rep?.full_name || 'Unknown', l.log_date, ...METRICS.map(m => String(l[m as keyof DailyLog] ?? 0))])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${businessToday()}.csv`
    a.click()
  }

  const tooltipStyle = { borderRadius: 12, border: dark ? '1px solid #374151' : '1px solid #e5e7eb', background: dark ? '#111827' : '#fff', color: dark ? '#f3f4f6' : '#111' }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('reports.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('reports.subtitle')}</p>
        </div>
        <button onClick={exportCSV} className="btn-primary whitespace-nowrap text-sm">{t('common.export')}</button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {METRICS.map(m => (
          <div key={m} className="card p-3 md:p-4">
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{totals[m]}</p>
            <p className="text-xs text-gray-400 mt-1 leading-tight">{L.kpi(m)}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 md:p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('reports.perfByRep')}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={repTotals}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Contacted" fill="#1a4fff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Meetings" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Deals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-4 md:p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('reports.dailyTrend')}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Contacted" stroke="#1a4fff" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Deals" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
