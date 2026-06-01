import { TourStep } from './SpotlightTour'

export const MANAGER_TOUR: TourStep[] = [
  {
    selector: '[data-tour="nav-overview"]',
    titleEn: 'Team Overview', titleId: 'Ringkasan Tim',
    bodyEn: 'Your home base. See weekly KPI progress and how each rep is performing at a glance.',
    bodyId: 'Halaman utama Anda. Lihat progres KPI mingguan dan performa tiap sales sekilas.',
  },
  {
    selector: '[data-tour="nav-my-leads"]',
    titleEn: 'Your Own Leads', titleId: 'Prospek Anda Sendiri',
    bodyEn: 'You can manage your own pipeline too — add leads, track status, and your KPIs count automatically just like a rep.',
    bodyId: 'Anda juga bisa mengelola pipeline sendiri — tambah prospek, lacak status, dan KPI Anda dihitung otomatis seperti sales.',
  },
  {
    selector: '[data-tour="nav-leads"]',
    titleEn: 'Leads Pipeline', titleId: 'Pipeline Prospek',
    bodyEn: 'Every lead your team is working, with status and owner. Click any lead to see its full history.',
    bodyId: 'Semua prospek yang dikerjakan tim Anda, lengkap dengan status dan pemilik. Klik untuk melihat riwayat.',
  },
  {
    selector: '[data-tour="nav-team"]',
    titleEn: 'Manage Your Team', titleId: 'Kelola Tim Anda',
    bodyEn: 'Add team leads and sales reps, set their passwords, and view each person\'s activity.',
    bodyId: 'Tambah ketua tim dan sales, atur kata sandi, dan lihat aktivitas tiap orang.',
  },
  {
    selector: '[data-tour="nav-targets"]',
    titleEn: 'Set KPI Targets', titleId: 'Tetapkan Target KPI',
    bodyEn: 'Define daily, weekly, monthly, and quarterly goals. Progress bars compare against these.',
    bodyId: 'Tetapkan target harian, mingguan, bulanan, dan kuartalan. Progres dibandingkan dengan ini.',
  },
  {
    selector: '[data-tour="nav-reports"]',
    titleEn: 'Reports & Export', titleId: 'Laporan & Ekspor',
    bodyEn: 'Visual charts of team performance over 30 days. Export everything to CSV anytime.',
    bodyId: 'Grafik performa tim selama 30 hari. Ekspor semua ke CSV kapan saja.',
  },
  {
    selector: '[data-tour="lang-switch"]',
    titleEn: 'Language & Theme', titleId: 'Bahasa & Tema',
    bodyEn: 'Switch between English and Indonesian, or toggle dark mode — anytime, right here.',
    bodyId: 'Ganti antara Inggris dan Indonesia, atau aktifkan mode gelap — kapan saja, di sini.',
  },
]

export const REP_TOUR: TourStep[] = [
  {
    selector: '[data-tour="nav-myDashboard"]',
    titleEn: 'Your Dashboard', titleId: 'Dasbor Anda',
    bodyEn: 'Track your KPIs for today, this week, month, and quarter against your targets.',
    bodyId: 'Pantau KPI Anda untuk hari ini, minggu, bulan, dan kuartal dibanding target Anda.',
  },
  {
    selector: '[data-tour="nav-myLeads"]',
    titleEn: 'Your Leads', titleId: 'Prospek Anda',
    bodyEn: 'Add and manage your leads here. This is where all your work happens.',
    bodyId: 'Tambah dan kelola prospek Anda di sini. Di sinilah semua pekerjaan Anda berlangsung.',
  },
  {
    selector: '[data-tour="nav-myLeads"]',
    titleEn: 'KPIs Update Automatically', titleId: 'KPI Diperbarui Otomatis',
    bodyEn: 'When you move a lead to Contacted, Follow-up, Negotiation, or Won, it counts toward your KPIs automatically — no manual logging!',
    bodyId: 'Saat Anda memindahkan prospek ke Dihubungi, Tindak Lanjut, Negosiasi, atau Menang, itu otomatis dihitung ke KPI Anda — tanpa pencatatan manual!',
  },
  {
    selector: '[data-tour="nav-myHistory"]',
    titleEn: 'Your History', titleId: 'Riwayat Anda',
    bodyEn: 'Review all your past activity day by day.',
    bodyId: 'Tinjau semua aktivitas Anda dari hari ke hari.',
  },
  {
    selector: '[data-tour="lang-switch"]',
    titleEn: 'Language & Theme', titleId: 'Bahasa & Tema',
    bodyEn: 'Switch between English and Indonesian, or toggle dark mode — anytime, right here.',
    bodyId: 'Ganti antara Inggris dan Indonesia, atau aktifkan mode gelap — kapan saja, di sini.',
  },
]
