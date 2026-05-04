'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Source {
  id: string
  platform: string
  ical_url: string
  is_active: boolean
  last_synced_at: string | null
  rooms: { room_number: string; room_type: string } | null
}

interface Log {
  id: string
  synced_at: string
  events_found: number
  events_inserted: number
  events_updated: number
  error: string | null
  ical_sources: { platform: string; rooms: { room_number: string } | null } | null
}

interface Room {
  id: string
  room_number: string
  room_type: string
}

interface Props {
  propertyId: string
  sources: Source[]
  logs: Log[]
  rooms: Room[]
}

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const styles: Record<string, { background: string; color: string }> = {
    available: { background: 'var(--status-available-bg)', color: 'var(--status-available-fg)' },
    cancelled: { background: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled-fg)' },
    occupied:  { background: 'var(--status-occupied-bg)',  color: 'var(--status-occupied-fg)' },
    airbnb:    { background: 'var(--airbnb-bg)',           color: 'var(--airbnb-fg)' },
    agoda:     { background: 'var(--agoda-bg)',            color: 'var(--agoda-fg)' },
    other:     { background: 'var(--surface)',             color: 'var(--text-2)' },
  }
  const s = styles[variant] ?? { background: 'var(--surface)', color: 'var(--text-2)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 'var(--radius-pill)',
      fontSize: 12, fontWeight: 500, lineHeight: '18px',
      whiteSpace: 'nowrap', ...s,
    }}>
      {children}
    </span>
  )
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: value ? 'var(--accent)' : 'var(--border)',
        position: 'relative', cursor: 'pointer',
        transition: 'background 150ms', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: value ? 19 : 3,
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff', transition: 'left 150ms',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  )
}

function MaskUrl({ url }: { url: string }) {
  const [visible, setVisible] = useState(false)
  const masked = url.length > 40
    ? url.slice(0, 32) + '···' + url.slice(-8)
    : url

  async function copyUrl() {
    try { await navigator.clipboard.writeText(url) } catch {}
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)',
        background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
        padding: '4px 8px', flex: 1, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {visible ? url : masked}
      </span>
      <button onClick={() => setVisible(!visible)} style={ghostBtnStyle}>
        {visible ? 'Sembunyikan' : 'Tampilkan'}
      </button>
      <button onClick={copyUrl} style={ghostBtnStyle}>Salin</button>
    </div>
  )
}

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '5px 10px', borderRadius: 'var(--radius)',
  border: '1px solid transparent', background: 'transparent',
  color: 'var(--text-2)', fontSize: 12, fontWeight: 500,
  cursor: 'pointer', whiteSpace: 'nowrap',
  fontFamily: 'var(--font-sans)',
}

interface SyncOutcome {
  events_found: number
  events_inserted: number
  events_updated: number
  error: string | null
}

