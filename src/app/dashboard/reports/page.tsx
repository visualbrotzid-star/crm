'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DailyLog, Profile, KpiMetric, KPI_LABELS } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { format, parseISO, subDays } from 'date-fns'

const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']

export default function ReportsPage() {
  const [reps, setReps] = useState<Profile[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: repsData } = await supabase.from('profiles').select('*').eq('role', 'rep').order('full_name')
      const since = subDays(new Date(), 30).toISOString().split('T')[0]
      const { data: logsData } = await supabase.from('rep_daily_kpis').select('*').gte('log_date', since).order('log_date')
      setReps(repsData || [])
      setLogs(logsData || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>

  // Per-rep totals for bar chart
  const repTotals = reps.map(rep => {
    const repLogs = logs.filter(l => l.rep_id === rep.id)
    return {
      name: rep.full_name.split(' ')[0],
      Contacted: repLogs.reduce((s, l) => s + l.businesses_contacted, 0),
      Meetings: repLogs.reduce((s, l) => s + l.meetings_booked, 0),
      Deals: repLogs.reduce((s, l) => s + l.deals_closed, 0),
    }
  })

  // Daily trend (team-wide) for line chart
  const dateMap: Record<string, any> = {}
  logs.forEach(l => {
    const d = format(parseISO(l.log_date), 'MMM d')
    if (!dateMap[d]) dateMap[d] = { date: d, Contacted: 0, Deals: 0 }
    dateMap[d].Contacted += l.businesses_contacted
    dateMap[d].Deals += l.deals_closed
  })
  const trend = Object.values(dateMap)

  function exportCSV() {
    const rows = [['Rep', 'Date', ...METRICS.map(m => KPI_LABELS[m]), 'Notes']]
    logs.forEach(l => {
      const rep = reps.find(r => r.id === l.rep_id)
      rows.push([
        rep?.full_name || 'Unknown',
        l.log_date,
        ...METRICS.map(m => String(l[m as keyof DailyLog] ?? 0)),
        l.notes || '',
      ])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Last 30 days performance</p>
        </div>
        <button onClick={exportCSV} className="btn-primary">Export CSV</button>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Performance by Rep</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={repTotals}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Contacted" fill="#1a4fff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Meetings" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Deals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Daily Team Trend</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Contacted" stroke="#1a4fff" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Deals" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
