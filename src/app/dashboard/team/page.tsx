'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n, useLabels } from '@/lib/i18n/I18nProvider'
import { Profile, Role } from '@/types'
import Link from 'next/link'
import { format } from 'date-fns'
import clsx from 'clsx'

export default function TeamPage() {
  const [me, setMe] = useState<Profile | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [lastLogMap, setLastLogMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', user_role: 'rep' as Role })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()
  const { t } = useI18n()
  const L = useLabels()

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` }
  }

  async function loadAll() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    const { data: meData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setMe(meData)
    const { data: usersData } = await supabase.from('profiles').select('*').order('role').order('full_name')
    const { data: recentLogs } = await supabase.from('rep_daily_kpis').select('rep_id, log_date').order('log_date', { ascending: false })
    const map: Record<string, string> = {}
    ;(recentLogs || []).forEach((l: any) => { if (!map[l.rep_id]) map[l.rep_id] = l.log_date })
    setUsers(usersData || [])
    setLastLogMap(map)
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
  }

  useEffect(() => {
    loadAll()
    const interval = setInterval(loadAll, 30000)
    const onFocus = () => { if (document.visibilityState === 'visible') loadAll() }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  function openCreate() {
    setEditUser(null)
    setForm({ email: '', password: '', full_name: '', user_role: 'rep' })
    setError('')
    setShowModal(true)
  }

  function openEdit(u: Profile) {
    setEditUser(u)
    setForm({ email: u.email, password: '', full_name: u.full_name, user_role: u.role })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      if (editUser) {
        const res = await fetch('/api/users', {
          method: 'PATCH',
          headers: await authHeaders(),
          body: JSON.stringify({ id: editUser.id, full_name: form.full_name, user_role: form.user_role, password: form.password || undefined }),
        })
        const j = await res.json()
        if (!res.ok) throw new Error(j.error)
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({ email: form.email, password: form.password, full_name: form.full_name, user_role: form.user_role }),
        })
        const j = await res.json()
        if (!res.ok) throw new Error(j.error)
      }
      setShowModal(false)
      setLoading(true)
      await loadAll()
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(u: Profile) {
    const deactivating = u.active !== false
    const msg = deactivating
      ? `Deactivate ${u.full_name}? They won't be able to log in, but their leads and history are kept.`
      : `Reactivate ${u.full_name}? They'll be able to log in again.`
    if (!confirm(msg)) return
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: await authHeaders(),
      body: JSON.stringify({ id: u.id, active: !deactivating }),
    })
    const j = await res.json()
    if (!res.ok) { alert(j.error); return }
    setLoading(true)
    await loadAll()
  }

  async function handleDelete(u: Profile) {
    if (!confirm(`Permanently delete ${u.full_name}? Their account is removed, but their leads are kept and become unassigned so you can reassign them later. This cannot be undone.`)) return
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: await authHeaders(),
      body: JSON.stringify({ id: u.id }),
    })
    const j = await res.json()
    if (!res.ok) { alert(j.error); return }
    setLoading(true)
    await loadAll()
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>

  const isSuperAdmin = me?.role === 'super_admin'
  const roleBadge = (role: Role) => {
    const styles: Record<Role, string> = {
      super_admin: 'bg-purple-50 text-purple-700',
      team_lead: 'bg-blue-50 text-blue-700',
      rep: 'bg-emerald-50 text-emerald-700',
    }
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[role]}`}>{L.role(role)}</span>
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('team.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} users</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Refresh">
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <button onClick={openCreate} className="btn-primary">{t('team.addUser')}</button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="card overflow-hidden hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">{t('team.name')}</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">{t('leads.email')}</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">{t('team.role')}</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">{t('team.lastActivity')}</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {users.map((u: Profile) => {
              const lastLog = lastLogMap[u.id]
              const initials = u.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              const canManage = (isSuperAdmin || me?.role === 'team_lead') && u.role !== 'super_admin' && u.id !== me?.id
              return (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold", u.active === false ? "bg-gray-200 dark:bg-gray-700 text-gray-400" : "bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300")}>{initials}</div>
                      <div>
                        <span className={clsx("font-medium text-sm", u.active === false ? "text-gray-400 line-through" : "text-gray-900 dark:text-gray-100")}>{u.full_name}</span>
                        {u.active === false && <span className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400">{t('team.deactivated')}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">{roleBadge(u.role)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.role === 'rep' ? (lastLog ? format(new Date(lastLog), 'MMM d') : 'Never') : '-'}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {u.role === 'rep' && <Link href={`/dashboard/rep/${u.id}`} className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium mr-4">{t('common.view')}</Link>}
                    {canManage && u.role !== 'super_admin' && (
                      <>
                        <button onClick={() => openEdit(u)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium mr-4">{t('common.edit')}</button>
                        <button onClick={() => handleToggleActive(u)} className={clsx("text-sm font-medium mr-4", u.active === false ? "text-emerald-600 hover:text-emerald-700" : "text-amber-600 hover:text-amber-700")}>{u.active === false ? t('team.reactivate') : t('team.deactivate')}</button>
                        <button onClick={() => handleDelete(u)} className="text-sm text-red-500 hover:text-red-700 font-medium">{t('common.delete')}</button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {users.map((u: Profile) => {
          const lastLog = lastLogMap[u.id]
          const initials = u.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          const canManage = isSuperAdmin || (me?.role === 'team_lead' && u.role === 'rep')
          return (
            <div key={u.id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0", u.active === false ? "bg-gray-200 dark:bg-gray-700 text-gray-400" : "bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300")}>{initials}</div>
                <div className="min-w-0 flex-1">
                  <p className={clsx("font-medium text-sm truncate", u.active === false ? "text-gray-400 line-through" : "text-gray-900 dark:text-gray-100")}>{u.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                {u.active === false ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">{t('team.deactivated')}</span> : roleBadge(u.role)}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-400">{u.role === 'rep' ? (lastLog ? `${t('team.active')} ${format(new Date(lastLog), 'MMM d')}` : '') : ''}</span>
                <div className="flex items-center gap-3">
                  {u.role === 'rep' && <Link href={`/dashboard/rep/${u.id}`} className="text-sm text-brand-600 dark:text-brand-400 font-medium">{t('common.view')}</Link>}
                  {canManage && u.role !== 'super_admin' && (
                    <>
                      <button onClick={() => openEdit(u)} className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('common.edit')}</button>
                      <button onClick={() => handleToggleActive(u)} className={clsx("text-sm font-medium", u.active === false ? "text-emerald-600" : "text-amber-600")}>{u.active === false ? t('team.reactivate') : t('team.deactivate')}</button>
                      <button onClick={() => handleDelete(u)} className="text-sm text-red-500 font-medium">{t('common.delete')}</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{editUser ? 'Edit User' : 'Add New User'}</h2>
            <div className="space-y-4">
              {!editUser && (
                <div>
                  <label className="label">{t('leads.email')}</label>
                  <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={t('ph.email')} />
                </div>
              )}
              <div>
                <label className="label">{t('team.fullName')}</label>
                <input type="text" className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder={t('ph.fullName')} />
              </div>
              <div>
                <label className="label">{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input type="text" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={t('ph.password')} />
              </div>
              <div>
                <label className="label">{t('team.role')}</label>
                <select className="input" value={form.user_role} onChange={e => setForm({ ...form, user_role: e.target.value as Role })}>
                  <option value="rep">{t('team.salesRep')}</option>
                  {isSuperAdmin && <option value="team_lead">{t('team.teamLead')}</option>}
                </select>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
