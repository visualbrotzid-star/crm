import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Verify the caller is a manager (super_admin or team_lead)
async function verifyManager() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['super_admin', 'team_lead'].includes(profile.role)) return null
  return profile.role
}

// CREATE a new user
export async function POST(request: Request) {
  const role = await verifyManager()
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, password, full_name, user_role } = await request.json()

  // Only super_admin can create team_leads
  if (user_role === 'team_lead' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can create Team Leads' }, { status: 403 })
  }
  if (user_role === 'super_admin') {
    return NextResponse.json({ error: 'Cannot create another Super Admin' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: user_role },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Ensure profile has correct role and name
  await admin.from('profiles').update({ full_name, role: user_role }).eq('id', data.user.id)

  return NextResponse.json({ success: true, user: data.user })
}

// DELETE a user
export async function DELETE(request: Request) {
  const role = await verifyManager()
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  const admin = createAdminClient()

  // Check target's role
  const { data: target } = await admin.from('profiles').select('role').eq('id', id).single()
  if (target?.role === 'super_admin') {
    return NextResponse.json({ error: 'Cannot delete Super Admin' }, { status: 403 })
  }
  if (target?.role === 'team_lead' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can delete Team Leads' }, { status: 403 })
  }

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}

// UPDATE a user (name, role, password)
export async function PATCH(request: Request) {
  const role = await verifyManager()
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, full_name, user_role, password } = await request.json()
  const admin = createAdminClient()

  if (user_role === 'team_lead' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can assign Team Lead role' }, { status: 403 })
  }

  if (full_name || user_role) {
    const updates: any = {}
    if (full_name) updates.full_name = full_name
    if (user_role) updates.role = user_role
    await admin.from('profiles').update(updates).eq('id', id)
  }

  if (password) {
    await admin.auth.admin.updateUserById(id, { password })
  }

  return NextResponse.json({ success: true })
}
