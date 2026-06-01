'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/Sidebar'
import PWARegister from '@/components/PWARegister'
import RoleTour from '@/components/tour/RoleTour'
import { Profile, isManager } from '@/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!data) { window.location.href = '/login'; return }
      if (data.active === false) {
        await supabase.auth.signOut()
        window.location.href = '/login?deactivated=1'
        return
      }
      if (!isManager(data.role)) { window.location.href = '/rep'; return }
      setProfile(data as Profile)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 text-sm">Loading...</div></div>
  if (!profile) return null

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <PWARegister />
      <RoleTour role={profile.role} userId={profile.id} />
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
