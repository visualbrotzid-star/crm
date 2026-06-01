import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DailyLog, KpiMetric, KPI_ICONS } from '@/types'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: logs } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('rep_id', user.id)
    .order('log_date', { ascending: false })
    .limit(60)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Activity History</h1>
          <p className="text-gray-500 text-sm mt-1">Last {logs?.length || 0} entries</p>
        </div>
        <Link href="/rep/log" className="btn-primary">+ Log Today</Link>
      </div>

      {(!logs || !logs.length) ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium text-gray-700">No logs yet</p>
          <p className="text-sm text-gray-400 mt-1">Start logging your daily activity</p>
          <Link href="/rep/log" className="btn-primary mt-4 inline-block">Log today</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="grid gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wider"
               style={{ gridTemplateColumns: '120px repeat(6, 1fr) 1fr' }}>
            <span>Date</span>
            {METRICS.map(m => <span key={m} className="text-center">{KPI_ICONS[m]}</span>)}
            <span>Notes</span>
          </div>

          {(logs || []).map((log: DailyLog) => {
            const today = new Date().toISOString().split('T')[0]
            const isToday = log.log_date === today
            return (
              <div
                key={log.id}
                className="grid gap-2 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors items-center"
                style={{ gridTemplateColumns: '120px repeat(6, 1fr) 1fr' }}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {format(parseISO(log.log_date), 'MMM d')}
                    {isToday && <span className="ml-1.5 text-xs bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-full">today</span>}
                  </p>
                  <p className="text-xs text-gray-400">{format(parseISO(log.log_date), 'EEE')}</p>
                </div>
                {METRICS.map(m => (
                  <div key={m} className="text-center">
                    <span className="text-sm font-semibold text-gray-900">{log[m as keyof DailyLog] as number}</span>
                  </div>
                ))}
                <p className="text-xs text-gray-400 italic truncate">{log.notes || '—'}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
