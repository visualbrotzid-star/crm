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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={dismiss}>
      <div
        className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 rounded-3xl p-8 max-w-sm w-full text-white text-center shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/60 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Icon */}
        <div className="relative w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"/>
          </svg>
        </div>

        {/* Text */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-3 leading-tight">{content.greeting}</h2>
          <p className="text-sm text-brand-100 leading-relaxed mb-7">{content.quote}</p>

          {/* CTA Button */}
          <button
            onClick={dismiss}
            className="w-full bg-white text-brand-700 font-semibold py-3 rounded-xl hover:bg-brand-50 active:scale-95 transition-all text-sm"
          >
            {lang === 'id' ? 'Ayo Mulai Hari Ini!' : "Let's Make It Happen!"}
          </button>
        </div>
      </div>
    </div>
  )
}
