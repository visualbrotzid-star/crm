'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DailyLog, KpiMetric } from '@/types'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']
const LABELS = ['Contacted', 'Follow-ups', 'Meetings', 'Demos', 'Proposals', 'Deals']

export default function HistoryPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Activity History</h1>
          <p className="text-gray-500 text-sm mt-1">Last {logs.length} entries</p>
        </div>
        <Link href="/rep/leads" className="btn-primary">Go to Leads</Link>
      </div>
      {!logs.length ? (
        <div className="card p-16 text-center">
          <p className="font-medium text-gray-700 dark:text-gray-300">No activity yet</p>
          <p className="text-sm text-gray-400 mt-1">Work your leads to build up activity history</p><Link href="/rep/leads" className="btn-primary mt-4 inline-block">Go to My Leads</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs font-medium text-gray-400 uppercase" style={{ gridTemplateColumns: '120px repeat(6, 1fr) 1.5fr' }}>
            <span>Date</span>
            {LABELS.map(l => <span key={l} className="text-center">{l}</span>)}
            <span>Notes</span>
          </div>
          {logs.map((log: DailyLog) => (
            <div key={log.log_date} className="grid gap-2 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 items-center" style={{ gridTemplateColumns: '120px repeat(6, 1fr) 1.5fr' }}>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{format(parseISO(log.log_date), 'MMM d')}</p>
              {METRICS.map(m => <div key={m} className="text-center text-sm font-semibold text-gray-900 dark:text-gray-100">{log[m as keyof DailyLog] as number}</div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
