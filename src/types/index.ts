export type Role = 'super_admin' | 'team_lead' | 'rep'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  avatar_url?: string
  manager_id?: string
  active?: boolean
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
  rep_id: string
  log_date: string
  businesses_contacted: number
  follow_ups: number
  meetings_booked: number
  demos_done: number
  proposals_sent: number
  deals_closed: number
}

export interface RepSummary {
  rep: Profile
  logs: DailyLog[]
  totals: Record<KpiMetric, number>
  targets: KpiTarget | null
  completion_pct: number
}

export type KpiMetric =
  | 'businesses_contacted' | 'follow_ups' | 'meetings_booked'
  | 'demos_done' | 'proposals_sent' | 'deals_closed'

export const KPI_LABELS: Record<KpiMetric, string> = {
  businesses_contacted: 'Businesses Contacted',
  follow_ups: 'Follow-Ups',
  meetings_booked: 'Meetings Booked',
  demos_done: 'Demos Done',
  proposals_sent: 'Proposals Sent',
  deals_closed: 'Deals Closed',
}

export const KPI_ICONS: Record<KpiMetric, string> = {
  businesses_contacted: 'building',
  follow_ups: 'repeat',
  meetings_booked: 'calendar',
  demos_done: 'monitor',
  proposals_sent: 'file',
  deals_closed: 'handshake',
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  team_lead: 'Team Lead',
  rep: 'Sales Rep',
}

export function isManager(role?: Role): boolean {
  return role === 'super_admin' || role === 'team_lead'
}

export type LeadStatus = 'new' | 'reviewed' | 'contacted' | 'follow_up' | 'negotiation' | 'won' | 'lost'

export const LEAD_STATUSES: LeadStatus[] = ['new', 'reviewed', 'contacted', 'follow_up', 'negotiation', 'won', 'lost']

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New', reviewed: 'Ditinjau', contacted: 'Contacted', follow_up: 'Follow-up',
  negotiation: 'Negotiation', won: 'Won', lost: 'Lost',
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-gray-100 text-gray-700',
  reviewed: 'bg-teal-50 text-teal-700',
  contacted: 'bg-blue-50 text-blue-700',
  follow_up: 'bg-amber-50 text-amber-700',
  negotiation: 'bg-purple-50 text-purple-700',
  won: 'bg-emerald-50 text-emerald-700',
  lost: 'bg-red-50 text-red-700',
}

// Which KPI metric each status maps to when reached.
// Note: 'businesses_contacted' is counted once when a lead is created (every lead = one
// contacted business), so 'contacted' status is intentionally NOT mapped here to avoid
// double-counting. Later pipeline stages still count their own KPI.
export const STATUS_TO_KPI: Partial<Record<LeadStatus, KpiMetric>> = {
  follow_up: 'follow_ups',
  negotiation: 'meetings_booked',
  won: 'deals_closed',
}

export interface Lead {
  id: string
  rep_id: string
  business_name: string
  email?: string
  instagram_id?: string
  website?: string
  contact_number?: string
  location?: string
  remarks?: string
  status: LeadStatus
  created_at: string
  updated_at: string
}

export interface LeadNote {
  id: string
  lead_id: string
  author_id: string
  note: string
  status_change?: string
  created_at: string
}

export interface LeadActivity {
  id: string
  lead_id: string
  rep_id: string
  activity_type: KpiMetric
  activity_date: string
  note?: string
  created_at: string
}
