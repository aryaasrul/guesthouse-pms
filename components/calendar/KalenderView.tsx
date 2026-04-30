'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Room } from '@/types/database'

interface BookingSummary {
  id: string
  room_id: string
  check_in: string
  check_out: string
  status: string
  source: string
  guests: { name: string } | null
}

interface Props {
  rooms: Room[]
  bookings: BookingSummary[]
  month: number
  year: number
}

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  airbnb: { bg: 'var(--cal-airbnb)', text: 'var(--cal-airbnb-text)', border: 'var(--cal-airbnb-border)' },
  agoda:  { bg: 'var(--cal-agoda)',  text: 'var(--cal-agoda-text)',  border: 'var(--cal-agoda-border)' },
  direct: { bg: 'var(--cal-direct)', text: 'var(--cal-direct-text)', border: 'var(--cal-direct-border)' },
}
const SOURCE_LABEL: Record<string, string> = { airbnb: 'Airbnb', agoda: 'Agoda', direct: 'Direct' }

const BAR_H = 22
const BAR_GAP = 3
const DAY_H = 34
const ROW_BOTTOM_PAD = 8

interface Segment {
  booking: BookingSummary
  room: Room
  weekIdx: number
  startCol: number
  endCol: number
  track: number
  isStart: boolean
  isEnd: boolean
}

function formatDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function KalenderView({ rooms, bookings, month, year }: Props) {
  const router = useRouter()
  const [popover, setPopover] = useState<{
    booking: BookingSummary; room: Room; x: number; y: number
  } | null>(null)

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const todayNum = isCurrentMonth ? today.getDate() : null

  const daysInMonth = new Date(year, month, 0).getDate()
  // Monday-first: 0=Mon … 6=Sun
  const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7

  const slots: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (slots.length % 7 !== 0) slots.push(null)
  const weeks = Array.from(
    { length: slots.length / 7 },
    (_, i) => slots.slice(i * 7, i * 7 + 7),
  )

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('id-ID', {
    month: 'long', year: 'numeric',
  })

  function prevMonth() {
    const d = new Date(year, month - 2, 1)
    router.push(`/admin/kalender?month=${d.getMonth() + 1}&year=${d.getFullYear()}`)
  }
  function nextMonth() {
    const d = new Date(year, month, 1)
    router.push(`/admin/kalender?month=${d.getMonth() + 1}&year=${d.getFullYear()}`)
  }

  // Returns the occupied day range [start, end] (inclusive, 1-based) within this month.
  // Occupied = check_in to check_out-1 (hotel convention: check_out morning = free).
  function getMonthRange(b: BookingSummary): { start: number; end: number } | null {
    const [ciY, ciM, ciD] = b.check_in.split('-').map(Number)
    const [coY, coM, coD] = b.check_out.split('-').map(Number)

    const bookingStart = new Date(ciY, ciM - 1, ciD)
    const lastNight    = new Date(coY, coM - 1, coD - 1)
    const monthStart   = new Date(year, month - 1, 1)
    const monthEnd     = new Date(year, month - 1, daysInMonth)

    if (lastNight < monthStart || bookingStart > monthEnd) return null

    const clampedStart = bookingStart < monthStart ? 1 : bookingStart.getDate()
    const clampedEnd   = lastNight > monthEnd ? daysInMonth : lastNight.getDate()

    return { start: clampedStart, end: clampedEnd }
  }

  // Build all segments with track assignment per week row.
  const allSegments: Segment[] = []
  const weekTrackCounts: number[] = weeks.map(() => 0)

  weeks.forEach((week, weekIdx) => {
    const realDays = week.filter((d): d is number => d !== null)
    if (realDays.length === 0) return

    const weekStart = realDays[0]
    const weekEnd   = realDays[realDays.length - 1]

    const weekSegs: Omit<Segment, 'track'>[] = []

    for (const booking of bookings) {
      const range = getMonthRange(booking)
      if (!range || range.start > weekEnd || range.end < weekStart) continue

      const segStart = Math.max(range.start, weekStart)
      const segEnd   = Math.min(range.end, weekEnd)

      const startCol = week.indexOf(segStart)
      const endCol   = week.indexOf(segEnd)
      if (startCol === -1 || endCol === -1) continue

      const room = rooms.find(r => r.id === booking.room_id)
      if (!room) continue

      weekSegs.push({
        booking, room, weekIdx, startCol, endCol,
        isStart: segStart === range.start,
        isEnd:   segEnd   === range.end,
      })
    }

    // Sort: earlier start first; wider span first on tie
    weekSegs.sort((a, b) =>
      a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol),
    )

    // Greedy track allocation — fill lowest available track
    const trackEndCols: number[] = []
    for (const seg of weekSegs) {
      let track = -1
      for (let t = 0; t < trackEndCols.length; t++) {
        if (trackEndCols[t] < seg.startCol) {
          track = t
          trackEndCols[t] = seg.endCol
          break
        }
      }
      if (track === -1) {
        track = trackEndCols.length
        trackEndCols.push(seg.endCol)
      }
      allSegments.push({ ...seg, track })
    }
    weekTrackCounts[weekIdx] = trackEndCols.length
  })

  function weekRowHeight(weekIdx: number) {
    return DAY_H + Math.max(weekTrackCounts[weekIdx], 1) * (BAR_H + BAR_GAP) + ROW_BOTTOM_PAD
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Navigation + legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={prevMonth} style={navBtnStyle}>←</button>
        <span style={{
          fontSize: 15, fontWeight: 600,
          minWidth: 170, textAlign: 'center',
          textTransform: 'capitalize', color: 'var(--text-1)',
        }}>
          {monthLabel}
        </span>
        <button onClick={nextMonth} style={navBtnStyle}>→</button>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {Object.entries(SOURCE_COLORS).map(([src, col]) => (
            <span key={src} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
              <span style={{
                width: 12, height: 12, borderRadius: 3,
                background: col.bg, border: `1px solid ${col.border}`,
                display: 'inline-block', flexShrink: 0,
              }} />
              {SOURCE_LABEL[src]}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: '#fff',
      }}>
        {/* Day-of-week headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface)',
        }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{
              padding: '9px 0',
              textAlign: 'center',
              fontSize: 11, fontWeight: 600,
              color: i >= 5 ? 'var(--text-3)' : 'var(--text-2)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              borderRight: i < 6 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, weekIdx) => (
          <div
            key={weekIdx}
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              height: weekRowHeight(weekIdx),
              borderBottom: weekIdx < weeks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            {/* Day number cells */}
            {week.map((day, col) => (
              <div
                key={col}
                style={{
                  height: DAY_H,
                  padding: '7px 9px',
                  borderRight: col < 6 ? '1px solid var(--border-subtle)' : 'none',
                  background:
                    day === null
                      ? 'var(--surface)'
                      : col >= 5
                      ? 'rgba(242,240,236,0.25)'
                      : 'transparent',
                }}
              >
                {day !== null && (
                  <span style={{
                    display: 'inline-flex',
                    width: 24, height: 24,
                    alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    fontSize: 12, fontWeight: day === todayNum ? 700 : 400,
                    color: day === todayNum ? '#fff' : col >= 5 ? 'var(--text-3)' : 'var(--text-2)',
                    background: day === todayNum ? 'var(--accent)' : 'transparent',
                  }}>
                    {day}
                  </span>
                )}
              </div>
            ))}

            {/* Booking bars — absolute positioned within the week row */}
            {allSegments
              .filter(seg => seg.weekIdx === weekIdx)
              .map(seg => {
                const col = SOURCE_COLORS[seg.booking.source] ?? SOURCE_COLORS.direct
                const startPct = (seg.startCol / 7) * 100
                const widthPct = ((seg.endCol - seg.startCol + 1) / 7) * 100
                const topOffset = DAY_H + seg.track * (BAR_H + BAR_GAP)

                const LEFT_INSET  = seg.isStart ? 4 : 0
                const RIGHT_INSET = seg.isEnd   ? 4 : 0

                const borderRadius = seg.isStart && seg.isEnd
                  ? 4
                  : seg.isStart ? '4px 0 0 4px'
                  : seg.isEnd   ? '0 4px 4px 0'
                  : 0

                const label = `${seg.room.room_number} · ${seg.booking.guests?.name ?? SOURCE_LABEL[seg.booking.source]}`

                return (
                  <div
                    key={`${seg.booking.id}-${weekIdx}`}
                    onMouseEnter={e => setPopover({ booking: seg.booking, room: seg.room, x: e.clientX, y: e.clientY })}
                    onMouseMove={e => setPopover(p => p ? { ...p, x: e.clientX, y: e.clientY } : p)}
                    onMouseLeave={() => setPopover(null)}
                    onClick={() => router.push(`/admin/booking/${seg.booking.id}`)}
                    style={{
                      position: 'absolute',
                      top: topOffset,
                      left: `calc(${startPct}% + ${LEFT_INSET}px)`,
                      width: `calc(${widthPct}% - ${LEFT_INSET + RIGHT_INSET}px)`,
                      height: BAR_H,
                      background: col.bg,
                      color: col.text,
                      border: `1px solid ${col.border}`,
                      borderLeft: !seg.isStart ? 'none' : undefined,
                      borderRight: !seg.isEnd ? 'none' : undefined,
                      borderRadius,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 7px',
                      fontSize: 11, fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: 'pointer',
                      userSelect: 'none',
                      zIndex: 1,
                    }}
                  >
                    {seg.isStart && label}
                  </div>
                )
              })}
          </div>
        ))}
      </div>

      {/* Hover popover */}
      {popover && (
        <div style={{
          position: 'fixed',
          left: popover.x + 14,
          top: popover.y - 10,
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
          boxShadow: '0 4px 20px rgba(26,25,22,0.12)',
          zIndex: 50,
          minWidth: 210,
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-1)' }}>
            {popover.booking.guests?.name ?? SOURCE_LABEL[popover.booking.source]}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>
              <span style={{ color: 'var(--text-3)' }}>Kamar</span>{' '}
              {popover.room.room_number} — {popover.room.room_type}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              {formatDate(popover.booking.check_in)} → {formatDate(popover.booking.check_out)}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '2px 8px', borderRadius: 'var(--radius-pill)',
              fontSize: 11, fontWeight: 500,
              background: SOURCE_COLORS[popover.booking.source]?.bg ?? 'var(--surface)',
              color: SOURCE_COLORS[popover.booking.source]?.text ?? 'var(--text-2)',
            }}>
              {SOURCE_LABEL[popover.booking.source] ?? popover.booking.source}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '6px 12px', borderRadius: 'var(--radius)',
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text-1)', fontSize: 14, cursor: 'pointer',
}
