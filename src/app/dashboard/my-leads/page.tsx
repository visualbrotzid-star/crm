'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n, useLabels } from '@/lib/i18n/I18nProvider'
import { Lead, LeadStatus, LEAD_STATUSES } from '@/types'
import { businessToday } from '@/lib/date'
import { useLiveRefresh } from '@/lib/useLiveRefresh'
import Link from 'next/link'

export default function ManagerMyLeadsPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const L = useLabels()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ business_name: '', email: '', instagram_id: '', website: '', contact_number: '', location: '', remarks: '' })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    const { data } = await supabase.from('leads').select('*').eq('rep_id', session.user.id).order('updated_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    const onFocus = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  useLiveRefresh(load, 'manager-my-leads')

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

  async function handleCreate() {
    if (!form.business_name.trim() || !form.instagram_id.trim() || !form.contact_number.trim() || !form.location.trim()) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data: newLead } = await supabase.from('leads').insert({ ...form, rep_id: session.user.id, status: 'new' }).select('id').single()
    // Adding a lead counts as one "business contacted" toward the rep's KPI
    if (newLead) {
      await supabase.from('lead_activities').insert({
        lead_id: newLead.id, rep_id: session.user.id, activity_type: 'businesses_contacted',
        activity_date: businessToday(), note: 'Lead added',
      })
    }
    setShowModal(false)
    setForm({ business_name: '', email: '', instagram_id: '', website: '', contact_number: '', location: '', remarks: '' })
    setSaving(false)
    setLoading(true)
    await load()
  }

  if (loading) return <div className="p-4 md:p-8 text-gray-400 text-sm">{t('common.loading')}</div>

  const byStatus = filter === 'all' ? leads : leads.filter(l => l.status === filter)
  const filtered = search.trim() ? byStatus.filter(l => l.business_name.toLowerCase().includes(search.toLowerCase())) : byStatus
  const counts: Record<string, number> = { all: leads.length }
  LEAD_STATUSES.forEach(s => { counts[s] = leads.filter(l => l.status === s).length })

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('leads.myLeads')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{leads.length} {t('leads.inPipeline')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Refresh">
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary whitespace-nowrap text-sm">{t('leads.addLead')}</button>
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{t('common.all')} ({counts.all})</button>
        {LEAD_STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === s ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
            {L.status(s)} ({counts[s]})
          </button>
        ))}
      </div>
      <div className="relative mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input className="input pl-9" placeholder="Search by business name..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {!filtered.length ? (
        <div className="card p-12 text-center">
          <p className="font-medium text-gray-700 dark:text-gray-300">{t('leads.noLeads')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('leads.addFirstLead')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(lead => (
            <div key={lead.id} className="card p-5 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-md transition-all relative group">
              <Link href={`/dashboard/my-leads/${lead.id}`} className="block">
                <div className="flex items-start justify-between mb-2 gap-2 pr-6">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{lead.business_name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor(lead.status)}`}>{L.status(lead.status)}</span>
                </div>
                {lead.location && <p className="text-sm text-gray-500 dark:text-gray-400">{lead.location}</p>}
                {lead.contact_number && <p className="text-sm text-gray-400 mt-1">{lead.contact_number}</p>}
                {lead.remarks && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{lead.remarks}</p>}
              </Link>
              <button
                onClick={e => { e.stopPropagation(); setConfirmDeleteId(lead.id) }}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete lead"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('leads.addNewLead')}</h2>
            <div className="space-y-3">
              <div><label className="label">{t('leads.businessName')} *</label><input className="input" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} placeholder={t('ph.businessName')} /></div>
              <div><label className="label">{t('leads.email')}</label><input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={t('ph.contactEmail')} /></div>
              <div><label className="label">{t('leads.instagram')} *</label><input className="input" value={form.instagram_id} onChange={e => setForm({ ...form, instagram_id: e.target.value })} placeholder={t('ph.instagram')} /></div>
              <div><label className="label">{t('leads.website')}</label><input className="input" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder={t('ph.website')} /></div>
              <div><label className="label">{t('leads.contactNumber')} *</label><input className="input" value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} placeholder={t('ph.phone')} /></div>
              <div><label className="label">{t('leads.location')} *</label><input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder={t('ph.location')} /></div>
              <div><label className="label">{t('leads.remarks')}</label><textarea className="input resize-none" rows={2} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder={t('ph.remarks')} /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
                <button onClick={handleCreate} disabled={saving || !form.business_name.trim() || !form.instagram_id.trim() || !form.contact_number.trim() || !form.location.trim()} className="btn-primary flex-1">{saving ? t('common.loading') : t('leads.addLead')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function statusColor(s: LeadStatus): string {
  const map: Record<LeadStatus, string> = {
    new: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    reviewed: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    contacted: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    follow_up: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    negotiation: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    won: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    lost: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }
  return map[s]
}
