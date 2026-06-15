'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/I18nProvider'

export default function RepSettingsPage() {
  const supabase = createClient()
  const { t } = useI18n()
  const [profile, setProfile] = useState<{ id: string; full_name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data } = await supabase.from('profiles').select('id,full_name,email').eq('id', session.user.id).single()
      if (data) {
        setProfile(data)
        setName(data.full_name || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !profile) return
    setSavingName(true)
    setNameMsg(null)
    const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', profile.id)
    if (error) {
      setNameMsg({ ok: false, text: `Gagal menyimpan: ${error.message}` })
    } else {
      setNameMsg({ ok: true, text: 'Nama berhasil diperbarui.' })
      setProfile(p => p ? { ...p, full_name: name.trim() } : p)
    }
    setSavingName(false)
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) { setPwMsg({ ok: false, text: 'Password minimal 6 karakter.' }); return }
    if (newPassword !== confirmPassword) { setPwMsg({ ok: false, text: 'Password tidak cocok.' }); return }
    setSavingPw(true)
    setPwMsg(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPwMsg({ ok: false, text: `Gagal mengubah password: ${error.message}` })
    } else {
      setPwMsg({ ok: true, text: 'Password berhasil diubah.' })
      setNewPassword('')
      setConfirmPassword('')
    }
    setSavingPw(false)
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">{t('common.loading')}</div>

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('nav.settings')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{profile?.email}</p>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Ubah Nama Tampilan</h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="label">Nama Lengkap</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama lengkap Anda"
              required
            />
          </div>
          {nameMsg && (
            <p className={`text-sm font-medium ${nameMsg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {nameMsg.text}
            </p>
          )}
          <button type="submit" disabled={savingName || !name.trim()} className="btn-primary">
            {savingName ? t('common.loading') : 'Simpan Nama'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Ubah Password</h2>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className="label">Password Baru</label>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />
          </div>
          <div>
            <label className="label">Konfirmasi Password Baru</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              required
            />
          </div>
          {pwMsg && (
            <p className={`text-sm font-medium ${pwMsg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {pwMsg.text}
            </p>
          )}
          <button type="submit" disabled={savingPw || !newPassword || !confirmPassword} className="btn-primary">
            {savingPw ? t('common.loading') : 'Ubah Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
