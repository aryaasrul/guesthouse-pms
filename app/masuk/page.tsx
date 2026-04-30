'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fff',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  padding: '8px 10px', fontSize: 13, color: 'var(--text-1)',
  outline: 'none', fontFamily: 'var(--font-sans)',
}

export default function MasukPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email atau password salah.')
      setLoading(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', width: '100%', maxWidth: 360,
        padding: '32px 28px', boxShadow: '0 1px 8px rgba(26,25,22,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Guesthouse of Terang
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Masuk ke panel admin</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required placeholder="admin@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              required style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--status-occupied-fg)', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '9px',
              borderRadius: 'var(--radius)', border: 'none',
              background: 'var(--accent)', color: '#fff',
              fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, marginTop: 4,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
