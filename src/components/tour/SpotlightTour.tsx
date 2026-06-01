'use client'

import { useEffect, useState, useCallback } from 'react'
import { useI18n } from '@/lib/i18n/I18nProvider'

export interface TourStep {
  selector: string       // CSS selector for the element to highlight
  titleEn: string
  titleId: string
  bodyEn: string
  bodyId: string
}

interface Props {
  steps: TourStep[]
  storageKey: string     // unique per role so each user sees their tour once
}

export default function SpotlightTour({ steps, storageKey }: Props) {
  const { lang, t } = useI18n()
  const [active, setActive] = useState(false)
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const seen = localStorage.getItem(storageKey)
    if (!seen) {
      // small delay so the page elements are mounted
      const tm = setTimeout(() => setActive(true), 800)
      return () => clearTimeout(tm)
    }
  }, [storageKey])

  const measure = useCallback(() => {
    if (!active || !steps[idx]) return
    const el = document.querySelector(steps[idx].selector) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => setRect(el.getBoundingClientRect()), 300)
    } else {
      setRect(null) // element not found - center the tooltip
    }
  }, [active, idx, steps])

  useEffect(() => { measure() }, [measure])
  useEffect(() => {
    if (!active) return
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [active, measure])

  if (!active) return null

  function finish() {
    localStorage.setItem(storageKey, '1')
    setActive(false)
  }
  function next() { idx < steps.length - 1 ? setIdx(idx + 1) : finish() }
  function back() { if (idx > 0) setIdx(idx - 1) }

  const step = steps[idx]
  const pad = 8
  const hole = rect ? {
    left: rect.left - pad, top: rect.top - pad,
    width: rect.width + pad * 2, height: rect.height + pad * 2,
  } : null

  // Tooltip position: below the element if room, else above; centered if no element
  let tipStyle: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  if (hole) {
    const belowSpace = window.innerHeight - (hole.top + hole.height)
    const placeBelow = belowSpace > 200
    const top = placeBelow ? hole.top + hole.height + 12 : hole.top - 12
    let left = hole.left + hole.width / 2
    left = Math.max(170, Math.min(left, window.innerWidth - 170))
    tipStyle = { left, top, transform: placeBelow ? 'translateX(-50%)' : 'translate(-50%, -100%)' }
  }

  return (
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: 'auto' }}>
      {/* Dim overlay with a cutout hole using box-shadow */}
      {hole ? (
        <div className="absolute rounded-xl transition-all duration-300"
          style={{ left: hole.left, top: hole.top, width: hole.width, height: hole.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)', pointerEvents: 'none' }} />
      ) : (
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)', pointerEvents: 'none' }} />
      )}

      {/* Tooltip card */}
      <div className="absolute w-[300px] max-w-[88vw] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-5 border border-gray-100 dark:border-gray-800"
        style={tipStyle}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-brand-600 dark:text-brand-400">{t('tour.step')} {idx + 1} {t('tour.of')} {steps.length}</span>
          <button onClick={finish} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">{t('tour.skip')}</button>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{lang === 'id' ? step.titleId : step.titleEn}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">{lang === 'id' ? step.bodyId : step.bodyEn}</p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-brand-600 dark:bg-brand-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {idx > 0 && <button onClick={back} className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-1.5">{t('tour.back')}</button>}
            <button onClick={next} className="btn-primary text-sm py-1.5">{idx === steps.length - 1 ? t('tour.finish') : t('tour.next')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
