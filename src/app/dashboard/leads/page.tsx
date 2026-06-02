'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useI18n, useLabels } from '@/lib/i18n/I18nProvider'
import { Lead, Profile, LeadStatus, LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types'

export default function ManagerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [reps, setReps] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const L = useLabels()
  const { t } = useI18n()

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    const { data: leadsData } = await supabase.from('leads').select('*').order('updated_at', { ascending: false })
    const { data: repsData } = await supabase.from('profiles').select('*')
    const repMap: Record<string, Profile> = {}
    ;(repsData || []).forEach((r: Profile) => { repMap[r.id] = r })
    setLeads(leadsData || [])
    setReps(repMap)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(leadId: string) {
    setDeleting(true)
    await supabase.from('lead_notes').delete().eq('lead_id', leadId)
    await supabase.from('lead_activities').delete().eq('lead_id', leadId)
    await supabase.from('leads').delete().eq('id', leadId)
    setConfirmDeleteId(null)
    setDeleting(false)
    setLoading(true)
    await load()
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter)
  const counts: Record<string, number> = { all: leads.length }
  LEAD_STATUSES.forEach(s => { counts[s] = leads.filter(l => l.status === s).length })

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('leads.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{leads.length} leads across your team</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {LEAD_STATUSES.map(s => (
          <div key={s} className="card p-3 text-center">
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{counts[s]}</p>
            <p className="text-xs text-gray-400 mt-1">{L.status(s)}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{t('common.all')}</button>
        {LEAD_STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === s ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{L.status(s)}</button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="card overflow-hidden hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">{t('leads.business')}</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">{t('leads.rep')}</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">{t('leads.contact')}</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">{t('leads.location')}</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">{t('leads.status')}</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 text-sm">{lead.business_name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{reps[lead.rep_id]?.full_name || t('leads.unassigned')}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{lead.contact_number || lead.email || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{lead.location || '-'}</td>
                <td className="px-6 py-4"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEAD_STATUS_COLORS[lead.status]}`}>{L.status(lead.status)}</span></td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Link href={`/dashboard/leads/${lead.id}`} className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium mr-4">{t('common.view')}</Link>
                  <button onClick={() => setConfirmDeleteId(lead.id)} className="text-sm text-red-500 hover:text-red-700 font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="text-center py-12 text-gray-400"><p>No leads {filter !== 'all' ? `in ${L.status(filter as LeadStatus)}` : 'yet'}</p></div>}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(lead => (
          <div key={lead.id} className="card p-4 relative group">
            <Link href={`/dashboard/leads/${lead.id}`} className="block">
              <div className="flex items-start justify-between gap-2 mb-2 pr-6">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{lead.business_name}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${LEAD_STATUS_COLORS[lead.status]}`}>{L.status(lead.status)}</span>
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>{t('leads.rep')}: {reps[lead.rep_id]?.full_name || t('leads.unassigned')}</p>
                {(lead.contact_number || lead.email) && <p>{lead.contact_number || lead.email}</p>}
                {lead.location && <p>{lead.location}</p>}
              </div>
            </Link>
            <button
              onClick={() => setConfirmDeleteId(lead.id)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="Delete lead"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        ))}
        {!filtered.length && <div className="card text-center py-12 text-gray-400"><p>No leads {filter !== 'all' ? `in ${L.status(filter as LeadStatus)}` : 'yet'}</p></div>}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Lead?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This will permanently delete <span className="font-medium text-gray-700 dark:text-gray-300">{leads.find(l => l.id === confirmDeleteId)?.business_name}</span> and all its notes and activities. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} disabled={deleting} className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
