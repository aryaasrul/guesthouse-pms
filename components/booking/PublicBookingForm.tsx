'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from '@/components/ui/DatePicker'

interface Props {
  roomId: string
  propertyId: string
  priceWeekday: number
  priceWeekend: number
  roomNumber: string
  capacity: number
  initialCheckIn?: string
  initialCheckOut?: string
}

type ViewState = 1 | 2 | 3 | 4

interface FormState {
  ktpFile: File | null
  name: string
  address: string
  phone: string
  checkIn: string
  checkOut: string
  adultCount: number
  childCount: number
  specialRequests: string
  sourceReferral: string
  agreedToTerms: boolean
  paymentProofFile: File | null
}

const SOURCE_OPTIONS = [
  'Google / Google Maps',
  'Instagram',
  'TikTok',
  'Referensi teman / keluarga',
  'Lainnya',
]

// Paste syarat dan ketentuan kamu di sini
const TERMS = `SYARAT DAN KETENTUAN GUESTHOUSE OF TERANG

[Syarat dan ketentuan akan diperbarui oleh pengelola]`

// ---- helpers ----

function calcNights(a: string, b: string): number {
  if (!a || !b) return 0
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000))
}

function calcTotal(a: string, b: string, wd: number, we: number): number {
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
  return 'Rp ' + n.toLocaleString('id-ID')
}

// ---- shared styles ----

const inputSt: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '8px 10px',
  fontSize: 13,
  color: 'var(--text-1)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
}

// ---- atoms ----

function Lbl({ text, required, hint }: { text: string; required?: boolean; hint?: string }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>
      {text}
      {required && <span style={{ color: 'var(--status-occupied-fg)', marginLeft: 3 }}>*</span>}
      {hint && <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: 4 }}>{hint}</span>}
    </label>
  )
}