function ChannelCard({ source, propertyId, onRefresh }: { source: Source; propertyId: string; onRefresh: () => void }) {
  const [active, setActive] = useState(source.is_active)
  const [syncing, setSyncing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(source.ical_url)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [lastOutcome, setLastOutcome] = useState<SyncOutcome | null>(null)

  const LOGO_COLORS: Record<string, string> = { airbnb: '#FF5A5F', agoda: '#003580' }
  const logoColor = LOGO_COLORS[source.platform] ?? '#888580'
  const platformLabel = source.platform.charAt(0).toUpperCase() + source.platform.slice(1)

  function formatDateTime(str: string) {
    return new Date(str).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  }

  async function handleSync() {
    setSyncing(true)
    setLastOutcome(null)
    try {
      const res = await fetch('/api/sync/ical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: source.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setLastOutcome({ events_found: 0, events_inserted: 0, events_updated: 0, error: data.error ?? `Server error ${res.status}` })
      } else {
        const outcome = data.summary?.[0] as SyncOutcome | undefined
        if (outcome) setLastOutcome(outcome)
      }
    } catch (e) {
      setLastOutcome({ events_found: 0, events_inserted: 0, events_updated: 0, error: e instanceof Error ? e.message : 'Gagal menghubungi server' })
    }
    setSyncing(false)
    onRefresh()
  }

  async function handleToggle(newValue: boolean) {
    setActive(newValue)
    const res = await fetch('/api/ical-sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: source.id, is_active: newValue }),
    })
    if (!res.ok) {
      setActive(!newValue)
    } else {
      onRefresh()
    }
  }

  async function saveUrl() {
    setUrlError(null)
    const res = await fetch('/api/ical-sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: source.id, ical_url: url }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setUrlError(d.error ?? 'Gagal menyimpan URL')
    } else {
      setEditing(false)
      onRefresh()
    }
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Platform logo */}
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius)',
          background: logoColor + '18',
          border: `1px solid ${logoColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: logoColor }}>
            {platformLabel.slice(0, 2).toUpperCase()}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{platformLabel}</span>
              <Badge variant={active ? 'available' : 'cancelled'}>{active ? 'Aktif' : 'Nonaktif'}</Badge>
            </div>
            <ToggleSwitch value={active} onChange={handleToggle} />
          </div>

          {/* Meta */}
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
            Kamar {source.rooms?.room_number} · {' '}
            {source.last_synced_at
              ? <>Terakhir sync: {formatDateTime(source.last_synced_at)}</>
              : 'Belum pernah sync'}
          </div>

          {/* iCal URL */}
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11, color: 'var(--text-3)', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6,
            }}>iCal URL</div>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={url}
                    onChange={e => { setUrl(e.target.value); setUrlError(null) }}
                    style={{
                      flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11,
                      border: `1px solid ${urlError ? 'var(--status-occupied-fg)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px', background: '#fff', color: 'var(--text-1)',
                      outline: 'none',
                    }}
                  />
                  <button onClick={saveUrl} style={{
                    padding: '5px 12px', borderRadius: 'var(--radius)',
                    border: 'none', background: 'var(--accent)', color: '#fff',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}>Simpan</button>
                  <button onClick={() => { setEditing(false); setUrlError(null) }} style={ghostBtnStyle}>Batal</button>
                </div>
                {urlError && (
                  <span style={{ fontSize: 11, color: 'var(--status-occupied-fg)' }}>{urlError}</span>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MaskUrl url={url} />
                <button onClick={() => setEditing(true)} style={{ ...ghostBtnStyle, flexShrink: 0 }}>Edit</button>
              </div>
            )}
          </div>

          {/* Sync button + result */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            {/* Outcome banner */}
            {lastOutcome && (
              <div style={{
                flex: 1, fontSize: 12, padding: '6px 10px',
                borderRadius: 'var(--radius)',
                background: lastOutcome.error ? 'var(--status-occupied-bg)' : 'var(--status-available-bg)',
                color: lastOutcome.error ? 'var(--status-occupied-fg)' : 'var(--status-available-fg)',
                border: `1px solid ${lastOutcome.error ? 'var(--cal-airbnb-border)' : 'var(--cal-direct-border)'}`,
              }}>
                {lastOutcome.error
                  ? `⚠ ${lastOutcome.error}`
                  : lastOutcome.events_found === 0
                  ? 'Selesai — tidak ada event di iCal (kalender mungkin kosong atau URL salah)'
                  : `✓ ${lastOutcome.events_found} event ditemukan · ${lastOutcome.events_inserted} ditambahkan · ${lastOutcome.events_updated} diperbarui`
                }
              </div>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-1)', fontSize: 12, fontWeight: 500,
                cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.7 : 1,
                fontFamily: 'var(--font-sans)', flexShrink: 0,
              }}
            >
              {syncing ? (
                <>
                  <span style={{
                    display: 'inline-block', width: 10, height: 10,
                    border: '1.5px solid var(--text-3)', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 600ms linear infinite',
                  }} />
                  Menyinkronkan...
                </>
              ) : 'Sync Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SyncManager({ propertyId, sources, logs, rooms }: Props) {
  const router = useRouter()
  const [addForm, setAddForm] = useState({ room_id: '', platform: 'airbnb', ical_url: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  function refresh() { router.refresh() }

  async function saveSource(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/ical-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm, property_id: propertyId }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Gagal menyimpan')
      return
    }
    setAddForm({ room_id: '', platform: 'airbnb', ical_url: '' })
    setShowAddForm(false)
    router.refresh()
  }

  const PLATFORM_LABEL: Record<string, string> = { airbnb: 'Airbnb', agoda: 'Agoda', other: 'Lainnya' }

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Channels */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Saluran Terhubung
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-1)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            + Tambah Saluran
          </button>
        </div>

        {sources.length === 0 && !showAddForm && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12, padding: '48px 24px',
            color: 'var(--text-3)', background: '#fff',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          }}>
            <p style={{ fontSize: 13 }}>Belum ada saluran iCal terhubung.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sources.map(src => (
            <ChannelCard key={src.id} source={src} propertyId={propertyId} onRefresh={refresh} />
          ))}
        </div>

        {/* Add source form */}
        {showAddForm && (
          <form onSubmit={saveSource} style={{
            marginTop: 12, background: '#fff', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 20,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>Tambah Saluran Baru</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Platform</label>
                <select
                  value={addForm.platform}
                  onChange={e => setAddForm(p => ({ ...p, platform: e.target.value }))}
                  style={{
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '7px 10px',
                    fontSize: 13, color: 'var(--text-1)', outline: 'none',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <option value="airbnb">Airbnb</option>
                  <option value="agoda">Agoda</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Kamar</label>
                <select
                  value={addForm.room_id}
                  onChange={e => setAddForm(p => ({ ...p, room_id: e.target.value }))}
                  required
                  style={{
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '7px 10px',
                    fontSize: 13, color: addForm.room_id ? 'var(--text-1)' : 'var(--text-3)',
                    outline: 'none', fontFamily: 'var(--font-sans)',
                  }}
                >
                  <option value="">Pilih kamar...</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.room_number} — {r.room_type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>iCal URL</label>
              <input
                type="url"
                placeholder="https://www.airbnb.com/calendar/ical/..."
                value={addForm.ical_url}
                onChange={e => setAddForm(p => ({ ...p, ical_url: e.target.value }))}
                required
                style={{
                  background: '#fff', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '7px 10px',
                  fontSize: 13, color: 'var(--text-1)', outline: 'none',
                  fontFamily: 'var(--font-mono)', width: '100%',
                }}
              />
            </div>
            {error && <p style={{ fontSize: 13, color: 'var(--status-occupied-fg)' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving} style={{
                padding: '7px 14px', borderRadius: 'var(--radius)',
                border: 'none', background: 'var(--accent)', color: '#fff',
                fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1, fontFamily: 'var(--font-sans)',
              }}>
                {saving ? 'Menyimpan...' : 'Simpan Saluran'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} style={ghostBtnStyle}>
                Batal
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sync log */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 14 }}>
          Riwayat Sinkronisasi
        </h2>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Saluran', 'Waktu', 'Ditemukan', 'Ditambahkan', 'Status / Error'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 14px',
                    textAlign: i === 2 || i === 3 ? 'center' : 'left',
                    fontSize: 11, fontWeight: 500, color: 'var(--text-3)',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px 14px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                    Belum ada log sinkronisasi. Coba klik &quot;Sync Sekarang&quot; di atas.
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => {
                  const platform = log.ical_sources?.platform ?? 'other'
                  const isEven = i % 2 === 0
                  return (
                    <tr key={log.id} style={{ background: isEven ? 'transparent' : 'rgba(242,240,236,0.5)' }}>
                      <td style={{ padding: '9px 14px' }}>
                        <Badge variant={platform}>{PLATFORM_LABEL[platform] ?? platform}</Badge>
                      </td>
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                        {new Date(log.synced_at).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>
                        {log.events_found}
                      </td>
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>
                        {log.events_inserted}
                      </td>
                      <td style={{ padding: '9px 14px', maxWidth: 320 }}>
                        {log.error ? (
                          <div>
                            <Badge variant="occupied">Error</Badge>
                            <div style={{
                              marginTop: 4, fontSize: 11, color: 'var(--status-occupied-fg)',
                              wordBreak: 'break-word', lineHeight: 1.4,
                            }}>
                              {log.error}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="available">Berhasil</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
