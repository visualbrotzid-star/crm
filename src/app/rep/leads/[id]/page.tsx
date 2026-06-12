'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadNote, LeadActivity, LeadStatus, KpiMetric, LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, STATUS_TO_KPI, KPI_LABELS } from '@/types'
import { useI18n, useLabels } from '@/lib/i18n/I18nProvider'
import { format, parseISO } from 'date-fns'
const LOGGABLE: KpiMetric[] = ['businesses_contacted', 'follow_ups', 'meetings_booked', 'demos_done', 'proposals_sent', 'deals_closed']

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [lead, setLead] = useState<Lead | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { t } = useI18n()
  const L = useLabels()

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    const { data: leadData } = await supabase.from('leads').select('*').eq('id', id).single()
    const { data: notesData } = await supabase.from('lead_notes').select('*').eq('lead_id', id).order('created_at', { ascending: false })
    const { data: actData } = await supabase.from('lead_activities').select('*').eq('lead_id', id).order('created_at', { ascending: false })
    setLead(leadData)
    setNotes(notesData || [])
    setActivities(actData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function logActivity(type: KpiMetric, note?: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('lead_activities').insert({
      lead_id: id, rep_id: session.user.id, activity_type: type,
      activity_date: new Date().toISOString().split('T')[0], note,
    })
  }

  async function changeStatus(newStatus: LeadStatus) {
    if (!lead || newStatus === lead.status) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { error: updateError } = await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    if (updateError) {
      alert(`Gagal mengubah status: ${updateError.message}`)
      setSaving(false)
      return
    }
    await supabase.from('lead_notes').insert({
      lead_id: id, author_id: session!.user.id,
      note: `Status changed to ${L.status(newStatus)}`, status_change: newStatus,
    })
    // Log the KPI activity for this status (dated, single source of truth)
    const metric = STATUS_TO_KPI[newStatus]
    if (metric) await logActivity(metric, `Lead moved to ${L.status(newStatus)}`)
    router.refresh()
    setSaving(false)
    setLoading(true)
    await load()
  }

  async function manualLog(type: KpiMetric) {
    setSaving(true)
    await logActivity(type, `Logged ${L.kpi(type)}`)
    await supabase.from('leads').update({ updated_at: new Date().toISOString() }).eq('id', id)
    router.refresh()
    setSaving(false)
    setLoading(true)
    await load()
  }

  async function addNote() {
    if (!newNote.trim()) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('lead_notes').insert({ lead_id: id, author_id: session!.user.id, note: newNote })
    await supabase.from('leads').update({ updated_at: new Date().toISOString() }).eq('id', id)
    setNewNote('')
    router.refresh()
    setSaving(false)
    setLoading(true)
    await load()
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>
  if (!lead) return <div className="p-8 text-gray-400 text-sm">{t('leads.leadNotFound')}</div>

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-4">
        <a href="/rep/leads" className="text-sm text-brand-600 hover:text-brand-800">&larr; Back to leads</a>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{lead.business_name}</h1>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${LEAD_STATUS_COLORS[lead.status]}`}>{L.status(lead.status)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {lead.email && <div><span className="text-gray-400">Email:</span> <span className="text-gray-700 dark:text-gray-300">{lead.email}</span></div>}
          {lead.instagram_id && <div><span className="text-gray-400">Instagram:</span> <span className="text-gray-700 dark:text-gray-300">{lead.instagram_id}</span></div>}
          {lead.website && <div><span className="text-gray-400">Website:</span> <span className="text-gray-700 dark:text-gray-300">{lead.website}</span></div>}
          {lead.contact_number && <div><span className="text-gray-400">Phone:</span> <span className="text-gray-700 dark:text-gray-300">{lead.contact_number}</span></div>}
          {lead.location && <div><span className="text-gray-400">Location:</span> <span className="text-gray-700 dark:text-gray-300">{lead.location}</span></div>}
        </div>
        {lead.remarks && <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">{lead.remarks}</p>}
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('leads.updateStatus')}</h2>
        <div className="flex gap-2 flex-wrap">
          {LEAD_STATUSES.map(s => (
            <button key={s} onClick={() => changeStatus(s)} disabled={saving || s === lead.status}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${s === lead.status ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {L.status(s)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Status changes are dated and automatically count toward your KPIs.</p>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t('leads.logActivity')}</h2>
        <p className="text-xs text-gray-400 mb-3">Log extra actions on this lead (e.g. a demo or proposal) that count toward your KPIs.</p>
        <div className="flex gap-2 flex-wrap">
          {LOGGABLE.map(m => (
            <button key={m} onClick={() => manualLog(m)} disabled={saving}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-300 transition-all">
              + {L.kpi(m)}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('leads.activityNotes')}</h2>
        <div className="flex gap-2 mb-4">
          <input className="input flex-1" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder={t('ph.note')} onKeyDown={e => e.key === 'Enter' && addNote()} />
          <button onClick={addNote} disabled={saving || !newNote.trim()} className="btn-primary">Add</button>
        </div>
        <div className="space-y-3">
          {[...notes.map(n => ({ ...n, kind: 'note' as const, ts: n.created_at })),
            ...activities.map(a => ({ ...a, kind: 'activity' as const, ts: a.created_at, note: a.note || L.kpi(a.activity_type) }))]
            .sort((a, b) => b.ts.localeCompare(a.ts))
            .map((item: any) => (
            <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.kind === 'activity' ? 'bg-emerald-500' : item.status_change ? 'bg-brand-500' : 'bg-gray-300'}`} />
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.note}</p>
                <p className="text-xs text-gray-400 mt-0.5">{format(parseISO(item.ts), 'MMM d, h:mm a')}</p>
              </div>
            </div>
          ))}
          {!notes.length && !activities.length && <p className="text-sm text-gray-400 text-center py-4">{t('leads.noActivity')}</p>}
        </div>
      </div>

    </div>
  )
}
