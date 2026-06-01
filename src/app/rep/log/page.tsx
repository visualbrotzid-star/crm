'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { KpiMetric, KPI_LABELS, KPI_ICONS } from '@/types'
import { format } from 'date-fns'

const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']

const HINTS: Record<KpiMetric, string> = {
  businesses_contacted: 'New businesses you messaged or called today',
  follow_ups: 'Follow-up messages or calls to existing leads',
  meetings_booked: 'Meetings or calls scheduled for future dates',
  demos_done: 'Product demos or presentations completed',
  proposals_sent: 'Formal proposals or quotes sent out',
  deals_closed: 'Signed deals or confirmed clients today',
}

export default function LogPage() {
  const today = new Date().toISOString().split('T')[0]
  const [values, setValues] = useState<Record<KpiMetric, number>>({
    businesses_contacted: 0,
    follow_ups: 0,
    meetings_booked: 0,
    demos_done: 0,
    proposals_sent: 0,
    deals_closed: 0,
  })
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [targets, setTargets] = useState<Record<KpiMetric, number> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load today's log if exists
      const { data: existing } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('rep_id', user.id)
        .eq('log_date', today)
        .single()

      if (existing) {
        setExistingId(existing.id)
        setValues({
          businesses_contacted: existing.businesses_contacted,
          follow_ups: existing.follow_ups,
          meetings_booked: existing.meetings_booked,
          demos_done: existing.demos_done,
          proposals_sent: existing.proposals_sent,
          deals_closed: existing.deals_closed,
        })
        setNotes(existing.notes || '')
      }

      // Load daily targets
      const { data: t } = await supabase.from('kpi_targets').select('*').eq('period', 'daily').single()
      if (t) setTargets(t)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      rep_id: user.id,
      log_date: today,
      ...values,
      notes,
      updated_at: new Date().toISOString(),
    }

    if (existingId) {
      await supabase.from('daily_logs').update(payload).eq('id', existingId)
    } else {
      await supabase.from('daily_logs').insert(payload)
    }

    setLoading(false)
    setSuccess(true)
    setTimeout(() => router.push('/rep'), 1500)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {existingId ? 'Update Today\'s Log' : 'Log Today\'s Activity'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-emerald-700 font-medium">
          ✓ Activity logged successfully! Redirecting…
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {METRICS.map(m => {
          const target = targets?.[m]
          const pct = target ? Math.min(100, Math.round((values[m] / target) * 100)) : null

          return (
            <div key={m} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <label className="flex items-center gap-2 font-medium text-gray-900 text-sm">
                    <span className="text-xl">{KPI_ICONS[m]}</span>
                    {KPI_LABELS[m]}
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5 ml-8">{HINTS[m]}</p>
                </div>
                {target && (
                  <span className="text-xs text-gray-400">Target: {target}</span>
                )}
              </div>
              <div className="flex items-center gap-4 ml-8">
                <input
                  type="number"
                  min="0"
                  max="999"
                  className="input w-24 text-center text-lg font-semibold"
                  value={values[m]}
                  onChange={e => setValues(prev => ({ ...prev, [m]: parseInt(e.target.value) || 0 }))}
                />
                {pct !== null && (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Notes */}
        <div className="card p-5">
          <label className="label flex items-center gap-2">
            <span>📝</span> Notes (optional)
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Any blockers, highlights, or context for today…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading || success} className="btn-primary w-full py-3 text-base">
          {loading ? 'Saving…' : existingId ? 'Update Log' : 'Submit Log'}
        </button>
      </form>
    </div>
  )
}
