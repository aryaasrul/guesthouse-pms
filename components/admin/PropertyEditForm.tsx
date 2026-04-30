'use client'

import { useState, useRef } from 'react'
import type { Property } from '@/types/database'

const AMENITIES_OPTIONS = [
  { id: 'wifi',     label: 'WiFi' },
  { id: 'ac',       label: 'AC' },
  { id: 'dapur',    label: 'Dapur Lengkap' },
  { id: 'parkir',   label: 'Parkir Luas' },
  { id: 'smart_tv', label: 'Smart TV' },
  { id: 'cctv',     label: 'CCTV' },
  { id: 'air_panas',   label: 'Air Panas' },
  { id: 'kulkas',      label: 'Kulkas' },
  { id: 'mesin_cuci',  label: 'Mesin Cuci' },
  { id: 'kolam_renang',label: 'Kolam Renang' },
  { id: 'bbq',         label: 'Area BBQ' },
]

const inputStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '7px 10px',
  fontSize: 13, color: 'var(--text-1)', outline: 'none', width: '100%',
  fontFamily: 'var(--font-sans)',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 24,
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', margin: 0 }}>{title}</h2>
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '-10px 0 0' }} />
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  setTimeout(onDone, 2500)
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--text-1)', color: '#fff', borderRadius: 'var(--radius)',
      padding: '10px 18px', fontSize: 13, zIndex: 200,
      boxShadow: '0 4px 16px rgba(26,25,22,0.18)',
      animation: 'fadeIn 150ms ease',
    }}>
      {msg}
    </div>
  )
}

export default function PropertyEditForm({ property }: { property: Property }) {
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name:           property.name,
    description:    property.description ?? '',
    address:        property.address ?? '',
    bedroom_count:  String(property.bedroom_count ?? 2),
    bathroom_count: String(property.bathroom_count ?? 1),
    max_guests:     String(property.max_guests ?? 8),
    check_in_time:  property.check_in_time,
    check_out_time: property.check_out_time,
    amenities:      property.amenities ?? [],
    photos:         property.photos ?? [],
  })

  function upd(key: string, value: unknown) {
    setForm(p => ({ ...p, [key]: value }))
  }

  function toggleAmenity(id: string) {
    const next = form.amenities.includes(id)
      ? form.amenities.filter(a => a !== id)
      : [...form.amenities, id]
    upd('amenities', next)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/property/photos', { method: 'POST', body: fd })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Gagal upload')
      }
      const { url } = await res.json()
      upd('photos', [...form.photos, url])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal upload foto')
    } finally {
      setUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  function removePhoto(url: string) {
    upd('photos', form.photos.filter(p => p !== url))
  }

  function movePhoto(idx: number, dir: -1 | 1) {
    const arr = [...form.photos]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    upd('photos', arr)
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/property', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bedroom_count:  parseInt(form.bedroom_count),
          bathroom_count: parseInt(form.bathroom_count),
          max_guests:     parseInt(form.max_guests),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Gagal menyimpan')
      }
      setToast('Perubahan disimpan.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Info Dasar */}
      <Section title="Info Dasar">
        <Field label="Nama Properti">
          <input type="text" value={form.name} onChange={e => upd('name', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Alamat Lengkap">
          <input type="text" value={form.address} onChange={e => upd('address', e.target.value)}
            placeholder="Jl. Contoh No. 1, Ponorogo, Jawa Timur" style={inputStyle} />
        </Field>
        <Field label="Deskripsi Properti">
          <textarea
            value={form.description}
            onChange={e => upd('description', e.target.value)}
            rows={5}
            placeholder="Ceritakan tentang properti kamu — suasana, keunikan, cocok untuk siapa..."
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </Field>
      </Section>

      {/* Detail */}
      <Section title="Detail Properti">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Field label="Kamar Tidur">
            <input type="number" min={1} value={form.bedroom_count}
              onChange={e => upd('bedroom_count', e.target.value)}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
          </Field>
          <Field label="Kamar Mandi">
            <input type="number" min={1} value={form.bathroom_count}
              onChange={e => upd('bathroom_count', e.target.value)}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
          </Field>
          <Field label="Maks. Tamu">
            <input type="number" min={1} value={form.max_guests}
              onChange={e => upd('max_guests', e.target.value)}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Waktu Check-in">
            <input type="time" value={form.check_in_time}
              onChange={e => upd('check_in_time', e.target.value)}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
          </Field>
          <Field label="Waktu Check-out">
            <input type="time" value={form.check_out_time}
              onChange={e => upd('check_out_time', e.target.value)}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
          </Field>
        </div>
      </Section>

      {/* Fasilitas */}
      <Section title="Fasilitas">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {AMENITIES_OPTIONS.map(({ id, label }) => {
            const checked = form.amenities.includes(id)
            return (
              <label
                key={id}
                onClick={() => toggleAmenity(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 12px', borderRadius: 'var(--radius)',
                  border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                  background: checked ? 'var(--accent-light)' : '#fff',
                  cursor: 'pointer', fontSize: 13,
                  color: checked ? 'var(--accent)' : 'var(--text-2)',
                  fontWeight: checked ? 500 : 400,
                  transition: 'all 100ms',
                  userSelect: 'none',
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                  background: checked ? 'var(--accent)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth={2.2}>
                      <polyline points="9 2 4 8 1 5" />
                    </svg>
                  )}
                </div>
                {label}
              </label>
            )
          })}
        </div>
      </Section>

      {/* Foto */}
      <Section title="Foto Properti">
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
          Foto pertama akan menjadi foto utama. Drag urutan dengan tombol ← →.
        </p>

        {form.photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {form.photos.map((url, i) => (
              <div key={url} style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(26,25,22,0.55)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '4px 6px',
                }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0}
                      style={{ ...iconBtnSt, opacity: i === 0 ? 0.3 : 1 }}
                    >←</button>
                    <button
                      type="button" onClick={() => movePhoto(i, 1)} disabled={i === form.photos.length - 1}
                      style={{ ...iconBtnSt, opacity: i === form.photos.length - 1 ? 0.3 : 1 }}
                    >→</button>
                  </div>
                  <button type="button" onClick={() => removePhoto(url)} style={{ ...iconBtnSt, color: '#fca5a5' }}>
                    ✕
                  </button>
                </div>
                {i === 0 && (
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    background: 'var(--accent)', color: '#fff',
                    fontSize: 10, fontWeight: 600, padding: '2px 7px',
                    borderRadius: 'var(--radius-pill)',
                  }}>
                    Utama
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--radius)',
              border: '1.5px dashed var(--border)', background: uploadingPhoto ? 'var(--surface)' : '#fff',
              color: 'var(--text-2)', fontSize: 13, fontWeight: 500,
              cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {uploadingPhoto ? (
              <>
                <span style={{
                  display: 'inline-block', width: 12, height: 12,
                  border: '1.5px solid var(--text-3)', borderTopColor: 'transparent',
                  borderRadius: '50%', animation: 'spin 600ms linear infinite',
                }} />
                Mengupload...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Upload Foto
              </>
            )}
          </button>
        </div>
      </Section>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--status-occupied-fg)', margin: 0 }}>{error}</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button" onClick={handleSave} disabled={loading}
          style={{
            padding: '9px 20px', borderRadius: 'var(--radius)',
            border: 'none', background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

const iconBtnSt: React.CSSProperties = {
  background: 'transparent', border: 'none',
  color: '#fff', cursor: 'pointer', fontSize: 12,
  padding: '2px 5px', fontFamily: 'var(--font-sans)',
}
