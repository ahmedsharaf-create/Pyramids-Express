import React, { useEffect } from 'react'

// ─── SVG Icon ─────────────────────────────────────────────────────────────────
const PATHS = {
  menu:       "M4 6h16M4 12h16M4 18h16",
  x:          "M18 6L6 18M6 6l12 12",
  moon:       "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  sun:        "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z",
  logout:     "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  settings:   "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
  award:      "M12 15a6 6 0 100-12 6 6 0 000 12zM8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  camera:     "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z",
  globe:      "M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20",
  briefcase:  "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
  heart:      "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  arrowLeft:  "M19 12H5M12 5l-7 7 7 7",
  chevRight:  "M9 18l6-6-6-6",
  eye:        "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  trash:      "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  userX:      "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 7a4 4 0 100 8 4 4 0 000-8zM20 8l-4 4m0-4l4 4",
  fileText:   "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  video:      "M23 7l-7 5 7 5V7zM1 5h15a2 2 0 012 2v10a2 2 0 01-2 2H1a2 2 0 01-2-2V7a2 2 0 012-2z",
  image:      "M21 19a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
  upload:     "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  check:      "M20 6L9 17l-5-5",
  barChart:   "M18 20V10M12 20V4M6 20v-6",
  rotate:     "M2.5 2v6h6M2.66 15.57a10 10 0 1010.95 2",
  linkedin:   "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z",
  mail:       "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6",
  mapPin:     "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
  key:        "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  plus:       "M12 5v14M5 12h14",
  edit:       "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  store:      "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10",
  users:      "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  warning:    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  archive:    "M21 8a2 2 0 00-2-2H5a2 2 0 00-2 2v2h18V8zM3 12v7a2 2 0 002 2h14a2 2 0 002-2v-7H3zM9 16h6",
  activity:   "M22 12h-4l-3 9L9 3l-3 9H2",
  calendar:   "M3 9h18M3 5h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2zM8 3v4M16 3v4",
  trendUp:    "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
}

export function Icon({ name, size = 20, className = '', style = {} }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}
    >
      <path d={PATHS[name] || ''} />
    </svg>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500)
    return () => clearTimeout(t)
  }, [onClose])
  const accent = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#f97316'
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: '#111', color: '#fff',
      borderLeft: `4px solid ${accent}`,
      padding: '14px 20px', borderRadius: 12, maxWidth: 340,
      fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.05em',
      fontSize: 13, fontWeight: 600, textTransform: 'uppercase',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'slideUp 0.3s ease',
    }}>
      {message}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ type = 'text', placeholder, value, onChange, required, dark, disabled }) {
  const base = {
    width: '100%', padding: '11px 14px',
    background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 10, color: dark ? '#fff' : '#111',
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
    fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
    outline: 'none', transition: 'border-color 0.2s',
    opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text',
  }
  return (
    <input
      type={type} placeholder={placeholder} value={value}
      onChange={onChange} required={required} disabled={disabled}
      style={base}
      onFocus={e => (e.target.style.borderColor = '#ef4444')}
      onBlur={e => (e.target.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}
    />
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ value, onChange, children, dark, disabled }) {
  return (
    <select
      value={value} onChange={onChange} disabled={disabled}
      style={{
        width: '100%', padding: '11px 14px',
        background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        borderRadius: 10, color: dark ? '#fff' : '#111',
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
        fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
        outline: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </select>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, type = 'button', color = 'red', full = false, disabled, small, style: extraStyle = {} }) {
  const bg = {
    red: '#ef4444', black: '#111', blue: '#3b82f6',
    green: '#22c55e', ghost: 'transparent', gray: '#555',
  }[color] || '#ef4444'
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      style={{
        width: full ? '100%' : 'auto',
        padding: small ? '7px 14px' : '12px 22px',
        background: disabled ? '#333' : bg,
        color: color === 'ghost' ? '#ef4444' : '#fff',
        border: color === 'ghost' ? '1px solid #ef4444' : 'none',
        borderRadius: 10,
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
        fontSize: small ? 11 : 13, letterSpacing: '0.15em', textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.2s, transform 0.1s',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        ...extraStyle,
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = '0.82')}
      onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = '1')}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => !disabled && (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
export function Card({ children, dark, style: extra = {} }) {
  return (
    <div style={{
      background: dark ? '#111' : '#fff',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
      borderRadius: 16, padding: 24,
      ...extra,
    }}>
      {children}
    </div>
  )
}
