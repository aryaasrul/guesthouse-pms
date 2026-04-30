'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Room } from '@/types/database'
import DatePicker from '@/components/ui/DatePicker'

interface Props {
  propertyId: string
  rooms: Pick<Room, 'id' | 'room_number' | 'room_type' | 'price_weekday' | 'price_weekend'>[]
  existingBookings?: { room_id: string; check_in: string; check_out: string }[]
}

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}
function formatDate(str: string) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const inputStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '7px 10px',
  fontSize: 13, color: 'var(--text-1)', outline: 'none', width: '100%',
  fontFamily: 'var(--font-sans)',
}
const monoInputStyle: React.CSSProperties = { ...inputStyle, fontFamily: 'var(--font-mono)' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 20, ...style,
    }}>
      {children}
    </div>
  )
}

export default function BookingForm({ propertyId, rooms, existingBookings = [] }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [newBookingId, setNewBookingId] = useState('')

  const [checkIn, setCheckIn]   = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [phone, setPhone]       = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [price, setPrice]       = useState('')
  const [notes, setNotes]       = useState('')

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    return Math.max(0, (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
  }, [checkIn, checkOut])

  const datesSelected = checkIn && checkOut && nights > 0

  const roomAvailability = useMemo(() => {
    if (!datesSelected) return rooms.map(r => ({ room: r, available: true, takenBy: null }))
    return rooms.map(room => {
      const conflict = existingBookings.find(b =>
        b.room_id === room.id && b.check_in < checkOut && b.check_out > checkIn
      )
      return { room, available: !conflict, takenBy: conflict ? 'Terisi' : null }
    })
  }, [checkIn, checkOut, rooms, existingBookings, datesSelected])

  useEffect(() => {
    if (selectedRoom) {
      const room = rooms.find(r => r.id === selectedRoom)
      if (room && nights > 0) setPrice(String(room.price_weekday * nights))
    }
  }, [selectedRoom, nights, rooms])

  useEffect(() => {
    if (selectedRoom) {
      const avail = roomAvailability.find(a => a.room.id === selectedRoom)
      if (!avail?.available) setSelectedRoom(null)
    }
  }, [roomAvailability])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRoom || !guestName || !datesSelected) return
    setLoading(true)
    setError(null)

    try {
      let guestId: string | null = null
      if (guestName) {
        const guestRes = await fetch('/api/guests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            property_id: propertyId,
            name: guestName,
            phone: phone || null,
            id_number: idNumber || null,
          }),
        })
        if (guestRes.ok) {
          const guest = await guestRes.json()
          guestId = guest.id
        }
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          room_id: selectedRoom,
          guest_id: guestId,
          check_in: checkIn,
          check_out: checkOut,
          source: 'direct',
          status: 'confirmed',
          total_price: price ? Number(price) : null,
          notes: notes || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Gagal membuat booking')
      }

      const booking = await res.json()
      setNewBookingId(booking.id)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 16, padding: '80px 24px', textAlign: 'center',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--accent-light)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)' }}>Pesanan berhasil dibuat</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
            Atas nama: <strong>{guestName}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              setSubmitted(false)
              setCheckIn(''); setCheckOut(''); setSelectedRoom(null)
              setGuestName(''); setPhone(''); setIdNumber(''); setPrice(''); setNotes('')
            }}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-1)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Buat Lagi
          </button>
          {newBookingId && (
            <button
              onClick={() => router.push(`/admin/booking/${newBookingId}`)}
              style={{
                padding: '7px 14px', borderRadius: 'var(--radius)',
                border: 'none', background: 'var(--accent)', color: '#fff',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Lihat Detail
            </button>
          )}
          <button
            onClick={() => router.push('/admin')}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius)',
              border: 'none', background: 'var(--accent)', color: '#fff',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Dates */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 16 }}>
          Tanggal Menginap
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Check-in">
            <DatePicker value={checkIn} onChange={setCheckIn} placeholder="Pilih tanggal" />
          </Field>
          <Field label="Check-out">
            <DatePicker value={checkOut} onChange={setCheckOut} min={checkIn} placeholder="Pilih tanggal" />
          </Field>
        </div>
        {datesSelected && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)' }}>
            {nights} malam · {formatDate(checkIn)} — {formatDate(checkOut)}
          </div>
        )}
      </Card>

      {/* Room selector */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}>
          Pilih Kamar
        </div>
        {!datesSelected ? (
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
            Pilih tanggal terlebih dahulu untuk melihat ketersediaan.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
              {roomAvailability.filter(a => a.available).length} kamar tersedia untuk tanggal yang dipilih
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {roomAvailability.map(({ room, available, takenBy }) => {
                const selected = selectedRoom === room.id
                return (
                  <div
                    key={room.id}
                    onClick={() => available && setSelectedRoom(room.id)}
                    title={!available && takenBy ? takenBy : ''}
                    style={{
                      border: `1.5px solid ${selected ? 'var(--accent)' : available ? 'var(--border-subtle)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius)',
                      padding: '12px 14px',
                      cursor: available ? 'pointer' : 'not-allowed',
                      background: selected ? 'var(--accent-light)' : !available ? 'var(--surface)' : '#fff',
                      opacity: available ? 1 : 0.55,
                      transition: 'border-color 100ms, background 100ms',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (available && !selected) (e.currentTarget as HTMLElement).style.background = 'rgba(61,107,82,0.03)'
                    }}
                    onMouseLeave={e => {
                      if (available && !selected) (e.currentTarget as HTMLElement).style.background = '#fff'
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500,
                      color: selected ? 'var(--accent)' : available ? 'var(--text-1)' : 'var(--text-3)',
                    }}>
                      {room.room_number}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{room.room_type}</div>
                    <div style={{
                      fontSize: 11, marginTop: 4,
                      fontFamily: 'var(--font-mono)',
                      color: selected ? 'var(--accent)' : 'var(--text-3)',
                    }}>
                      {formatRupiah(room.price_weekday)}
                      <span style={{ fontFamily: 'var(--font-sans)' }}>/mlm</span>
                    </div>
                    {!available && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 'var(--radius)',
                      }}>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', padding: '0 8px' }}>
                          Terisi
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      {/* Guest info */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 16 }}>Data Tamu</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nama Lengkap">
            <input
              type="text" value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="Nama sesuai KTP"
              style={inputStyle}
              required
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Nomor HP">
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xx-xxxx-xxxx" style={monoInputStyle} />
            </Field>
            <Field label="Nomor KTP">
              <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="16 digit" style={monoInputStyle} />
            </Field>
          </div>
        </div>
      </Card>

      {/* Payment + notes */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 16 }}>Detail Pembayaran</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'end' }}>
            <Field label="Total Harga (Rp)">
              <input
                type="number" value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0"
                style={monoInputStyle}
              />
            </Field>
            <div style={{ paddingBottom: 8, fontSize: 12, color: 'var(--text-3)' }}>
              Sumber:{' '}
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                fontSize: 12, fontWeight: 500,
                background: 'var(--direct-bg)', color: 'var(--direct-fg)',
              }}>Direct</span>
            </div>
          </div>
          <Field label="Catatan (opsional)">
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Permintaan khusus, catatan untuk staf..."
              rows={2}
              style={{
                ...inputStyle, resize: 'vertical', lineHeight: 1.5,
              }}
            />
          </Field>
        </div>
      </Card>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--status-occupied-fg)' }}>{error}</p>
      )}

      {/* Submit */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: '7px 14px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text-1)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={!guestName || !selectedRoom || !datesSelected || loading}
          style={{
            padding: '7px 14px', borderRadius: 'var(--radius)',
            border: 'none', background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 500,
            cursor: (!guestName || !selectedRoom || !datesSelected || loading) ? 'not-allowed' : 'pointer',
            opacity: (!guestName || !selectedRoom || !datesSelected || loading) ? 0.5 : 1,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {loading ? 'Menyimpan...' : 'Buat Pesanan'}
        </button>
      </div>
    </form>
  )
}
