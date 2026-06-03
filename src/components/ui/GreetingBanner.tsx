'use client'

import { useEffect, useState } from 'react'

const QUOTES_EN = [
  "Every call you make is one step closer to your goal. Keep going!",
  "Great salespeople are made, not born. Today is your chance to grow.",
  "Your pipeline is your future. Fill it with possibilities!",
  "Success is the sum of small efforts repeated every day.",
  "The best time to contact a lead is now. Don't wait!",
  "Consistency beats talent. Show up and give your best today.",
  "Every 'no' brings you closer to the next 'yes'. Keep pushing!",
  "Your attitude determines your direction. Stay positive and sell!",
  "Top performers start their day with intention. Make today count.",
  "The harder you work, the luckier you get. Let's go!",
]

const QUOTES_ID = [
  "Setiap telepon yang kamu buat adalah satu langkah lebih dekat ke targetmu. Terus semangat!",
  "Sales hebat dibentuk, bukan dilahirkan. Hari ini adalah kesempatanmu untuk berkembang.",
  "Pipeline-mu adalah masa depanmu. Isi dengan peluang-peluang terbaik!",
  "Sukses adalah kumpulan usaha kecil yang dilakukan setiap hari.",
  "Waktu terbaik untuk menghubungi prospek adalah sekarang. Jangan tunda!",
  "Konsistensi mengalahkan bakat. Tampil dan berikan yang terbaik hari ini.",
  "Setiap penolakan membawamu lebih dekat ke 'iya' berikutnya. Terus maju!",
  "Sikapmu menentukan arahmu. Tetap positif dan jual dengan percaya diri!",
  "Performer terbaik memulai hari dengan niat. Jadikan hari ini berarti.",
  "Semakin keras kamu bekerja, semakin beruntung kamu. Ayo mulai!",
]

function getGreeting(name: string, lang: string): { greeting: string; quote: string } {
  const hour = new Date().getHours()
  let greeting = ''
  if (lang === 'id') {
    if (hour < 11) greeting = `Selamat pagi, ${name}!`
    else if (hour < 15) greeting = `Selamat siang, ${name}!`
    else if (hour < 19) greeting = `Selamat sore, ${name}!`
    else greeting = `Selamat malam, ${name}!`
  } else {
    if (hour < 12) greeting = `Good morning, ${name}!`
    else if (hour < 17) greeting = `Good afternoon, ${name}!`
    else greeting = `Good evening, ${name}!`
  }
  const quotes = lang === 'id' ? QUOTES_ID : QUOTES_EN
  const quote = quotes[Math.floor(Math.random() * quotes.length)]
  return { greeting, quote }
}

interface Props {
  name: string
  lang?: string
}

export default function GreetingBanner({ name, lang = 'en' }: Props) {
  const [visible, setVisible] = useState(false)
  const [content, setContent] = useState({ greeting: '', quote: '' })

  useEffect(() => {
    const key = `greeting_dismissed_${new Date().toDateString()}`
    if (sessionStorage.getItem(key)) return
    setContent(getGreeting(name, lang))
    setVisible(true)
  }, [name, lang])

  function dismiss() {
    const key = `greeting_dismissed_${new Date().toDateString()}`
    sessionStorage.setItem(key, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 dark:from-brand-700 dark:to-brand-900 p-4 md:p-5 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-lg md:text-xl font-bold mb-1">{content.greeting}</p>
          <p className="text-sm text-brand-100 leading-relaxed">{content.quote}</p>
        </div>
        <button onClick={dismiss} className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  )
}
