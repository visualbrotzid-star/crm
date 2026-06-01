'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { translations, Lang, TranslationKey } from './translations'

const I18nContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
}>({ lang: 'en', setLang: () => {}, t: (k) => k })

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem('lang')) as Lang | null
    if (stored === 'en' || stored === 'id') setLangState(stored)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  function t(key: TranslationKey): string {
    return translations[lang][key] || translations.en[key] || key
  }

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)

// Helper hooks for translating database-derived labels (fixed vocabularies)
export function useLabels() {
  const { t } = useI18n()
  return {
    status: (s: string) => t(`status.${s}` as any),
    role: (r: string) => t(`role.${r}` as any),
    kpi: (m: string) => t(`kpi.${m}` as any),
    period: (p: string) => {
      const map: Record<string, string> = { daily: 'period.today', weekly: 'period.thisWeek', monthly: 'period.thisMonth', quarterly: 'period.thisQuarter' }
      return t((map[p] || p) as any)
    },
  }
}
