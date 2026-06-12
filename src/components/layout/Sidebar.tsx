'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, isManager } from '@/types'
import { useI18n } from '@/lib/i18n/I18nProvider'
import { TranslationKey } from '@/lib/i18n/translations'
import ThemeToggle from '@/components/theme/ThemeToggle'
import LangSwitcher from '@/lib/i18n/LangSwitcher'
import clsx from 'clsx'

const NAV_MANAGER: { href: string; key: TranslationKey; tour: string }[] = [
  { href: '/dashboard', key: 'nav.overview', tour: 'nav-overview' },
  { href: '/dashboard/my-leads', key: 'nav.myLeads', tour: 'nav-my-leads' },
  { href: '/dashboard/leads', key: 'nav.teamLeads', tour: 'nav-leads' },
  { href: '/dashboard/team', key: 'nav.team', tour: 'nav-team' },
  { href: '/dashboard/targets', key: 'nav.targets', tour: 'nav-targets' },
  { href: '/dashboard/reports', key: 'nav.reports', tour: 'nav-reports' },
]
const NAV_REP: { href: string; key: TranslationKey; tour: string }[] = [
  { href: '/rep', key: 'nav.myDashboard', tour: 'nav-myDashboard' },
  { href: '/rep/leads', key: 'nav.myLeads', tour: 'nav-myLeads' },
  { href: '/rep/history', key: 'nav.myHistory', tour: 'nav-myHistory' },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const supabase = createClient()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const nav = isManager(profile.role) ? NAV_MANAGER : NAV_REP

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const roleKey = `role.${profile.role}` as TranslationKey
  const badgeStyle = profile.role === 'super_admin' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    : profile.role === 'team_lead' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'

  const SidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-b from-brand-600 to-brand-700 rounded-lg flex items-center justify-center shadow-vb-blue">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div>
            <p className="font-extrabold tracking-tight text-ink dark:text-gray-100 text-sm leading-none">Sales<span className="text-brand-600">Track</span></p>
            <p className="text-xs text-gray-400 mt-0.5">{t('nav.kpiDashboard')}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', badgeStyle)}>{t(roleKey)}</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(item => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)} data-tour={item.tour}
            className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              pathname === item.href ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800')}>
            {t(item.key)}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-1" data-tour="lang-switch">
        <LangSwitcher />
        <ThemeToggle />
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-semibold flex-shrink-0">{initials}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{profile.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">{t('nav.signOut')}</button>
      </div>
    </>
  )

  return (
    <>
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-b from-brand-600 to-brand-700 rounded-lg flex items-center justify-center shadow-vb-blue">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <span className="font-extrabold tracking-tight text-ink dark:text-gray-100 text-sm">Sales<span className="text-brand-600">Track</span></span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-2 text-gray-600 dark:text-gray-300">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)}>
          <aside className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 p-1 text-gray-400 z-10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      <aside className="hidden md:flex w-60 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col h-screen sticky top-0">
        {SidebarContent}
      </aside>
    </>
  )
}
