export type Role = 'super_admin' | 'team_lead' | 'rep'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  avatar_url?: string
  created_at: string
}

export interface KpiTarget {
  id: string
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  businesses_contacted: number
  follow_ups: number
  meetings_booked: number
  demos_done: number
  proposals_sent: number
  deals_closed: number
  created_at: string
  updated_at: string
}

export interface DailyLog {
  id: string
  rep_id: string
  log_date: string
  businesses_contacted: number
  follow_ups: number
  meetings_booked: number
  demos_done: number
  proposals_sent: number
  deals_closed: number
  notes?: string
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface RepSummary {
  rep: Profile
  logs: DailyLog[]
  totals: {
    businesses_contacted: number
    follow_ups: number
    meetings_booked: number
    demos_done: number
    proposals_sent: number
    deals_closed: number
  }
  targets: KpiTarget | null
  completion_pct: number
}

export type KpiMetric =
  | 'businesses_contacted'
  | 'follow_ups'
  | 'meetings_booked'
  | 'demos_done'
  | 'proposals_sent'
  | 'deals_closed'

export const KPI_LABELS: Record<KpiMetric, string> = {
  businesses_contacted: 'Businesses Contacted',
  follow_ups: 'Follow-Ups',
  meetings_booked: 'Meetings Booked',
  demos_done: 'Demos Done',
  proposals_sent: 'Proposals Sent',
  deals_closed: 'Deals Closed',
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  team_lead: 'Team Lead',
  rep: 'Sales Rep',
}

export function isManager(role?: Role): boolean {
  return role === 'super_admin' || role === 'team_lead'
}

export const KPI_ICONS: Record<KpiMetric, string> = {
  businesses_contacted: 'building',
  follow_ups: 'repeat',
  meetings_booked: 'calendar',
  demos_done: 'monitor',
  proposals_sent: 'file',
  deals_closed: 'handshake',
}
