'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadNote, LeadActivity, Profile, KPI_LABELS, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types'
import { useI18n, useLabels } from '@/lib/i18n/I18nProvider'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import clsx from 'clsx'

export default function ManagerLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [lead, setLead] = useState<Lead | null>(null)
  const [rep, setRep] = useState<Profile | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const { t } = useI18n()
  const L = useLabels()

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

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('lead_notes').delete().eq('lead_id', id)
    await supabase.from('lead_activities').delete().eq('lead_id', id)
    await supabase.from('leads').delete().eq('id', id)
    router.push('/dashboard/leads')
  }

  if (loading) return <div className="p-4 md:p-8 text-gray-400 text-sm">Loading...</div>
  if (!lead) return <div className="p-4 md:p-8 text-gray-400 text-sm">{t('leads.leadNotFound')}</div>

  // Merge notes + activities into one timeline
  const timeline = [
    ...notes.map(n => ({ id: n.id, kind: 'note' as const, ts: n.created_at, text: n.note, status_change: n.status_change })),
    ...activities.map(a => ({ id: a.id, kind: 'activity' as const, ts: a.created_at, text: a.note || L.kpi(a.activity_type), status_change: null })),
  ].sort((a, b) => b.ts.localeCompare(a.ts))

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard/leads" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">&larr; Back to leads</Link>
        <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Delete Lead
        </button>
      </div>

      <div className="card p-4 md:p-6 mb-6">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{lead.business_name}</h1>
            {rep && <p className="text-sm text-gray-400 mt-1">Owned by {rep.full_name}</p>}
          </div>
          <span className={clsx('text-sm font-medium px-3 py-1 rounded-full flex-shrink-0', LEAD_STATUS_COLORS[lead.status])}>{L.status(lead.status)}</span>
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
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('leads.activityNotes')}</h2>
        {!timeline.length ? (
          <p className="text-sm text-gray-400 text-center py-4">{t('leads.noActivity')}</p>
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
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Lead?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This will permanently delete <span className="font-medium text-gray-700 dark:text-gray-300">{lead.business_name}</span> and all its notes and activities. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
