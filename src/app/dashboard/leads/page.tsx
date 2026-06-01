'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lead, Profile, LeadStatus, LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types'

export default function ManagerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [reps, setReps] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      // RLS automatically filters to leads this manager can see (own reports / all)
      const { data: leadsData } = await supabase.from('leads').select('*').order('updated_at', { ascending: false })
      const { data: repsData } = await supabase.from('profiles').select('*')
      const repMap: Record<string, Profile> = {}
      ;(repsData || []).forEach((r: Profile) => { repMap[r.id] = r })
      setLeads(leadsData || [])
      setReps(repMap)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter)
  const counts: Record<string, number> = { all: leads.length }
  LEAD_STATUSES.forEach(s => { counts[s] = leads.filter(l => l.status === s).length })

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Leads Pipeline</h1>
        <p className="text-gray-500 text-sm mt-1">{leads.length} leads across your team</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {LEAD_STATUSES.map(s => (
          <div key={s} className="card p-3 text-center">
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{counts[s]}</p>
            <p className="text-xs text-gray-400 mt-1">{LEAD_STATUS_LABELS[s]}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>All</button>
        {LEAD_STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === s ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{LEAD_STATUS_LABELS[s]}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Business</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Rep</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Contact</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Location</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 text-sm">{lead.business_name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{reps[lead.rep_id]?.full_name || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{lead.contact_number || lead.email || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{lead.location || '-'}</td>
                <td className="px-6 py-4"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEAD_STATUS_COLORS[lead.status]}`}>{LEAD_STATUS_LABELS[lead.status]}</span></td>
                <td className="px-6 py-4 text-right"><Link href={`/dashboard/leads/${lead.id}`} className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="text-center py-12 text-gray-400"><p>No leads {filter !== 'all' ? `in ${LEAD_STATUS_LABELS[filter as LeadStatus]}` : 'yet'}</p></div>}
      </div>
    </div>
  )
}
