import { DailyLog, KpiTarget, KpiMetric } from '@/types'
import { format, startOfWeek, startOfMonth, startOfQuarter } from 'date-fns'

export function sumLogs(logs: DailyLog[]): Record<KpiMetric, number> {
  return {
    businesses_contacted: logs.reduce((s, l) => s + l.businesses_contacted, 0),
    follow_ups: logs.reduce((s, l) => s + l.follow_ups, 0),
    meetings_booked: logs.reduce((s, l) => s + l.meetings_booked, 0),
    demos_done: logs.reduce((s, l) => s + l.demos_done, 0),
    proposals_sent: logs.reduce((s, l) => s + l.proposals_sent, 0),
    deals_closed: logs.reduce((s, l) => s + l.deals_closed, 0),
  }
}

export function filterLogsByPeriod(logs: DailyLog[], period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): DailyLog[] {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')

  switch (period) {
    case 'daily':
      return logs.filter(l => l.log_date === today)
    case 'weekly': {
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      return logs.filter(l => l.log_date >= weekStart)
    }
    case 'monthly': {
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
      return logs.filter(l => l.log_date >= monthStart)
    }
    case 'quarterly': {
      const quarterStart = format(startOfQuarter(now), 'yyyy-MM-dd')
      return logs.filter(l => l.log_date >= quarterStart)
    }
    default:
      return logs
  }
}

export function calcCompletionPct(actuals: Record<KpiMetric, number>, target: KpiTarget | null): number {
  if (!target) return 0
  const metrics: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']
  const pcts = metrics.map(m => {
    const t = target[m]
    if (!t) return 100
    return Math.min(100, Math.round((actuals[m] / t) * 100))
  })
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
}

export function getStatusColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600'
  if (pct >= 60) return 'text-amber-500'
  return 'text-red-500'
}

export function getStatusBg(pct: number): string {
  if (pct >= 90) return 'bg-emerald-500'
  if (pct >= 60) return 'bg-amber-400'
  return 'bg-red-400'
}

export function getStatusLabel(pct: number): string {
  if (pct >= 90) return 'On Track'
  if (pct >= 60) return 'Needs Attention'
  return 'Behind'
}
