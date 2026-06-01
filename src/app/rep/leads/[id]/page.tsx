'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadNote, LeadStatus, LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

export default function LeadDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [lead, setLead] = useState<Lead | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    const { data: leadData } = await supabase.from('leads').select('*').eq('id', id).single()
    const { data: notesData } = await supabase.from('lead_notes').select('*').eq('lead_id', id).order('created_at', { ascending: false })
    setLead(leadData)
    setNotes(notesData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  // Map status to a KPI metric that gets +1 when reached
  function kpiForStatus(status: LeadStatus): string | null {
    const map: Record<string, string> = {
      contacted: 'businesses_contacted',
      follow_up: 'follow_ups',
      negotiation: 'meetings_booked',
      won: 'deals_closed',
    }
    return map[status] || null
  }

  async function bumpKpi(metric: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase.from('daily_logs').select('*').eq('rep_id', session.user.id).eq('log_date', today).single()
    if (existing) {
      await supabase.from('daily_logs').update({ [metric]: (existing[metric] || 0) + 1, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('daily_logs').insert({ rep_id: session.user.id, log_date: today, [metric]: 1 })
    }
  }

  async function changeStatus(newStatus: LeadStatus) {
    if (!lead || newStatus === lead.status) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    await supabase.from('lead_notes').insert({
      lead_id: id, author_id: session!.user.id,
      note: `Status changed to ${LEAD_STATUS_LABELS[newStatus]}`,
      status_change: newStatus,
    })
    // Auto-bump KPI
    const metric = kpiForStatus(newStatus)
    if (metric) await bumpKpi(metric)
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
    setSaving(false)
    setLoading(true)
    await load()
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>
  if (!lead) return <div className="p-8 text-gray-400 text-sm">Lead not found</div>

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/rep/leads" className="text-sm text-brand-600 hover:text-brand-800 mb-4 inline-block">&larr; Back to leads</Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{lead.business_name}</h1>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${LEAD_STATUS_COLORS[lead.status]}`}>{LEAD_STATUS_LABELS[lead.status]}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {lead.email && <div><span className="text-gray-400">Email:</span> <span className="text-gray-700">{lead.email}</span></div>}
          {lead.instagram_id && <div><span className="text-gray-400">Instagram:</span> <span className="text-gray-700">{lead.instagram_id}</span></div>}
          {lead.website && <div><span className="text-gray-400">Website:</span> <span className="text-gray-700">{lead.website}</span></div>}
          {lead.contact_number && <div><span className="text-gray-400">Phone:</span> <span className="text-gray-700">{lead.contact_number}</span></div>}
          {lead.location && <div><span className="text-gray-400">Location:</span> <span className="text-gray-700">{lead.location}</span></div>}
        </div>
        {lead.remarks && <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">{lead.remarks}</p>}
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Update Status</h2>
        <div className="flex gap-2 flex-wrap">
          {LEAD_STATUSES.map(s => (
            <button key={s} onClick={() => changeStatus(s)} disabled={saving || s === lead.status}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${s === lead.status ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {LEAD_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Moving to Contacted, Follow-up, Negotiation, or Won automatically counts toward your daily KPIs.</p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Activity & Notes</h2>
        <div className="flex gap-2 mb-4">
          <input className="input flex-1" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." onKeyDown={e => e.key === 'Enter' && addNote()} />
          <button onClick={addNote} disabled={saving || !newNote.trim()} className="btn-primary">Add</button>
        </div>
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${note.status_change ? 'bg-brand-500' : 'bg-gray-300'}`} />
              <div className="flex-1">
                <p className="text-sm text-gray-700">{note.note}</p>
                <p className="text-xs text-gray-400 mt-0.5">{format(parseISO(note.created_at), 'MMM d, h:mm a')}</p>
              </div>
            </div>
          ))}
          {!notes.length && <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>}
        </div>
      </div>
    </div>
  )
}
