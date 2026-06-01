'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Role, ROLE_LABELS } from '@/types'
import Link from 'next/link'
import { format } from 'date-fns'

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
  const supabase = createClient()

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

  useEffect(() => { loadAll() }, [])

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

  async function handleDelete(u: Profile) {
    if (!confirm(`Delete ${u.full_name}? This permanently removes their account and all their logs.`)) return
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
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[role]}`}>{ROLE_LABELS[role]}</span>
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Team Management</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} users</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Add User</button>
      </div>

      {/* Desktop table */}
      <div className="card overflow-hidden hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Name</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Email</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Role</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Last Activity</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {users.map((u: Profile) => {
              const lastLog = lastLogMap[u.id]
              const initials = u.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              const canManage = isSuperAdmin || (me?.role === 'team_lead' && u.role === 'rep')
              return (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-semibold">{initials}</div>
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">{roleBadge(u.role)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.role === 'rep' ? (lastLog ? format(new Date(lastLog), 'MMM d') : 'Never') : '-'}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {u.role === 'rep' && <Link href={`/dashboard/rep/${u.id}`} className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium mr-4">View</Link>}
                    {canManage && u.role !== 'super_admin' && (
                      <>
                        <button onClick={() => openEdit(u)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium mr-4">Edit</button>
                        <button onClick={() => handleDelete(u)} className="text-sm text-red-500 hover:text-red-700 font-medium">Delete</button>
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
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-semibold flex-shrink-0">{initials}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                {roleBadge(u.role)}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-400">{u.role === 'rep' ? (lastLog ? `Active ${format(new Date(lastLog), 'MMM d')}` : 'No activity') : ''}</span>
                <div className="flex items-center gap-3">
                  {u.role === 'rep' && <Link href={`/dashboard/rep/${u.id}`} className="text-sm text-brand-600 dark:text-brand-400 font-medium">View</Link>}
                  {canManage && u.role !== 'super_admin' && (
                    <>
                      <button onClick={() => openEdit(u)} className="text-sm text-gray-500 dark:text-gray-400 font-medium">Edit</button>
                      <button onClick={() => handleDelete(u)} className="text-sm text-red-500 font-medium">Delete</button>
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
                  <label className="label">Email</label>
                  <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@email.com" />
                </div>
              )}
              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" />
              </div>
              <div>
                <label className="label">{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input type="text" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="********" />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.user_role} onChange={e => setForm({ ...form, user_role: e.target.value as Role })}>
                  <option value="rep">Sales Rep</option>
                  {isSuperAdmin && <option value="team_lead">Team Lead</option>}
                </select>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
