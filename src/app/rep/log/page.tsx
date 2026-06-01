'use client'
import { useEffect } from 'react'
export default function LogRedirect() {
  useEffect(() => { window.location.href = '/rep/leads' }, [])
  return <div className="p-8 text-gray-400 text-sm">Redirecting to your leads...</div>
}
