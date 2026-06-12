'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n, useLabels } from '@/lib/i18n/I18nProvider'
import { Lead, LeadStatus, LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types'
import Link from 'next/link'

export default function RepLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ business_name: '', email: '', instagram_id: '', website: '', contact_number: '', location: '', remarks: '' })
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const L = useLabels()
  const { t } = useI18n()

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    const { data } = await supabase.from('leads').select('*').eq('rep_id', session.user.id).order('updated_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.business_name.trim() || !form.instagram_id.trim() || !form.contact_number.trim() || !form.location.trim()) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('leads').insert({ ...form, rep_id: session.user.id, status: 'new' })
    setShowModal(false)
    setForm({ business_name: '', email: '', instagram_id: '', website: '', contact_number: '', location: '', remarks: '' })
    setSaving(false)
    setLoading(true)
    await load()
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>

  const byStatus = filter === 'all' ? leads : leads.filter(l => l.status === filter)
  const filtered = search.trim() ? byStatus.filter(l => l.business_name.toLowerCase().includes(search.toLowerCase())) : byStatus
  const counts: Record<string, number> = { all: leads.length }
  LEAD_STATUSES.forEach(s => { counts[s] = leads.filter(l => l.status === s).length })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('leads.myLeads')}</h1>
          <p className="text-gray-500 text-sm mt-1">{leads.length} total leads in your pipeline</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">{t('leads.addLead')}</button>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>All ({counts.all})</button>
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
          <p className="font-medium text-gray-700 dark:text-gray-300">No leads {filter !== 'all' ? `in ${L.status(filter as LeadStatus)}` : 'yet'}</p>
          <p className="text-sm text-gray-400 mt-1">{t('leads.addFirstLead')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(lead => (
            <Link key={lead.id} href={`/rep/leads/${lead.id}`} className="card p-5 hover:border-brand-200 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{lead.business_name}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEAD_STATUS_COLORS[lead.status]}`}>{L.status(lead.status)}</span>
              </div>
              {lead.location && <p className="text-sm text-gray-500">{lead.location}</p>}
              {lead.contact_number && <p className="text-sm text-gray-400 mt-1">{lead.contact_number}</p>}
              {lead.remarks && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{lead.remarks}</p>}
            </Link>
          ))}
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
                <button onClick={handleCreate} disabled={saving || !form.business_name.trim() || !form.instagram_id.trim() || !form.contact_number.trim() || !form.location.trim()} className="btn-primary flex-1">{saving ? 'Saving...' : 'Add Lead'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
