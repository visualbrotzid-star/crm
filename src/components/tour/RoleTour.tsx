'use client'
import SpotlightTour from './SpotlightTour'
import { MANAGER_TOUR, REP_TOUR } from './tourSteps'
import { Role, isManager } from '@/types'

export default function RoleTour({ role, userId }: { role: Role; userId: string }) {
  const steps = isManager(role) ? MANAGER_TOUR : REP_TOUR
  const key = `tour_done_${isManager(role) ? 'manager' : 'rep'}_${userId}`
  return <SpotlightTour steps={steps} storageKey={key} />
}