function Field({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
}

function FileZone({ label, accept, file, onFile, required, hint }: {
  label: string; accept: string; file: File | null
  onFile: (f: File) => void; required?: boolean; hint?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    onFile(f)
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <Lbl text={label} required={required} />
      <input ref={ref} type="file" accept={accept} onChange={onChange} style={{ display: 'none' }} />
      <div
        onClick={() => ref.current?.click()}
        style={{
          border: `1.5px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: preview ? 8 : '18px 16px',
          cursor: 'pointer',
          background: file ? 'var(--accent-light)' : 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          transition: 'border-color 120ms',
        }}
      >
        {preview ? (
          <img src={preview} alt="preview" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 4, objectFit: 'cover' }} />
        ) : file ? (
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, textAlign: 'center', wordBreak: 'break-all' }}>
            {file.name}
          </span>
        ) : (
          <>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--text-3)" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Klik untuk pilih file</span>
          </>
        )}
      </div>
      {hint && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
    </div>
  )
}

function Counter({ value, onChange, min = 0 }: { value: number; onChange: (n: number) => void; min?: number }) {
  const btn = (active: boolean): React.CSSProperties => ({
    width: 28, height: 28, borderRadius: '50%',
    border: '1px solid var(--border)',
    background: active ? '#fff' : 'var(--surface)',
    cursor: active ? 'pointer' : 'default',
    fontSize: 16, color: active ? 'var(--text-1)' : 'var(--text-3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
  })
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      padding: '5px 12px',
    }}>
      <button type="button" style={btn(value > min)} onClick={() => value > min && onChange(value - 1)}>−</button>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, minWidth: 20, textAlign: 'center', color: 'var(--text-1)' }}>
        {value}
      </span>
      <button type="button" style={btn(true)} onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}

function StepBar({ current }: { current: number }) {
  const labels = ['Data Diri', 'Menginap', 'Ketentuan', 'Bayar']
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {[1, 2, 3, 4].map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : undefined }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600,
              background: s <= current ? 'var(--accent)' : 'var(--surface)',
              color: s <= current ? '#fff' : 'var(--text-3)',
              border: `1.5px solid ${s <= current ? 'var(--accent)' : 'var(--border)'}`,
            }}>
              {s < current ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth={2.5}>
                  <polyline points="10 3 5 9 2 6" />
                </svg>
              ) : s}
            </div>
            <span style={{
              fontSize: 10, whiteSpace: 'nowrap', fontWeight: s === current ? 600 : 400,
              color: s <= current ? 'var(--accent)' : 'var(--text-3)',
            }}>
              {labels[i]}
            </span>
          </div>
          {i < 3 && (
            <div style={{
              flex: 1, height: 1.5, margin: '0 4px', marginBottom: 18,
              background: s < current ? 'var(--accent)' : 'var(--border)',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ---- step content ----

function Step1({ form, upd }: { form: FormState; upd: (k: keyof FormState, v: any) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FileZone
        label="Foto KTP" accept="image/*"
        file={form.ktpFile} onFile={f => upd('ktpFile', f)}
        required hint="Format JPG/PNG · maks. 5MB"
      />
      <Field>
        <Lbl text="Nama Lengkap" required />
        <input style={inputSt} type="text" value={form.name}
          onChange={e => upd('name', e.target.value)} placeholder="Sesuai KTP" />
      </Field>
      <Field>
        <Lbl text="Alamat Lengkap (sesuai KTP)" required />
        <textarea style={{ ...inputSt, resize: 'vertical', minHeight: 80 }}
          value={form.address} onChange={e => upd('address', e.target.value)}
          placeholder="Jl. Contoh No. 1, RT/RW, Kelurahan, Kota, Provinsi" />
      </Field>
      <Field>
        <Lbl text="No. WhatsApp" required />
        <input style={inputSt} type="tel" value={form.phone}
          onChange={e => upd('phone', e.target.value)} placeholder="08xxxxxxxxxx" />
      </Field>
    </div>
  )
}

function Step2({ form, upd, nights, total }: {
  form: FormState; upd: (k: keyof FormState, v: any) => void; nights: number; total: number
}) {
  const today = new Date().toISOString().split('T')[0]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field>
          <Lbl text="Tgl Check-in" required />
          <DatePicker value={form.checkIn} onChange={v => upd('checkIn', v)} min={today} placeholder="Pilih tanggal" />
        </Field>
        <Field>
          <Lbl text="Tgl Check-out" required />
          <DatePicker value={form.checkOut} onChange={v => upd('checkOut', v)} min={form.checkIn || today} placeholder="Pilih tanggal" />
        </Field>
      </div>

      {nights > 0 && (
        <div style={{
          padding: '10px 14px', background: 'var(--accent-light)',
          borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{nights} malam</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>
            {fmt(total)}
          </span>
        </div>
      )}

      <Field>
        <Lbl text="Jumlah Tamu Dewasa" required />
        <Counter value={form.adultCount} onChange={v => upd('adultCount', v)} min={1} />
      </Field>

      <Field>
        <Lbl text="Jumlah Tamu Anak-anak" />
        <Counter value={form.childCount} onChange={v => upd('childCount', v)} min={0} />
      </Field>

      <Field>
        <Lbl text="Permintaan Khusus" hint="(opsional)" />
        <textarea style={{ ...inputSt, resize: 'vertical', minHeight: 72 }}
          value={form.specialRequests} onChange={e => upd('specialRequests', e.target.value)}
          placeholder="Contoh: extra bed, lantai tertentu, alergi, dll." />
      </Field>

      <Field>
        <Lbl text="Mengetahui Guesthouse of Terang dari mana?" required />
        <div style={{ position: 'relative' }}>
          <select
            style={{ ...inputSt, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: 32 }}
            value={form.sourceReferral} onChange={e => upd('sourceReferral', e.target.value)}
          >
            <option value="">Pilih salah satu...</option>
            {SOURCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </Field>
    </div>
  )
}

function Step3({ form, upd }: { form: FormState; upd: (k: keyof FormState, v: any) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '14px 16px', maxHeight: 300, overflowY: 'auto',
        background: 'var(--surface)',
        fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8,
        whiteSpace: 'pre-wrap',
      }}>
        {TERMS}
      </div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
        <input
          type="checkbox" checked={form.agreedToTerms}
          onChange={e => upd('agreedToTerms', e.target.checked)}
          style={{ marginTop: 2, accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0 }}
        />
        <span style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6 }}>
          Saya telah membaca dan menyetujui syarat dan ketentuan di atas
        </span>
      </label>
    </div>
  )
}

function PayInfoRow({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <span style={{
        fontSize: 14, fontWeight: 500,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        color: accent ? 'var(--accent)' : 'var(--text-1)',
        letterSpacing: mono ? '0.06em' : undefined,
      }}>{value}</span>
    </div>
  )
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 600 : 400, color: bold ? 'var(--accent)' : 'var(--text-1)' }}>
        {value}
      </span>
    </div>
  )
}

function Step4({ form, upd, total, dp, roomNumber, nights }: {
  form: FormState; upd: (k: keyof FormState, v: any) => void
  total: number; dp: number; roomNumber: string; nights: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Ringkasan */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius)', padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
          Ringkasan Pesanan
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <SummaryRow label={`Kamar ${roomNumber}`} value={`${nights} malam`} />
          <SummaryRow label="Total biaya menginap" value={fmt(total)} />
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 2 }}>
            <SummaryRow label="DP yang harus dibayar (50%)" value={fmt(dp)} bold />
          </div>
        </div>
      </div>

      {/* Instruksi pembayaran */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ background: 'var(--accent)', padding: '10px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            Instruksi Pembayaran
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
            Transfer DP ke rekening berikut
          </div>
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PayInfoRow label="Bank" value="BCA" />
          <PayInfoRow label="No. Rekening" value="3151379441" mono />
          <PayInfoRow label="Atas Nama" value="Syafira Firdausy" />
          <PayInfoRow label="Nominal DP (50%)" value={fmt(dp)} accent />
        </div>
      </div>

      {/* Upload bukti */}
      <FileZone
        label="Upload Bukti Transfer"
        accept="image/*,application/pdf"
        file={form.paymentProofFile} onFile={f => upd('paymentProofFile', f)}
        required hint="Format JPG/PNG/PDF · maks. 10MB"
      />
    </div>
  )
}

// ---- main component ----

export default function PublicBookingForm({
  roomId, propertyId, priceWeekday, priceWeekend, roomNumber, capacity,
  initialCheckIn = '', initialCheckOut = '',
}: Props) {
  const router = useRouter()
  const [view, setView] = useState<ViewState>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    ktpFile: null, name: '', address: '', phone: '',
    checkIn: initialCheckIn, checkOut: initialCheckOut,
    adultCount: 1, childCount: 0,
    specialRequests: '', sourceReferral: '',
    agreedToTerms: false, paymentProofFile: null,
  })

  function upd(key: keyof FormState, value: any) {
    setForm(p => ({ ...p, [key]: value }))
  }

  const nights = calcNights(form.checkIn, form.checkOut)
  const total = calcTotal(form.checkIn, form.checkOut, priceWeekday, priceWeekend)
  const dp = Math.ceil(total / 2)

  function validate(s: number): string | null {
    if (s === 1) {
      if (!form.ktpFile) return 'Foto KTP wajib diupload'
      if (!form.name.trim()) return 'Nama lengkap wajib diisi'
      if (!form.address.trim()) return 'Alamat lengkap wajib diisi'
      if (!form.phone.trim()) return 'No. WhatsApp wajib diisi'
    }
    if (s === 2) {
      if (!form.checkIn) return 'Tanggal check-in wajib diisi'
      if (!form.checkOut) return 'Tanggal check-out wajib diisi'
      if (nights <= 0) return 'Tanggal check-out harus setelah check-in'
      if (!form.sourceReferral) return 'Mohon pilih dari mana kamu mengetahui kami'
    }
    if (s === 3) {
      if (!form.agreedToTerms) return 'Kamu harus menyetujui syarat dan ketentuan'
    }
    if (s === 4) {
      if (!form.paymentProofFile) return 'Bukti transfer wajib diupload'
    }
    return null
  }

  function next() {
    const err = validate(view as number)
    if (err) { setError(err); return }
    setError(null)
    setView(v => ((v as number) + 1) as ViewState)
  }

  function back() {
    setError(null)
    setView(v => ((v as number) - 1) as ViewState)
  }

  async function uploadFile(file: File, prefix: string): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('prefix', prefix)
    const res = await fetch('/api/public/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error ?? 'Gagal mengupload file. Coba lagi.')
    }
    const { url } = await res.json()
    return url
  }

  async function submit() {
    const err = validate(4)
    if (err) { setError(err); return }
    setLoading(true)
    setError(null)
    try {
      const [ktpUrl, proofUrl] = await Promise.all([
        uploadFile(form.ktpFile!, 'ktp'),
        uploadFile(form.paymentProofFile!, 'bukti'),
      ])
      const res = await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId, roomId,
          guestName: form.name,
          guestPhone: form.phone,
          guestAddress: form.address,
          ktpPhotoUrl: ktpUrl,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          adultCount: form.adultCount,
          childCount: form.childCount,
          specialRequests: form.specialRequests || null,
          sourceReferral: form.sourceReferral,
          paymentProofUrl: proofUrl,
          totalPrice: total,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Terjadi kesalahan. Coba lagi.')
      }
      const booking = await res.json()
      router.push(`/pesan/konfirmasi/${booking.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const step = view as number

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      <StepBar current={step} />

      {step === 1 && <Step1 form={form} upd={upd} />}
      {step === 2 && <Step2 form={form} upd={upd} nights={nights} total={total} />}
      {step === 3 && <Step3 form={form} upd={upd} />}
      {step === 4 && <Step4 form={form} upd={upd} total={total} dp={dp} roomNumber={roomNumber} nights={nights} />}

      {error && (
        <div style={{
          marginTop: 14, padding: '10px 14px',
          background: 'var(--status-occupied-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--status-occupied-fg)',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        {step > 1 && (
          <button type="button" onClick={back} style={{
            padding: '9px 16px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', background: '#fff',
            color: 'var(--text-2)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}>
            Kembali
          </button>
        )}
        {step < 4 ? (
          <button type="button" onClick={next} style={{
            flex: 1, padding: '9px', borderRadius: 'var(--radius)',
            border: 'none', background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}>
            Lanjut →
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={loading} style={{
            flex: 1, padding: '9px', borderRadius: 'var(--radius)',
            border: 'none', background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontFamily: 'var(--font-sans)',
          }}>
            {loading ? 'Mengirim...' : 'Kirim Pesanan'}
          </button>
        )}
      </div>
    </div>
  )
}
