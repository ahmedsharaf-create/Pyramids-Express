import React from 'react'
import { Icon, Btn } from './ui.jsx'

// ─── Shared styles ────────────────────────────────────────────────────────────
const ff = "'Barlow Condensed', sans-serif"

const emptyBox = (dark, text) => (
  <div style={{
    padding: '80px 20px', textAlign: 'center',
    border: `2px dashed ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: 20, gridColumn: '1 / -1',
    fontFamily: ff, fontWeight: 700, fontSize: 12,
    letterSpacing: '0.2em', textTransform: 'uppercase',
    color: 'rgba(128,128,128,0.35)',
  }}>{text}</div>
)

// ─── Home Page ────────────────────────────────────────────────────────────────
export function HomePage({ dark, isLoggedIn, onLogin, onNavigate }) {
  return (
    <div style={{ animation: 'fadeUp 0.5s ease' }}>
      <div style={{
        position: 'relative', height: 580, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.28)' }}
          alt="Team"
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(0,0,0,0.55) 0%,rgba(239,68,68,0.28) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 20px', maxWidth: 800 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)', padding: '6px 18px',
            borderRadius: 6, fontFamily: ff, fontWeight: 700, fontSize: 11,
            letterSpacing: '0.25em', textTransform: 'uppercase', color: '#fff', marginBottom: 18,
          }}>
            Partner Orange Egypt
          </div>
          <h1 style={{
            fontFamily: ff, fontWeight: 900,
            fontSize: 'clamp(52px, 11vw, 100px)',
            color: '#fff', textTransform: 'uppercase',
            letterSpacing: '-0.02em', lineHeight: 0.88,
            margin: '0 0 18px',
          }}>
            One <span style={{ color: '#ef4444' }}>Team</span><br />
            One <span style={{ color: '#ef4444' }}>Goal</span>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.65)', fontFamily: ff, fontWeight: 400,
            fontSize: 18, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 40,
          }}>
            Reliability &amp; Excellence
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            <Btn onClick={() => onNavigate('heroes')} color="black">
              <Icon name="award" size={16} /> Pyramids Heroes
            </Btn>
            <Btn onClick={() => onNavigate('events')} color="black">
              <Icon name="camera" size={16} /> Pyramids Events
            </Btn>
            {!isLoggedIn && (
              <Btn onClick={onLogin} color="red">
                Agent Portal
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export function DashboardPage({ dark, onNavigate }) {
  const cards = [
    { id: 'medical',    title: 'Medical Insurance', sub: 'Omega Care Network', icon: 'heart' },
    { id: 'orange-info', title: 'Orange Info',      sub: 'Sales & Tariffs',    icon: 'globe' },
    { id: 'corporate',  title: 'Corporate Materials', sub: 'Solutions',        icon: 'briefcase' },
    { id: 'incentives', title: 'Incentives',         sub: 'Rewards & Recognition', icon: 'award' },
  ]
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px', animation: 'fadeUp 0.4s ease' }}>
      <div style={{
        marginBottom: 48, paddingBottom: 32,
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      }}>
        <h2 style={{ fontFamily: ff, fontWeight: 900, fontSize: 40, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, color: dark ? '#fff' : '#111' }}>
          Agent Dashboard
        </h2>
        <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ef4444', marginTop: 6 }}>
          Authorized Access Only
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
        {cards.map(c => (
          <div
            key={c.id} onClick={() => onNavigate(c.id)}
            style={{
              padding: '32px 28px',
              background: dark ? '#111' : '#fff',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#ef4444'
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(239,68,68,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
              e.currentTarget.style.transform = ''
              e.currentTarget.style.boxShadow = ''
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: dark ? 'rgba(239,68,68,0.12)' : 'rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, color: dark ? '#ef4444' : '#111',
            }}>
              <Icon name={c.icon} size={26} />
            </div>
            <h3 style={{ fontFamily: ff, fontWeight: 900, fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 4px', color: dark ? '#fff' : '#111' }}>
              {c.title}
            </h3>
            <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#ef4444', margin: '0 0 22px' }}>
              {c.sub}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: ff, fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
              View Portal <Icon name="chevRight" size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Materials Page ───────────────────────────────────────────────────────────
export function MaterialsPage({ dark, category, materials, onBack, onView }) {
  const items = materials[category] || []
  const label = category.replace(/-/g, ' ')
  const isMedical = category === 'medical'

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 20px', animation: 'fadeUp 0.4s ease' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: ff, fontWeight: 700, fontSize: 12, letterSpacing: '0.15em',
        textTransform: 'uppercase', color: '#ef4444', marginBottom: 32,
      }}>
        <Icon name="arrowLeft" size={16} /> Back to Dashboard
      </button>

      <h1 style={{ fontFamily: ff, fontWeight: 900, fontSize: 40, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 40px', color: dark ? '#fff' : '#111' }}>
        {label} <span style={{ color: '#ef4444' }}>Portal</span>
      </h1>

      {isMedical && (
        <div style={{
          marginBottom: 40, borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
          paddingBottom: '56.25%', position: 'relative', height: 0,
        }}>
          <iframe
            src="https://lookerstudio.google.com/embed/reporting/01d55067-0527-435e-9e17-5a692003f0b0/page/N7h0D"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {items.map(item => (
          <div
            key={item.id} onClick={() => onView(item)}
            style={{
              padding: '20px 24px',
              background: dark ? '#111' : '#fff',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              borderRadius: 14, display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.14)'; e.currentTarget.style.borderColor = dark ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}
          >
            <div>
              <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: dark ? '#fff' : '#111' }}>
                {item.title}
              </p>
              <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.6)', margin: '4px 0 0' }}>
                Preview Data
              </p>
            </div>
            <div style={{ color: '#ef4444' }}>
              <Icon name={item.type === 'pdf' ? 'fileText' : item.type === 'video' ? 'video' : 'image'} size={20} />
            </div>
          </div>
        ))}
        {items.length === 0 && emptyBox(dark, 'No materials uploaded yet')}
      </div>
    </div>
  )
}

// ─── Heroes Page ──────────────────────────────────────────────────────────────
export function HeroesPage({ dark, materials, onBack, onView }) {
  const items = materials['heroes'] || []
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px', animation: 'fadeUp 0.4s ease' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: ff, fontWeight: 700, fontSize: 12, letterSpacing: '0.15em',
        textTransform: 'uppercase', color: '#ef4444', marginBottom: 32,
      }}>
        <Icon name="arrowLeft" size={16} /> Back Home
      </button>
      <div style={{
        marginBottom: 48, paddingBottom: 28,
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      }}>
        <h1 style={{ fontFamily: ff, fontWeight: 900, fontSize: 40, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, color: dark ? '#fff' : '#111' }}>
          Pyramids <span style={{ color: '#ef4444' }}>Heroes</span>
        </h1>
        <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.55)', marginTop: 8 }}>
          Recognizing Excellence &amp; Achievement
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 28 }}>
        {items.map(item => (
          <div key={item.id} onClick={() => onView(item)} style={{ cursor: 'pointer' }}>
            <div
              style={{
                aspectRatio: '210/297', background: dark ? '#111' : '#f4f4f4',
                borderRadius: 16, overflow: 'hidden', marginBottom: 12,
                border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                transition: 'box-shadow 0.25s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.22)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
            >
              <img src={item.url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 14, textTransform: 'uppercase', color: dark ? '#fff' : '#111', margin: 0 }}>{item.title}</p>
            <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.45)', marginTop: 4 }}>Achiever Profile</p>
          </div>
        ))}
        {items.length === 0 && emptyBox(dark, 'No heroes announced yet')}
      </div>
    </div>
  )
}

// ─── Events Page ──────────────────────────────────────────────────────────────
export function EventsPage({ dark, materials, onBack, onView }) {
  const items = materials['events'] || []
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 20px', animation: 'fadeUp 0.4s ease' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: ff, fontWeight: 700, fontSize: 12, letterSpacing: '0.15em',
        textTransform: 'uppercase', color: '#ef4444', marginBottom: 32,
      }}>
        <Icon name="arrowLeft" size={16} /> Back Home
      </button>
      <div style={{
        marginBottom: 48, paddingBottom: 28,
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      }}>
        <h1 style={{ fontFamily: ff, fontWeight: 900, fontSize: 40, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, color: dark ? '#fff' : '#111' }}>
          Pyramids <span style={{ color: '#ef4444' }}>Events</span>
        </h1>
        <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.55)', marginTop: 8 }}>
          Captured Moments &amp; Memories
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {items.map(item => (
          <div
            key={item.id} onClick={() => onView(item)}
            style={{
              position: 'relative', aspectRatio: '16/9', borderRadius: 20,
              overflow: 'hidden', cursor: 'pointer',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
            }}
          >
            <img
              src={item.url} alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
              onMouseLeave={e => e.target.style.transform = ''}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top,rgba(0,0,0,0.78) 0%,transparent 60%)',
              display: 'flex', alignItems: 'flex-end', padding: 20,
            }}>
              <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', margin: 0 }}>
                {item.title}
              </p>
            </div>
          </div>
        ))}
        {items.length === 0 && emptyBox(dark, 'No events captured yet')}
      </div>
    </div>
  )
}
