'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface RentalPackage {
  id: string
  room_number: string
  room_type: string
  capacity: number
  price_weekday: number
  price_weekend: number
}

interface Props {
  packages: RentalPackage[]
}

function calcNights(a: string, b: string) {
  if (!a || !b) return 0
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

function calcTotal(a: string, b: string, wd: number, we: number) {
  if (!a || !b) return 0
  let total = 0
  const cur = new Date(a)
  const end = new Date(b)
  while (cur < end) {
    total += [0, 6].includes(cur.getDay()) ? we : wd
    cur.setDate(cur.getDate() + 1)
  }
  return total
}

function fmt(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const labelSt: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
  textTransform: 'uppercase', letterSpacing: '0.04em',
  marginBottom: 6, display: 'block',
}

export default function AvailabilityWidget({ packages }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [selectedPkg, setSelectedPkg] = useState<RentalPackage | null>(
    packages.length === 1 ? packages[0] : null
  )
  const [checkIn, setCheckIn]   = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults]     = useState(1)

  const nights = calcNights(checkIn, checkOut)
  const total  = selectedPkg ? calcTotal(checkIn, checkOut, selectedPkg.price_weekday, selectedPkg.price_weekend) : 0
  const dp     = total ? Math.ceil(total / 2) : 0

  const canBook = !!selectedPkg && !!checkIn && !!checkOut && nights > 0

  function handleBook() {
    if (!canBook || !selectedPkg) return
    router.push(`/pesan?${new URLSearchParams({
      room_id:   selectedPkg.id,
      check_in:  checkIn,
      check_out: checkOut,
      adults:    String(adults),
    })}`)
  }

  const minPrice = packages.length > 0
    ? Math.min(...packages.map(p => p.price_weekday))
    : 0

  const inputSt: React.CSSProperties = {
    width: '100%', background: '#fff', border: 'none', borderRadius: 0,
    padding: 0, fontSize: 13, color: 'var(--text-1)', outline: 'none',
    fontFamily: 'var(--font-mono)', boxSizing: 'border-box',
  }

  if (packages.length === 0) {
    return (
      <div style={{
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px 20px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
          Tidak ada paket tersedia saat ini. Hubungi kami langsung.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(26,25,22,0.08)',
    }}>
      {/* Hero price */}
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
            {selectedPkg ? fmt(selectedPkg.price_weekday) : (packages.length > 1 ? `mulai ${fmt(minPrice)}` : fmt(minPrice))}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>/malam</span>
        </div>
        {selectedPkg && selectedPkg.price_weekend !== selectedPkg.price_weekday && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            Weekend: {fmt(selectedPkg.price_weekend)}/malam
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Package selector — only shown when multiple packages */}
        {packages.length > 1 && (
          <div>
            <span style={labelSt}>Paket Sewa</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {packages.map(pkg => {
                const active = selectedPkg?.id === pkg.id
                return (
                  <div
                    key={pkg.id}
                    onClick={() => { setSelectedPkg(pkg); setAdults(1) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', cursor: 'pointer',
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      background: active ? 'var(--accent-light)' : '#fff',
                      transition: 'all 100ms',
                    }}
                  >
                    {/* Radio dot */}
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      background: active ? 'var(--accent)' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: active ? 'var(--accent)' : 'var(--text-1)' }}>
                        {pkg.room_type}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                        Maks. {pkg.capacity} tamu
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500,
                        color: active ? 'var(--accent)' : 'var(--text-1)',
                      }}>
                        {fmt(pkg.price_weekday)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>/malam</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Date pickers */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: '10px 12px', borderRight: '1px solid var(--border)' }}>
              <label style={labelSt}>Check-in</label>
              <input
                type="date" value={checkIn} min={today}
                onChange={e => {
                  setCheckIn(e.target.value)
                  if (checkOut && e.target.value >= checkOut) setCheckOut('')
                }}
                style={inputSt}
              />
            </div>
            <div style={{ padding: '10px 12px' }}>
              <label style={labelSt}>Check-out</label>
              <input
                type="date" value={checkOut} min={checkIn || today}
                onChange={e => setCheckOut(e.target.value)}
                style={inputSt}
              />
            </div>
          </div>
        </div>

        {/* Guest counter */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
          <span style={labelSt}>Tamu</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {adults} dewasa
              {selectedPkg && <> · maks. {selectedPkg.capacity}</>}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {(['−', '+'] as const).map((sym) => {
                const isDecr = sym === '−'
                const disabled = isDecr ? adults <= 1 : (selectedPkg ? adults >= selectedPkg.capacity : adults >= 8)
                return (
                  <button
                    key={sym} type="button"
                    onClick={() => setAdults(v => isDecr ? Math.max(1, v - 1) : Math.min(selectedPkg?.capacity ?? 8, v + 1))}
                    disabled={disabled}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      border: '1px solid var(--border)',
                      background: disabled ? 'var(--surface)' : '#fff',
                      color: disabled ? 'var(--text-3)' : 'var(--text-1)',
                      cursor: disabled ? 'default' : 'pointer',
                      fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {sym}
                  </button>
                )
              })}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, minWidth: 20, textAlign: 'center' }}>
                {adults}
              </span>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        {nights > 0 && selectedPkg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)' }}>
              <span>{nights} malam</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
              <span>DP yang diperlukan (50%)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(dp)}</span>
            </div>
            <div style={{ height: 1, background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
              <span style={{ color: 'var(--text-1)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{fmt(total)}</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          type="button" onClick={handleBook} disabled={!canBook}
          className="public-cta-btn"
          style={{
            width: '100%', padding: '12px', borderRadius: 'var(--radius)',
            border: 'none',
            background: canBook ? 'var(--accent)' : 'var(--surface)',
            color: canBook ? '#fff' : 'var(--text-3)',
            fontSize: 14, fontWeight: 600,
            cursor: canBook ? 'pointer' : 'default',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {!selectedPkg && packages.length > 1
            ? 'Pilih paket dulu'
            : !checkIn || !checkOut || nights <= 0
              ? 'Pilih tanggal dulu'
              : 'Pesan Sekarang'}
        </button>

        {canBook && (
          <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', margin: 0 }}>
            Belum dikenakan biaya — konfirmasi setelah transfer DP
          </p>
        )}
      </div>
    </div>
  )
}
