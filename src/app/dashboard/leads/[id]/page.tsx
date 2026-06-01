'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadNote, LeadActivity, Profile, KPI_LABELS, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import clsx from 'clsx'

export default function ManagerLeadDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [lead, setLead] = useState<Lead | null>(null)
  const [rep, setRep] = useState<Profile | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: leadData } = await supabase.from('leads').select('*').eq('id', id).single()
      if (leadData) {
        const { data: repData } = await supabase.from('profiles').select('*').eq('id', leadData.rep_id).single()
        setRep(repData)
      }
      const { data: notesData } = await supabase.from('lead_notes').select('*').eq('lead_id', id).order('created_at', { ascending: false })
      const { data: actData } = await supabase.from('lead_activities').select('*').eq('lead_id', id).order('created_at', { ascending: false })
      setLead(leadData)
      setNotes(notesData || [])
      setActivities(actData || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="p-4 md:p-8 text-gray-400 text-sm">Loading...</div>
  if (!lead) return <div className="p-4 md:p-8 text-gray-400 text-sm">Lead not found</div>

  // Merge notes + activities into one timeline
  const timeline = [
    ...notes.map(n => ({ id: n.id, kind: 'note' as const, ts: n.created_at, text: n.note, status_change: n.status_change })),
    ...activities.map(a => ({ id: a.id, kind: 'activity' as const, ts: a.created_at, text: a.note || KPI_LABELS[a.activity_type], status_change: null })),
  ].sort((a, b) => b.ts.localeCompare(a.ts))

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard/leads" className="text-sm text-brand-600 dark:text-brand-400 hover:underline mb-4 inline-block">&larr; Back to leads</Link>

      <div className="card p-4 md:p-6 mb-6">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{lead.business_name}</h1>
            {rep && <p className="text-sm text-gray-400 mt-1">Owned by {rep.full_name}</p>}
          </div>
          <span className={clsx('text-sm font-medium px-3 py-1 rounded-full flex-shrink-0', LEAD_STATUS_COLORS[lead.status])}>{LEAD_STATUS_LABELS[lead.status]}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {lead.email && <div><span className="text-gray-400">Email:</span> <span className="text-gray-700 dark:text-gray-300">{lead.email}</span></div>}
          {lead.instagram_id && <div><span className="text-gray-400">Instagram:</span> <span className="text-gray-700 dark:text-gray-300">{lead.instagram_id}</span></div>}
          {lead.website && <div><span className="text-gray-400">Website:</span> <span className="text-gray-700 dark:text-gray-300">{lead.website}</span></div>}
          {lead.contact_number && <div><span className="text-gray-400">Phone:</span> <span className="text-gray-700 dark:text-gray-300">{lead.contact_number}</span></div>}
          {lead.location && <div><span className="text-gray-400">Location:</span> <span className="text-gray-700 dark:text-gray-300">{lead.location}</span></div>}
        </div>
        {lead.remarks && <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">{lead.remarks}</p>}
      </div>

      <div className="card p-4 md:p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Activity & Notes</h2>
        {!timeline.length ? (
          <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {timeline.map(item => (
              <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', item.kind === 'activity' ? 'bg-emerald-500' : item.status_change ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(parseISO(item.ts), 'MMM d, h:mm a')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
