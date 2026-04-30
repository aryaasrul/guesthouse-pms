'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Booking } from '@/types/database'

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  fontWeight: 500, borderRadius: 'var(--radius)',
  transition: 'background 120ms ease', fontSize: 13, padding: '7px 14px',
}

export default function BookingActions({ booking }: { booking: Booking }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<any[]>([])
  const [showExtend, setShowExtend] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [newCheckOut, setNewCheckOut] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function updateStatus(status: string) {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    if (res.ok) {
      showToast(status === 'cancelled' ? 'Pesanan dibatalkan.' : 'Status diperbarui.')
      router.refresh()
    } else {
      setError('Gagal memperbarui status')
    }
  }

  async function handleExtend() {
    if (!newCheckOut) return
    setLoading(true)
    setError(null)
    setConflicts([])

    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ check_out: newCheckOut }),
    })
    setLoading(false)

    if (res.status === 409) {
      const data = await res.json()
      setConflicts(data.conflicts ?? [])
      return
    }
    if (!res.ok) {
      setError('Gagal extend checkout')
      return
    }

    setShowExtend(false)
    showToast('Checkout diperpanjang.')
    router.refresh()
  }

  const isCancelled = booking.status === 'cancelled'
  const isCompleted = booking.status === 'completed'

  return (
    <>
      {/* Action bar */}
      <div style={{
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {booking.status === 'pending' && (
          <button
            onClick={() => updateStatus('confirmed')}
            disabled={loading}
            style={{ ...btnBase, background: 'var(--accent)', color: '#fff', opacity: loading ? 0.5 : 1 }}
          >
            Konfirmasi
          </button>
        )}
        {booking.status === 'confirmed' && (
          <button
            onClick={() => updateStatus('active')}
            disabled={loading}
            style={{ ...btnBase, background: 'var(--accent)', color: '#fff', opacity: loading ? 0.5 : 1 }}
          >
            Check-in
          </button>
        )}
        {(booking.status === 'active' || booking.status === 'confirmed') && (
          <button
            onClick={() => setShowExtend(true)}
            style={{ ...btnBase, background: 'var(--surface)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
          >
            Perpanjang Checkout
          </button>
        )}
        {(booking.status === 'active') && (
          <button
            onClick={() => updateStatus('completed')}
            disabled={loading}
            style={{ ...btnBase, background: 'var(--surface)', color: 'var(--text-1)', border: '1px solid var(--border)', opacity: loading ? 0.5 : 1 }}
          >
            Tandai Selesai
          </button>
        )}

        <div style={{ flex: 1 }} />

        {!isCancelled && !isCompleted && (
          <button
            onClick={() => setShowCancel(true)}
            style={{
              ...btnBase,
              background: 'var(--status-occupied-bg)',
              color: 'var(--status-occupied-fg)',
              border: '1px solid #e5c5c5',
            }}
          >
            Batalkan Pesanan
          </button>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--status-occupied-fg)', marginTop: 8 }}>{error}</p>
      )}

      {conflicts.length > 0 && (
        <div style={{
          background: 'var(--status-checkout-bg)', border: '1px solid #e8d5b0',
          borderRadius: 'var(--radius)', padding: '12px 14px', marginTop: 8,
          fontSize: 13, color: 'var(--status-checkout-fg)',
        }}>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>Konflik terdeteksi:</p>
          {conflicts.map((c: any) => (
            <p key={c.id}>Booking {(c.guests as any)?.name ?? c.id.slice(0, 8)} mulai {c.check_in}</p>
          ))}
        </div>
      )}

      {/* Extend modal */}
      {showExtend && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(26,25,22,0.32)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, backdropFilter: 'blur(2px)',
        }} onClick={() => setShowExtend(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', width: 400,
            maxWidth: 'calc(100vw - 32px)', padding: 24,
            boxShadow: '0 8px 32px rgba(26,25,22,0.12)',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: 'var(--text-1)' }}>
              Perpanjang Checkout
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
                  Tanggal Checkout Baru
                </label>
                <input
                  type="date"
                  value={newCheckOut}
                  min={booking.check_out}
                  onChange={e => setNewCheckOut(e.target.value)}
                  style={{
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '7px 10px',
                    fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none', width: '100%',
                  }}
                />
              </div>
              <div style={{
                background: 'var(--status-checkout-bg)', border: '1px solid #e8d5b0',
                borderRadius: 'var(--radius)', padding: '10px 12px',
                fontSize: 12, color: 'var(--status-checkout-fg)',
              }}>
                Periksa ketersediaan kamar sebelum memperpanjang.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setShowExtend(false)} style={{ ...btnBase, background: 'var(--surface)', color: 'var(--text-1)', border: '1px solid var(--border)' }}>
                  Batal
                </button>
                <button onClick={handleExtend} disabled={loading || !newCheckOut} style={{ ...btnBase, background: 'var(--accent)', color: '#fff', opacity: (loading || !newCheckOut) ? 0.5 : 1 }}>
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancel && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(26,25,22,0.32)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, backdropFilter: 'blur(2px)',
        }} onClick={() => setShowCancel(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', width: 400,
            maxWidth: 'calc(100vw - 32px)', padding: 24,
            boxShadow: '0 8px 32px rgba(26,25,22,0.12)',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: 'var(--text-1)' }}>
              Batalkan Pesanan?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>
              Pesanan ini akan dibatalkan. Tindakan ini tidak dapat diurungkan.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowCancel(false)} style={{ ...btnBase, background: 'var(--surface)', color: 'var(--text-1)', border: '1px solid var(--border)' }}>
                Batal
              </button>
              <button onClick={() => { setShowCancel(false); updateStatus('cancelled') }} style={{ ...btnBase, background: 'var(--status-occupied-bg)', color: 'var(--status-occupied-fg)', border: '1px solid #e5c5c5' }}>
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text-1)', color: '#fff', borderRadius: 'var(--radius)',
          padding: '10px 18px', fontSize: 13, zIndex: 200,
          boxShadow: '0 4px 16px rgba(26,25,22,0.18)',
          animation: 'fadeIn 150ms ease',
        }}>
          {toast}
        </div>
      )}
    </>
  )
}
