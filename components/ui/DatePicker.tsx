'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string              // YYYY-MM-DD
  onChange: (v: string) => void
  min?: string               // YYYY-MM-DD
  placeholder?: string
  style?: React.CSSProperties
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function toLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function DatePicker({ value, onChange, min, placeholder, style }: Props) {
  const today = new Date()
  const initial = value ? toLocalDate(value) : today

  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  const ref = useRef<HTMLDivElement>(null)

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = toLocalDate(value)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const displayValue = value
    ? toLocalDate(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  const minDate = min ? toLocalDate(min) : null

  // Build calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7 // Mon=0
  const slots: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (slots.length % 7 !== 0) slots.push(null)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function select(day: number) {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
  }

  function isDisabled(day: number) {
    if (!minDate) return false
    return new Date(viewYear, viewMonth, day) < minDate
  }
  function isSelected(day: number) {
    if (!value) return false
    const [y, m, d] = value.split('-').map(Number)
    return y === viewYear && m - 1 === viewMonth && d === day
  }
  function isToday(day: number) {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger input */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        style={{
          width: '100%',
          background: '#fff',
          border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '7px 10px',
          fontSize: 13,
          color: displayValue ? 'var(--text-1)' : 'var(--text-3)',
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          boxSizing: 'border-box',
          transition: 'border-color 120ms',
          outline: open ? `2px solid var(--accent-light)` : 'none',
          outlineOffset: 1,
        }}
      >
        <span>{displayValue || placeholder || 'Pilih tanggal'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>

      {/* Calendar popup */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 200,
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 28px rgba(26,25,22,0.12)',
          padding: '14px 12px 12px',
          width: 248,
          animation: 'fadeIn 80ms ease',
        }}>
          {/* Month nav */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 10,
          }}>
            <button type="button" onClick={prevMonth} style={navBtn}>‹</button>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: 'var(--text-1)', textTransform: 'capitalize',
            }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} style={navBtn}>›</button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 10, fontWeight: 600,
                color: 'var(--text-3)', padding: '3px 0',
                textTransform: 'uppercase', letterSpacing: '0.03em',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {slots.map((day, i) => {
              if (!day) return <div key={`e-${i}`} style={{ aspectRatio: '1' }} />
              const disabled = isDisabled(day)
              const selected = isSelected(day)
              const todayDay = isToday(day)
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && select(day)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '50%',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: selected ? 600 : 400,
                    background: selected
                      ? 'var(--accent)'
                      : todayDay
                      ? 'var(--accent-light)'
                      : 'transparent',
                    color: selected
                      ? '#fff'
                      : disabled
                      ? 'var(--border)'
                      : todayDay
                      ? 'var(--accent)'
                      : 'var(--text-1)',
                    cursor: disabled ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                    transition: 'background 80ms',
                  }}
                  onMouseEnter={e => {
                    if (!disabled && !selected)
                      (e.currentTarget as HTMLElement).style.background = 'var(--surface)'
                  }}
                  onMouseLeave={e => {
                    if (!disabled && !selected)
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6,
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text-1)', fontSize: 18, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1, padding: 0, fontFamily: 'var(--font-sans)',
}
