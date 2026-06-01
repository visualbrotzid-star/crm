'use client'
import { useI18n } from './I18nProvider'

export default function LangSwitcher() {
  const { lang, setLang } = useI18n()
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <button onClick={() => setLang('en')}
        className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${lang === 'en' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
        English
      </button>
      <button onClick={() => setLang('id')}
        className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${lang === 'id' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
        Indonesia
      </button>
    </div>
  )
}
