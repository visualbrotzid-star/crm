'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/I18nProvider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const { t } = useI18n()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('deactivated') === '1') {
      setError(t('login.deactivated'))
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Banned/deactivated users get a specific auth error
      const msg = /banned|disabled|deactiv/i.test(error.message)
        ? t('login.deactivated')
        : error.message
      setError(msg)
      setLoading(false)
      return
    }

    if (data.session) {
      // Give the browser a moment to persist the auth cookie, then hard-navigate
      await new Promise(r => setTimeout(r, 400))
      window.location.href = '/dashboard'
    } else {
      setError('Could not start session. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-blue-100 dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="card p-8 w-full max-w-sm">
        <div className="mb-8">
          <p className="font-bold text-gray-900 dark:text-gray-100 text-2xl">Visualbrotz</p>
          <p className="text-xs text-gray-400 mt-1">{t('nav.kpiDashboard')}</p>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">{t('login.welcome')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('login.subtitle')}</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">{t('leads.email')}</label>
            <input type="email" className="input" placeholder={t('ph.email')} value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t('team.password')}</label>
            <input type="password" className="input" placeholder={t('ph.password')} value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
