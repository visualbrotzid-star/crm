import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Verify the caller via their bearer token, return their role (or null)
async function verifyManager(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')

  const admin = createAdminClient()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['super_admin', 'team_lead'].includes(profile.role)) return null
  return profile.role
}

export async function POST(request: Request) {
  const role = await verifyManager(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, password, full_name, user_role } = await request.json()

  if (user_role === 'team_lead' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can create Team Leads' }, { status: 403 })
  }
  if (user_role === 'super_admin') {
    return NextResponse.json({ error: 'Cannot create another Super Admin' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name, role: user_role },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await admin.from('profiles').update({ full_name, role: user_role }).eq('id', data.user.id)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const role = await verifyManager(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  const admin = createAdminClient()
  const { data: target } = await admin.from('profiles').select('role').eq('id', id).single()
  if (target?.role === 'super_admin') return NextResponse.json({ error: 'Cannot delete Super Admin' }, { status: 403 })
  if (target?.role === 'team_lead' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can delete Team Leads' }, { status: 403 })
  }
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const role = await verifyManager(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, full_name, user_role, password, active } = await request.json()
  const admin = createAdminClient()

  if (user_role === 'team_lead' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can assign Team Lead role' }, { status: 403 })
  }

  // Handle activate / deactivate
  if (typeof active === 'boolean') {
    const { data: target } = await admin.from('profiles').select('role').eq('id', id).single()
    if (target?.role === 'super_admin') {
      return NextResponse.json({ error: 'Cannot deactivate Super Admin' }, { status: 403 })
    }
    if (target?.role === 'team_lead' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admin can deactivate Team Leads' }, { status: 403 })
    }
    await admin.from('profiles').update({ active }).eq('id', id)
    // Also ban/unban the auth user so a deactivated user cannot log in
    await admin.auth.admin.updateUserById(id, { ban_duration: active ? 'none' : '876000h' })
    return NextResponse.json({ success: true })
  }

  if (full_name || user_role) {
    const updates: any = {}
    if (full_name) updates.full_name = full_name
    if (user_role) updates.role = user_role
    await admin.from('profiles').update(updates).eq('id', id)
  }
  if (password) await admin.auth.admin.updateUserById(id, { password })
  return NextResponse.json({ success: true })
}
