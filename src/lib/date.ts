// Business timezone for the whole CRM. All agents and managers operate in
// Indonesia (WIB), so KPI "days" are anchored to Asia/Jakarta regardless of the
// device timezone. This keeps what gets written (activity_date) and what gets
// filtered (today / this week / this month) on the exact same calendar day.
const BUSINESS_TZ = 'Asia/Jakarta'

/**
 * Today's business date in Asia/Jakarta as 'yyyy-MM-dd'.
 * Use this everywhere instead of `new Date().toISOString().split('T')[0]`,
 * which returns the UTC date and is a day behind for 7 hours every night (WIB).
 */
export function businessToday(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * A Date whose calendar fields are the current Asia/Jakarta day (at local
 * midnight). Feed this to date-fns startOfWeek/startOfMonth/startOfQuarter so
 * period boundaries line up with the WIB calendar, then format with 'yyyy-MM-dd'.
 */
export function businessNow(): Date {
  const [y, m, d] = businessToday().split('-').map(Number)
  return new Date(y, m - 1, d)
}
