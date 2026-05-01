'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Beranda',
    exact: true,
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/admin/kalender',
    label: 'Kalender',
    exact: false,
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    href: '/admin/booking',
    label: 'Pemesanan',
    exact: false,
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    href: '/admin/booking/baru',
    label: 'Buat Pesanan',
    exact: true,
    icon: 'M12 4v16m8-8H4',
  },
  {
    href: '/admin/kamar',
    label: 'Paket Sewa',
    exact: false,
    icon: 'M3 12l9-9 9 9M4 10v10a1 1 0 001 1h5v-6h4v6h5a1 1 0 001-1V10',
  },
  {
    href: '/admin/tamu',
    label: 'Tamu',
    exact: false,
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    href: '/admin/sinkronisasi',
    label: 'Sinkronisasi',
    exact: false,
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  },
  {
    href: '/admin/properti',
    label: 'Properti',
    exact: false,
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
]

function NavIcon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? 'var(--accent)' : 'var(--text-3)'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`admin-sidebar${open ? ' admin-sidebar-open' : ''}`}
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
      }}
    >
      {/* Property branding */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Guesthouse <span style={{ fontStyle: 'italic', fontWeight: 400 }}>of</span> Terang
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>Ponorogo, Jawa Timur</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="admin-sidebar-close"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 4, color: 'var(--text-3)', display: 'none',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--border-subtle)' }} />

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: '8px 10px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && !(item.href === '/admin/booking' && pathname === '/admin/booking/baru')
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 10px',
                borderRadius: 'var(--radius)',
                color: active ? 'var(--accent)' : 'var(--text-2)',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                background: active ? 'var(--accent-light)' : 'transparent',
                transition: 'background 100ms ease, color 100ms ease',
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--surface)'
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <NavIcon d={item.icon} active={active} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ height: 1, background: 'var(--border-subtle)' }} />

      {/* User footer */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          GT
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>Admin</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Pemilik</div>
        </div>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            title="Keluar"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--text-3)',
              display: 'flex',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  )
}
