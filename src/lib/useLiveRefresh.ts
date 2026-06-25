'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribe to Supabase Realtime changes on the tables that drive KPIs, and
 * call `onChange` whenever an agent adds/edits a lead or logs an activity.
 * Row visibility follows RLS, so a manager receives events for every rep they
 * can see. Polling stays as a fallback for when the socket drops.
 *
 * @param onChange  callback (usually the page's load()) — always the latest one is used
 * @param channel   a unique channel name per page so subscriptions don't collide
 */
export function useLiveRefresh(onChange: () => void, channel: string) {
  const cb = useRef(onChange)
  cb.current = onChange

  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel(channel)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_activities' }, () => cb.current())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => cb.current())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [channel])
}
