import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'manager') redirect('/dashboard')

  const { data: reps } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'rep')
    .order('full_name')

  // Get latest log per rep
  const { data: recentLogs } = await supabase
    .from('daily_logs')
    .select('rep_id, log_date')
    .order('log_date', { ascending: false })

  const lastLogMap: Record<string, string> = {}
  ;(recentLogs || []).forEach((l: any) => {
    if (!lastLogMap[l.rep_id]) lastLogMap[l.rep_id] = l.log_date
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-500 text-sm mt-1">{reps?.length || 0} sales reps</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Rep</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Activity</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(reps || []).map((rep: any) => {
              const lastLog = lastLogMap[rep.id]
              const today = new Date().toISOString().split('T')[0]
              const loggedToday = lastLog === today
              const initials = rep.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

              return (
                <tr key={rep.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
                        {initials}
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{rep.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{rep.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {lastLog ? format(new Date(lastLog), 'MMM d, yyyy') : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${loggedToday ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {loggedToday ? '✓ Logged today' : '⚠ Not logged today'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/rep/${rep.id}`} className="text-sm text-brand-600 hover:text-brand-800 font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(!reps || !reps.length) && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">👥</p>
            <p>No reps added yet. Create users in Supabase with role = &apos;rep&apos;</p>
          </div>
        )}
      </div>
    </div>
  )
}
