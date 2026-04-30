'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Room } from '@/types/database'

const inputStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '7px 10px',
  fontSize: 13, color: 'var(--text-1)', outline: 'none', width: '100%',
  fontFamily: 'var(--font-sans)',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

export default function KamarEditForm({ room }: { room: Room }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    room_number: room.room_number,
    room_type: room.room_type,
    capacity: String(room.capacity),
    price_weekday: String(room.price_weekday),
    price_weekend: String(room.price_weekend),
    status: room.status,
  })

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/rooms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: room.id,
        ...form,
        capacity: parseInt(form.capacity),
        price_weekday: parseFloat(form.price_weekday),
        price_weekend: parseFloat(form.price_weekend),
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Gagal menyimpan')
      return
    }
    router.push('/admin/kamar')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{
      maxWidth: 520, background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 24,
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Kode Paket *">
          <input
            type="text" required value={form.room_number}
            onChange={(e) => update('room_number', e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Nama Paket *">
          <input
            type="text" value={form.room_type}
            onChange={(e) => update('room_type', e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="Maks. Tamu">
        <input
          type="number" min={1} value={form.capacity}
          onChange={(e) => update('capacity', e.target.value)}
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Harga Weekday (Rp)">
          <input
            type="number" min={0} value={form.price_weekday}
            onChange={(e) => update('price_weekday', e.target.value)}
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
          />
        </Field>
        <Field label="Harga Weekend (Rp)">
          <input
            type="number" min={0} value={form.price_weekend}
            onChange={(e) => update('price_weekend', e.target.value)}
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
          />
        </Field>
      </div>

      <Field label="Status">
        <select
          value={form.status}
          onChange={(e) => update('status', e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="active">Aktif</option>
          <option value="maintenance">Pemeliharaan</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </Field>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--status-occupied-fg)', margin: 0 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="submit" disabled={loading}
          style={{
            padding: '7px 16px', borderRadius: 'var(--radius)',
            border: 'none', background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {loading ? 'Menyimpan...' : 'Simpan Paket'}
        </button>
        <button
          type="button" onClick={() => router.back()}
          style={{
            padding: '7px 14px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text-2)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          Batal
        </button>
      </div>
    </form>
  )
}
