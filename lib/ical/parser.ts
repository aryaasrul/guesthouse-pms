// Custom iCal parser — no external dependency, works on all Node.js versions.
// Handles the VEVENT format used by Airbnb, Agoda, and other OTAs.

export interface IcalEvent {
  uid: string
  summary: string
  start: Date
  end: Date
}

export async function fetchAndParseIcal(url: string): Promise<IcalEvent[]> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CalendarBot/1.0)',
      Accept: 'text/calendar, application/calendar+xml, text/plain, */*',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText} saat mengambil iCal dari ${new URL(url).hostname}`,
    )
  }

  const text = await response.text()

  if (!text.trim().startsWith('BEGIN:VCALENDAR')) {
    throw new Error(
      `URL bukan iCal yang valid — respons tidak diawali BEGIN:VCALENDAR. Pastikan URL iCal dari Agoda/Airbnb sudah benar.`,
    )
  }

  return parseIcalText(text)
}

function parseIcalText(text: string): IcalEvent[] {
  // Normalize line endings, then unfold continuation lines (RFC 5545 §3.1)
  const unfolded = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '')

  const events: IcalEvent[] = []

  // Split on VEVENT blocks
  const parts = unfolded.split(/BEGIN:VEVENT/)
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i].split(/END:VEVENT/)[0]

    const uid     = getField(block, 'UID')
    const summary = getField(block, 'SUMMARY') ?? ''
    const dtstart = getField(block, 'DTSTART')
    const dtend   = getField(block, 'DTEND')

    if (!uid || !dtstart || !dtend) continue

    const start = parseIcalDate(dtstart)
    const end   = parseIcalDate(dtend)
    if (!start || !end) continue

    events.push({ uid, summary, start, end })
  }

  return events
}

// Extract a property value from a VEVENT block.
// Handles parameterized names like DTSTART;VALUE=DATE:20240301
function getField(block: string, name: string): string | null {
  const lines = block.split('\n')
  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx)
    // key can be "DTSTART" or "DTSTART;VALUE=DATE" etc.
    const baseName = key.split(';')[0].trim().toUpperCase()
    if (baseName === name) {
      return line.slice(colonIdx + 1).trim()
    }
  }
  return null
}

// Parse an iCal date/datetime value into a UTC Date.
// Supported formats:
//   DATE:          YYYYMMDD
//   DATETIME UTC:  YYYYMMDDTHHmmssZ
//   DATETIME local (floating): YYYYMMDDTHHmmss  → treated as UTC date
function parseIcalDate(value: string): Date | null {
  // All-day: YYYYMMDD
  if (/^\d{8}$/.test(value)) {
    const y = +value.slice(0, 4)
    const m = +value.slice(4, 6) - 1
    const d = +value.slice(6, 8)
    return new Date(Date.UTC(y, m, d))
  }

  // Datetime: YYYYMMDDTHHmmss[Z]
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/)
  if (m) {
    const [, y, mo, d, h, mi, s] = m
    // Both UTC (Z) and floating times: take the calendar date only
    return new Date(Date.UTC(+y, +mo - 1, +d))
  }

  return null
}

export function toDateString(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
