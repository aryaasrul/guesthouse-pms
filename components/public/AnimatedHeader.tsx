'use client'

import { useEffect, useState, type ReactNode } from 'react'

export default function AnimatedHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`public-header${scrolled ? ' scrolled' : ''}`}
      style={{
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'var(--border-subtle)'}`,
        padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10,
      }}
    >
      {children}
    </header>
  )
}
