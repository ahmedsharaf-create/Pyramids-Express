import React from 'react'
import { Icon } from './ui.jsx'

export default function MediaViewer({ material, onClose }) {
  if (!material) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.97)', padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ position: 'relative', maxWidth: 960, width: '100%' }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: -44, right: 0,
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
        >
          Close Preview <Icon name="x" size={18} />
        </button>

        <div style={{
          background: '#0d0d0d', borderRadius: 20, overflow: 'hidden',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          minHeight: 200, maxHeight: '82vh',
        }}>
          {material.type === 'photo' && (
            <img src={material.url} alt={material.title}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          )}
          {material.type === 'video' && (
            <video src={material.url} controls autoPlay
              style={{ maxWidth: '100%', maxHeight: '75vh' }} />
          )}
          {material.type === 'pdf' && (
            <iframe src={material.url} title={material.title}
              style={{ width: '100%', height: '75vh', border: 'none' }} />
          )}
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 14,
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          {material.title}
        </p>
      </div>
    </div>
  )
}
