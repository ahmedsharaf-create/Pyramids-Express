import React, { useState, useEffect } from 'react'
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth'
import { collection, onSnapshot } from 'firebase/firestore'
import { auth, db, APP_ID } from './firebase.js'
import { Icon, Btn, Toast } from './ui.jsx'
import AuthModal from './AuthModal.jsx'
import MediaViewer from './MediaViewer.jsx'
import AdminPage from './AdminPage.jsx'
import {
  HomePage, DashboardPage, MaterialsPage,
  HeroesPage, EventsPage, ActivitiesPage,
} from './Pages.jsx'

const ff = "'Barlow Condensed', sans-serif"

const INITIAL_STATE = {
  isLoggedIn: false, isAdmin: false, user: null,
  materials: {
    'orange-info': [], corporate: [], incentives: [],
    heroes: [], events: [], medical: [], activities: [],
  },
  users: [], shops: [], requests: [],
}

export default function App() {
  const [dark,     setDark]     = useState(false)
  const [page,     setPage]     = useState('home')
  const [authOpen, setAuthOpen] = useState(false)
  const [viewer,   setViewer]   = useState(null)
  const [toast,    setToast]    = useState(null)
  const [appState, setAppState] = useState(INITIAL_STATE)

  useEffect(() => {
    signInAnonymously(auth).catch(() => {})

    const unsubAuth = onAuthStateChanged(auth, user => {
      if (user?.email) {
        const isAdmin = user.email === 'admin@pyramidsexpress.com'
        setAppState(s => ({
          ...s, isLoggedIn: true, isAdmin,
          user: { uid: user.uid, email: user.email, name: isAdmin ? 'System Admin' : 'PE Agent' },
        }))
      } else {
        setAppState(s => ({ ...s, isLoggedIn: false, isAdmin: false, user: user ? { uid: user.uid } : null }))
      }
    })

    const unsubMat = onSnapshot(
      collection(db, 'artifacts', APP_ID, 'public', 'data', 'materials'),
      snap => {
        const m = {
          'orange-info': [], corporate: [], incentives: [],
          heroes: [], events: [], medical: [], activities: [],
        }
        snap.forEach(d => {
          const data = d.data()
          if (m[data.category]) m[data.category].push({ id: d.id, ...data })
        })
        setAppState(s => ({ ...s, materials: m }))
      }
    )

    const unsubUsers = onSnapshot(
      collection(db, 'artifacts', APP_ID, 'public', 'data', 'users'),
      snap => {
        const users = []; snap.forEach(d => users.push({ id: d.id, ...d.data() }))
        setAppState(s => ({ ...s, users }))
      }
    )

    const unsubShops = onSnapshot(
      collection(db, 'artifacts', APP_ID, 'public', 'data', 'shops'),
      snap => {
        const shops = []; snap.forEach(d => shops.push({ id: d.id, ...d.data() }))
        setAppState(s => ({ ...s, shops }))
      }
    )

    const unsubReqs = onSnapshot(
      collection(db, 'artifacts', APP_ID, 'public', 'data', 'requests'),
      snap => {
        const requests = []; snap.forEach(d => requests.push({ id: d.id, ...d.data() }))
        setAppState(s => ({ ...s, requests }))
      }
    )

    return () => { unsubAuth(); unsubMat(); unsubUsers(); unsubShops(); unsubReqs() }
  }, [])

  const handleLogout = async () => { await signOut(auth); setPage('home') }

  const bg     = dark ? '#0a0a0a' : '#fafafa'
  const text   = dark ? '#fff'    : '#111'
  const border = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'

  const authRequired = [
    'dashboard', 'admin',
    'orange-info', 'corporate', 'incentives', 'medical', 'activities',
  ]

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, transition: 'background 0.3s, color 0.3s' }}>

      {/* ─── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60,
        background: dark ? 'rgba(10,10,10,0.96)' : 'rgba(250,250,250,0.96)',
        backdropFilter: 'blur(14px)', borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Brand */}
          <button onClick={() => setPage('home')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: ff, fontWeight: 900, fontSize: 18, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: text,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 5, fontSize: 14 }}
              link rel="icon" type="image/svg+xml" href="/Logo.png" />
            </span>
            Pyramids Express
          </button>

          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <button onClick={() => setDark(!dark)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: text, opacity: 0.55, padding: 4 }}>
              <Icon name={dark ? 'sun' : 'moon'} size={18} />
            </button>

            <NavLink label="Home"      onClick={() => setPage('home')}      dark={dark} />
            {appState.isLoggedIn && <NavLink label="Dashboard" onClick={() => setPage('dashboard')} dark={dark} />}
            {appState.isLoggedIn && <NavLink label="Activities" onClick={() => setPage('activities')} dark={dark} active={page === 'activities'} />}

            {appState.isAdmin && (
              <button onClick={() => setPage('admin')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: ff, fontWeight: 800, fontSize: 12, letterSpacing: '0.15em',
                textTransform: 'uppercase', color: '#ef4444',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name="settings" size={14} /> Management
                {appState.requests.length > 0 && (
                  <span style={{
                    background: '#ef4444', color: '#fff', borderRadius: '50%',
                    width: 17, height: 17, fontSize: 9,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900,
                  }}>
                    {appState.requests.length}
                  </span>
                )}
              </button>
            )}

            {appState.isLoggedIn ? (
              <div style={{ borderLeft: `1px solid ${border}`, paddingLeft: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: ff, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', opacity: 0.45 }}>
                  {appState.user?.name}
                </span>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                  <Icon name="logout" size={18} />
                </button>
              </div>
            ) : (
              <Btn onClick={() => setAuthOpen(true)} color={dark ? 'red' : 'black'} small>Agent Login</Btn>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Main ── */}
      <main style={{ paddingTop: 60 }}>
        {/* Auth gate */}
        {authRequired.includes(page) && !appState.isLoggedIn ? (
          <div style={{ textAlign: 'center', padding: '120px 20px' }}>
            <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.4)', marginBottom: 20 }}>
              Please log in to access this page.
            </p>
            <Btn onClick={() => setAuthOpen(true)} color="red">Agent Login</Btn>
          </div>
        ) : (
          <>
            {page === 'home' && (
              <HomePage dark={dark} isLoggedIn={appState.isLoggedIn} onLogin={() => setAuthOpen(true)} onNavigate={setPage} />
            )}
            {page === 'dashboard' && (
              <DashboardPage dark={dark} onNavigate={setPage} />
            )}
            {page === 'admin' && appState.isAdmin && (
              <AdminPage dark={dark} state={appState} onView={setViewer} setToast={setToast} />
            )}
            {page === 'activities' && (
              <ActivitiesPage dark={dark} materials={appState.materials} onBack={() => setPage('dashboard')} onView={setViewer} />
            )}
            {['orange-info', 'corporate', 'incentives', 'medical'].includes(page) && (
              <MaterialsPage dark={dark} category={page} materials={appState.materials} onBack={() => setPage('dashboard')} onView={setViewer} />
            )}
            {page === 'heroes' && (
              <HeroesPage dark={dark} materials={appState.materials} onBack={() => setPage('home')} onView={setViewer} />
            )}
            {page === 'events' && (
              <EventsPage dark={dark} materials={appState.materials} onBack={() => setPage('home')} onView={setViewer} />
            )}
          </>
        )}
      </main>

      {/* ─── Footer ── */}
      <footer style={{ marginTop: 80, padding: '48px 20px', textAlign: 'center', borderTop: `1px solid ${border}`, background: dark ? '#050505' : '#f2f2f2' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 22 }}>
          {[
            { icon: 'linkedin', href: 'https://www.linkedin.com/company/pyramids-express-orange' },
            { icon: 'mail',     href: 'mailto:ahmedsharaf.pe@gmail.com' },
            { icon: 'mapPin',   href: 'https://www.google.com/maps/place/Al+Baramelgi' },
          ].map(l => (
            <a key={l.icon} href={l.href} target="_blank" rel="noreferrer"
              style={{ color: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}
            >
              <Icon name={l.icon} size={18} />
            </a>
          ))}
        </div>
        <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)', margin: 0 }}>
          © {new Date().getFullYear()} Pyramids Express Quality App
        </p>
      </footer>

      {authOpen && (
        <AuthModal dark={dark} shops={appState.shops} onClose={() => setAuthOpen(false)} onLoginSuccess={() => setPage('dashboard')} />
      )}
      {viewer && <MediaViewer material={viewer} onClose={() => setViewer(null)} />}
      {toast  && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function NavLink({ label, onClick, dark, active }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: ff, fontWeight: 700, fontSize: 12,
      letterSpacing: '0.15em', textTransform: 'uppercase',
      color: active ? '#ef4444' : (dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
      transition: 'color 0.2s',
    }}
      onMouseEnter={e => e.target.style.color = '#ef4444'}
      onMouseLeave={e => { if (!active) e.target.style.color = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
    >
      {label}
    </button>
  )
}
