'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n, useLabels } from '@/lib/i18n/I18nProvider'
import { KpiMetric } from '@/types'

const PERIODS = ['daily', 'weekly', 'monthly', 'quarterly'] as const
const METRICS: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']

const PERIOD_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly' }
const PERIOD_CONTEXT = {
  daily: 'Per sales rep, per day',
  weekly: 'Per sales rep, per week',
  monthly: 'Per sales rep, per month',
  quarterly: 'Per sales rep, per quarter',
}

type Targets = Record<string, Record<KpiMetric, number>>

export default function TargetsPage() {
  const [targets, setTargets] = useState<Targets>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const supabase = createClient()
  const { t } = useI18n()
  const L = useLabels()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('kpi_targets').select('*')
      const map: Targets = {}
      ;(data || []).forEach((t: any) => {
        map[t.period] = {
          businesses_contacted: t.businesses_contacted,
          follow_ups: t.follow_ups,
          meetings_booked: t.meetings_booked,
          demos_done: t.demos_done,
          proposals_sent: t.proposals_sent,
          deals_closed: t.deals_closed,
        }
      })
      // Defaults
      PERIODS.forEach(p => {
        if (!map[p]) map[p] = { businesses_contacted: 0, follow_ups: 0, meetings_booked: 0, demos_done: 0, proposals_sent: 0, deals_closed: 0 }
      })
      setTargets(map)
    }
    load()
  }, [])

  function handleChange(period: string, metric: KpiMetric, val: string) {
    setTargets(prev => ({
      ...prev,
      [period]: { ...prev[period], [metric]: parseInt(val) || 0 }
    }))
  }

  async function handleSave(period: string) {
    setSaving(period)
    const vals = targets[period]
    await supabase.from('kpi_targets').upsert({
      period,
      ...vals,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'period' })
    setSaving(null)
    setSaved(period)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('targets.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('targets.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {PERIODS.map(period => (
          <div key={period} className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{PERIOD_LABELS[period]} Targets</h2>
              <button
                onClick={() => handleSave(period)}
                disabled={saving === period}
                className="btn-primary text-sm"
              >
                {saving === period ? 'Saving…' : saved === period ? '✓ Saved' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-5">{PERIOD_CONTEXT[period]}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {METRICS.map(m => (
                <div key={m}>
                  <label className="label">{L.kpi(m)}</label>
                  <input
                    type="number"
                    min="0"
                    className="input text-center"
                    value={targets[period]?.[m] || 0}
                    onChange={e => handleChange(period, m, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
