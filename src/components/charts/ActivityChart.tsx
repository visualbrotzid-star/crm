'use client'

import { DailyLog } from '@/types'
import { format, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  logs: DailyLog[]
}

export default function ActivityChart({ logs }: Props) {
  const data = logs
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .map(l => ({
      date: format(parseISO(l.log_date), 'MMM d'),
      'Contacted': l.businesses_contacted,
      'Follow-ups': l.follow_ups,
      'Meetings': l.meetings_booked,
      'Deals': l.deals_closed,
    }))

  if (!data.length) return (
    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
      No activity logged yet
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
          labelStyle={{ fontWeight: 600, color: '#111827' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Contacted" fill="#1a4fff" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Follow-ups" fill="#60a5fa" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Meetings" fill="#34d399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Deals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
