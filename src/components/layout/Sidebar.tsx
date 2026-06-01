'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, ROLE_LABELS, isManager } from '@/types'
import clsx from 'clsx'

const NAV_MANAGER = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/leads', label: 'Leads' },
  { href: '/dashboard/team', label: 'Team' },
  { href: '/dashboard/targets', label: 'KPI Targets' },
  { href: '/dashboard/reports', label: 'Reports' },
]

const NAV_REP = [
  { href: '/rep', label: 'My Dashboard' },
  { href: '/rep/leads', label: 'My Leads' },
  { href: '/rep/log', label: 'Log Activity' },
  { href: '/rep/history', label: 'My History' },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const supabase = createClient()
  const nav = isManager(profile.role) ? NAV_MANAGER : NAV_REP

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const badgeStyle = profile.role === 'super_admin' ? 'bg-purple-50 text-purple-700'
    : profile.role === 'team_lead' ? 'bg-blue-50 text-blue-700'
    : 'bg-emerald-50 text-emerald-700'

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-none">SalesTrack</p>
            <p className="text-xs text-gray-400 mt-0.5">KPI Dashboard</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-gray-100">
        <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', badgeStyle)}>{ROLE_LABELS[profile.role]}</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(item => (
          <Link key={item.href} href={item.href}
            className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              pathname === item.href ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">{initials}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{profile.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">Sign out</button>
      </div>
    </aside>
  )
}
