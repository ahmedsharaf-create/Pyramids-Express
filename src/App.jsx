import React, { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import { 
  getFirestore, 
  collection, 
  onSnapshot,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore'
import { 
  Moon, 
  Sun, 
  LogOut, 
  Settings, 
  Linkedin, 
  Mail, 
  MapPin, 
  ChevronLeft, 
  ExternalLink,
  X,
  User,
  Lock,
  UserPlus,
  Key
} from 'lucide-react'

// ─── Firebase Configuration ───
const firebaseConfig = {
  apiKey: "AIzaSyD-1puhqN-3YUCx4PU2d0_Umb06g6Kacco",
  authDomain: "pyramids-express-52a27.firebaseapp.com",
  projectId: "pyramids-express-52a27",
  storageBucket: "pyramids-express-52a27.firebasestorage.app",
  messagingSenderId: "806262842725",
  appId: "1:806262842725:web:97e8c0493d7b5d4a1bad8c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'pyramids-express-52a27';

// Set persistence explicitly
setPersistence(auth, browserLocalPersistence).catch(console.error);

const ff = "'Barlow Condensed', sans-serif"

// ─── UI Components ───

const Icon = ({ name, size = 18, ...props }) => {
  const icons = {
    moon: Moon, sun: Sun, logout: LogOut, settings: Settings,
    linkedin: Linkedin, mail: Mail, mapPin: MapPin, 
    back: ChevronLeft, link: ExternalLink, x: X, user: User, lock: Lock,
    plus: UserPlus, key: Key
  }
  const Component = icons[name] || X
  return <Component size={size} {...props} />
}

const Input = ({ dark, ...props }) => (
  <input
    {...props}
    style={{
      width: '100%',
      padding: '12px 16px',
      borderRadius: 10,
      border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      color: dark ? '#fff' : '#111',
      fontFamily: ff,
      fontWeight: 600,
      fontSize: 14,
      outline: 'none',
      ...props.style
    }}
  />
)

const Btn = ({ children, onClick, color = 'red', small, disabled, type = 'button', full, ...props }) => {
  const bg = color === 'red' ? '#ef4444' : (color === 'black' ? '#111' : '#eee')
  const text = color === 'red' || color === 'black' ? '#fff' : '#111'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg, color: text, border: 'none', cursor: 'pointer',
        padding: small ? '6px 14px' : '12px 24px',
        borderRadius: 10, fontFamily: ff, fontWeight: 700, fontSize: small ? 12 : 14,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, transition: 'opacity 0.2s', opacity: disabled ? 0.5 : 1,
        width: full ? '100%' : 'auto'
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = 0.8)}
      onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = 1)}
      {...props}
    >
      {children}
    </button>
  )
}

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  const bg = type === 'error' ? '#ef4444' : (type === 'success' ? '#22c55e' : '#111')
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: bg, color: '#fff',
      padding: '14px 28px', borderRadius: 14, zIndex: 1000, fontFamily: ff, fontWeight: 700,
      fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase',
      boxShadow: '0 12px 40px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 10
    }}>
      {type === 'error' && <Icon name="x" size={16} />}
      {message}
    </div>
  )
}

// ─── Feature Components ───

const AuthModal = ({ dark, onClose, onLoginSuccess, shops }) => {
  const [view, setView] = useState('login') // login | signup | forgot
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // login fields
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')

  // signup fields
  const [sName, setSName] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPass, setSPass] = useState('')
  const [sArea, setSArea] = useState('')
  const [sShop, setSShop] = useState('')

  // forgot fields
  const [fEmail, setFEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  // derive unique managers from shops list
  const managers = [...new Set(shops.map(s => s.areaManager))].sort()
  const shopsForArea = sArea
    ? shops.filter(s => s.areaManager === sArea).map(s => s.shopName).sort()
    : []

  // ── Login ──
  const handleLogin = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, pass)
      onLoginSuccess()
      onClose()
    } catch (err) {
      setToast({ message: 'Login failed: ' + err.message, type: 'error' })
    } finally { setLoading(false) }
  }

  // ── Signup (stores pending request in Firestore) ──
  const handleSignup = async e => {
    e.preventDefault()
    if (!sArea || !sShop) {
      return setToast({ message: 'Please select area manager and shop', type: 'error' })
    }
    setLoading(true)
    try {
      const id = Date.now().toString()
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'requests', id), {
        id, agentName: sName, email: sEmail, password: sPass,
        areaManager: sArea, shopName: sShop,
        status: 'pending', createdAt: new Date().toISOString(),
      })
      setToast({ message: 'Application submitted! Await admin approval.', type: 'success' })
      setTimeout(() => { setView('login'); resetSignup() }, 2500)
    } catch (err) {
      setToast({ message: 'Submission failed: ' + err.message, type: 'error' })
    } finally { setLoading(false) }
  }

  const resetSignup = () => {
    setSName(''); setSEmail(''); setSPass(''); setSArea(''); setSShop('')
  }

  // ── Forgot password ──
  const handleForgot = async e => {
    e.preventDefault()
    if (!fEmail) return setToast({ message: 'Enter your email address', type: 'error' })
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, fEmail)
      setResetSent(true)
    } catch (err) {
      setToast({ message: 'Error: ' + err.message, type: 'error' })
    } finally { setLoading(false) }
  }

  // Styles from provided code
  const card = {
    background: dark ? '#111' : '#fff',
    borderRadius: 20,
    padding: '36px 32px',
    width: '100%', maxWidth: 400,
    position: 'relative',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
  }
  const textLink = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: ff, fontWeight: 700,
    fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
  }
  const heading = {
    fontFamily: ff, fontWeight: 900,
    fontSize: 22, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: dark ? '#fff' : '#111', margin: 0,
  }
  const sub = {
    fontFamily: ff, fontSize: 11,
    letterSpacing: '0.2em', textTransform: 'uppercase',
    color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    margin: '4px 0 0',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)', padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={card}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', cursor: 'pointer',
          color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'
        }}>
          <Icon name="x" size={18} />
        </button>

        {/* ═══ LOGIN ═══ */}
        {view === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 48, height: 48, background: '#ef4444', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px', color: '#fff',
                fontFamily: ff, fontWeight: 900, fontSize: 20,
              }}>PE</div>
              <h2 style={heading}>Agent Portal</h2>
              <p style={sub}>Authorize your session</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input type="email" placeholder="Email Address" value={email}
                onChange={e => setEmail(e.target.value)} required dark={dark} />
              <Input type="password" placeholder="Password" value={pass}
                onChange={e => setPass(e.target.value)} required dark={dark} />
              <Btn type="submit" color="black" full disabled={loading}>
                {loading ? 'Verifying…' : 'Authorize Session'}
              </Btn>
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
              <button type="button" onClick={() => setView('forgot')}
                style={{ ...textLink, color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="key" size={13} /> Forgot Password?
              </button>
              <button type="button" onClick={() => setView('signup')}
                style={{ ...textLink, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>
                New Agent? Apply for Access
              </button>
            </div>
          </form>
        )}

        {/* ═══ FORGOT PASSWORD ═══ */}
        {view === 'forgot' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 48, height: 48, background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px', color: '#ef4444',
              }}>
                <Icon name="key" size={24} />
              </div>
              <h2 style={heading}>Reset Password</h2>
              <p style={sub}>We'll send a secure link to your email</p>
            </div>

            {!resetSent ? (
              <form onSubmit={handleForgot}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Input type="email" placeholder="Your Registered Email" value={fEmail}
                    onChange={e => setFEmail(e.target.value)} required dark={dark} />
                  <Btn type="submit" color="red" full disabled={loading}>
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </Btn>
                </div>
              </form>
            ) : (
              <div style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 14, padding: '24px 20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✉️</div>
                <p style={{
                  fontFamily: ff, fontWeight: 800,
                  fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#22c55e', margin: '0 0 8px',
                }}>Check Your Inbox</p>
                <p style={{
                  fontFamily: ff, fontSize: 12,
                  color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  lineHeight: 1.5,
                }}>
                  A password reset link was sent to{' '}
                  <strong style={{ color: dark ? '#fff' : '#111' }}>{fEmail}</strong>
                  <br />Check your spam folder if you don't see it.
                </p>
              </div>
            )}

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button type="button" onClick={() => { setView('login'); setResetSent(false); setFEmail('') }}
                style={{ ...textLink, color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                ← Back to Login
              </button>
            </div>
          </div>
        )}

        {/* ═══ SIGNUP ═══ */}
        {view === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <h2 style={heading}>Agent Application</h2>
              <p style={sub}>Request account activation</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input placeholder="Full Name" value={sName}
                onChange={e => setSName(e.target.value)} required dark={dark} />
              <Input type="email" placeholder="Email Address" value={sEmail}
                onChange={e => setSEmail(e.target.value)} required dark={dark} />
              <Input type="password" placeholder="Set Password" value={sPass}
                onChange={e => setSPass(e.target.value)} required dark={dark} />

              <select
                value={sArea}
                onChange={e => { setSArea(e.target.value); setSShop('') }}
                required
                style={{
                  width: '100%', padding: '11px 14px',
                  background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: 10, color: dark ? '#fff' : '#111',
                  fontFamily: ff, fontWeight: 600,
                  fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', outline: 'none',
                }}
              >
                <option value="">SELECT AREA MANAGER</option>
                {managers.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <select
                value={sShop}
                onChange={e => setSShop(e.target.value)}
                disabled={!sArea}
                required
                style={{
                  width: '100%', padding: '11px 14px',
                  background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: 10, color: dark ? '#fff' : '#111',
                  fontFamily: ff, fontWeight: 600,
                  fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', outline: 'none',
                  opacity: !sArea ? 0.5 : 1,
                }}
              >
                <option value="">SELECT SHOP</option>
                {shopsForArea.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <Btn type="submit" color="red" full disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Application'}
              </Btn>
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button type="button" onClick={() => setView('login')}
                style={{ ...textLink, color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                Already registered? Login
              </button>
            </div>
          </form>
        )}

        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  )
}

const MediaViewer = ({ material, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={32} /></button>
    <div style={{ maxWidth: '90%', maxHeight: '90%' }}>
      {material.type === 'image' ? <img src={material.url} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} alt="" /> : <p style={{ color: '#fff' }}>Preview not available for this type.</p>}
    </div>
  </div>
)

// ─── Pages ───

const HomePage = ({ dark, isLoggedIn, onLogin, onNavigate }) => (
  <div style={{ padding: '80px 20px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
    <h1 style={{ fontFamily: ff, fontSize: 'clamp(48px, 8vw, 84px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 20 }}>
      Excellence in <span style={{ color: '#ef4444' }}>Pyramids</span> Logistics
    </h1>
    <p style={{ maxWidth: 600, margin: '0 auto 40px', fontSize: 18, opacity: 0.7 }}>The centralized hub for Pyramids Express quality materials, resources, and agent tools.</p>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
      {isLoggedIn ? <Btn onClick={() => onNavigate('dashboard')}>Access Dashboard</Btn> : <Btn onClick={onLogin}>Agent Login</Btn>}
      <Btn onClick={() => onNavigate('heroes')} color="light">Public Gallery</Btn>
    </div>
  </div>
)

const DashboardPage = ({ onNavigate }) => (
  <div style={{ padding: '40px 20px', maxWidth: 1000, margin: '0 auto' }}>
    <h2 style={{ fontFamily: ff, fontSize: 32, fontWeight: 900, textTransform: 'uppercase' }}>Agent Dashboard</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 32 }}>
      {['orange-info', 'corporate', 'incentives', 'medical', 'activities'].map(cat => (
        <div key={cat} onClick={() => onNavigate(cat)} style={{ padding: 32, borderRadius: 20, background: 'rgba(128,128,128,0.05)', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          <h3 style={{ textTransform: 'uppercase', fontFamily: ff, margin: 0 }}>{cat.replace('-', ' ')}</h3>
          <p style={{ opacity: 0.5, fontSize: 14, marginTop: 8 }}>View latest documentation and materials</p>
        </div>
      ))}
    </div>
  </div>
)

const AdminPage = ({ state }) => (
  <div style={{ padding: 40 }}>
    <h2 style={{ fontFamily: ff, fontSize: 32, fontWeight: 900 }}>MANAGEMENT PORTAL</h2>
    <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
      <div style={{ padding: 24, background: 'rgba(128,128,128,0.05)', borderRadius: 16 }}>
        <p style={{ fontSize: 12, opacity: 0.5, textTransform: 'uppercase', fontWeight: 800 }}>Registered Agents</p>
        <p style={{ fontSize: 48, fontWeight: 900, margin: 0 }}>{state.users.length}</p>
      </div>
      <div style={{ padding: 24, background: 'rgba(128,128,128,0.05)', borderRadius: 16 }}>
        <p style={{ fontSize: 12, opacity: 0.5, textTransform: 'uppercase', fontWeight: 800 }}>Pending Requests</p>
        <p style={{ fontSize: 48, fontWeight: 900, margin: 0, color: state.requests.length > 0 ? '#ef4444' : 'inherit' }}>{state.requests.length}</p>
      </div>
    </div>
  </div>
)

const MaterialsPage = ({ category, materials, onBack }) => (
  <div style={{ padding: 40 }}>
    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', fontFamily: ff, marginBottom: 20 }}><Icon name="back" /> Back</button>
    <h2 style={{ fontFamily: ff, fontSize: 32, fontWeight: 900, textTransform: 'uppercase' }}>{category.replace('-', ' ')}</h2>
    <div style={{ marginTop: 24 }}>{materials[category]?.length === 0 ? <p>No materials found in this category.</p> : <div style={{ display: 'grid', gap: 16 }}>{materials[category]?.map(m => <div key={m.id} style={{ padding: 20, border: '1px solid rgba(128,128,128,0.1)', borderRadius: 12 }}>{m.title}</div>)}</div>}</div>
  </div>
)

const HeroesPage = ({ onBack }) => <div style={{ padding: 40 }}><Btn onClick={onBack}>Back Home</Btn><h1>Heroes Gallery</h1></div>
const EventsPage = ({ onBack }) => <div style={{ padding: 40 }}><Btn onClick={onBack}>Back Home</Btn><h1>Events Gallery</h1></div>
const ActivitiesPage = ({ onBack }) => <div style={{ padding: 40 }}><Btn onClick={onBack}>Back Home</Btn><h1>Activities</h1></div>

// ─── Main App ───

const AUTH_REQUIRED = ['dashboard', 'admin', 'orange-info', 'corporate', 'incentives', 'medical', 'activities']
const PRIVATE_PAGES = AUTH_REQUIRED
const INITIAL_STATE = {
  isLoggedIn: false, isAdmin: false, user: null,
  materials: { 'orange-info': [], corporate: [], incentives: [], heroes: [], events: [], medical: [], activities: [], },
  users: [], shops: [], requests: [],
}

function AuthSplash({ dark }) {
  const bg   = dark ? '#0a0a0a' : '#fafafa'
  const text = dark ? '#fff'    : '#111'
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: ff, fontWeight: 900, fontSize: 22, letterSpacing: '0.15em', textTransform: 'uppercase', color: text }}>
        <span style={{ background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 16 }}>PE</span> Pyramids Express
      </div>
      <div style={{ width: 200, height: 3, background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#ef4444,#f97316)', animation: 'progressPulse 1.6s ease-in-out infinite' }} />
      </div>
      <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', margin: 0 }}>Restoring session…</p>
      <style>{`@keyframes progressPulse { 0% { width: 0%; margin-left: 0; } 50% { width: 65%; margin-left: 0; } 100% { width: 0%; margin-left: 100%; } }`}</style>
    </div>
  )
}

export default function App() {
  const [dark,      setDark]      = useState(() => localStorage.getItem('pe_dark') === 'true')
  const [authReady, setAuthReady] = useState(false)
  const [page,      setPage]      = useState('home')
  const [authOpen,  setAuthOpen]  = useState(false)
  const [viewer,    setViewer]    = useState(null)
  const [toast,     setToast]     = useState(null)
  const [appState,  setAppState]  = useState(INITIAL_STATE)

  const toggleDark = () => {
    setDark(d => { localStorage.setItem('pe_dark', String(!d)); return !d })
  }

  const navigate = (p) => {
    setPage(p)
    if (PRIVATE_PAGES.includes(p)) { localStorage.setItem('pe_last_page', p) } 
    else { localStorage.removeItem('pe_last_page') }
  }

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
          return;
        } catch (e) { console.error("Anon auth fail", e); }
      }

      if (user?.email) {
        const isAdmin    = user.email === 'admin@pyramidsexpress.com'
        const savedPage  = localStorage.getItem('pe_last_page')
        const targetPage = savedPage || 'dashboard'

        setAppState(s => ({
          ...s, isLoggedIn: true, isAdmin,
          user: { uid: user.uid, email: user.email, name: isAdmin ? 'System Admin' : 'PE Agent' },
        }))
        setPage(targetPage)
      } else if (user) {
        setAppState(s => ({ ...s, isLoggedIn: false, isAdmin: false, user: { uid: user.uid } }))
        setPage(prev => (prev === 'home' || PRIVATE_PAGES.includes(prev)) ? 'home' : prev)
      }
      setAuthReady(true)
    })

    const unsubMat = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'materials'), snap => {
      const m = { 'orange-info': [], corporate: [], incentives: [], heroes: [], events: [], medical: [], activities: [], }
      snap.forEach(d => { const data = d.data(); if (m[data.category]) m[data.category].push({ id: d.id, ...data }) })
      setAppState(s => ({ ...s, materials: m }))
    })

    const unsubUsers = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'users'), snap => {
      const users = []; snap.forEach(d => users.push({ id: d.id, ...d.data() })); setAppState(s => ({ ...s, users }))
    })

    const unsubShops = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'shops'), snap => {
      const shops = []; snap.forEach(d => shops.push({ id: d.id, ...d.data() })); setAppState(s => ({ ...s, shops }))
    })

    const unsubReqs = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'requests'), snap => {
      const requests = []; snap.forEach(d => requests.push({ id: d.id, ...d.data() })); setAppState(s => ({ ...s, requests }))
    })

    return () => { unsubAuth(); unsubMat(); unsubUsers(); unsubShops(); unsubReqs() }
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem('pe_last_page')
    await signOut(auth)
  }

  if (!authReady) return <AuthSplash dark={dark} />

  const bg     = dark ? '#0a0a0a' : '#fafafa'
  const text   = dark ? '#fff'    : '#111'
  const border = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, transition: 'background 0.3s, color 0.3s' }}>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, background: dark ? 'rgba(10,10,10,0.96)' : 'rgba(250,250,250,0.96)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff, fontWeight: 900, fontSize: 18, letterSpacing: '0.15em', textTransform: 'uppercase', color: text, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 5, fontSize: 14 }}>PE</span> Pyramids Express
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <button onClick={toggleDark} style={{ background: 'none', border: 'none', cursor: 'pointer', color: text, opacity: 0.55, padding: 4 }}><Icon name={dark ? 'sun' : 'moon'} /></button>
            <NavLink label="Home" onClick={() => navigate('home')} active={page === 'home'} dark={dark} />
            {appState.isLoggedIn && <NavLink label="Dashboard" onClick={() => navigate('dashboard')} active={page === 'dashboard'} dark={dark} />}
            {appState.isAdmin && (
              <button onClick={() => navigate('admin')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="settings" size={14} /> Admin {appState.requests.length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{appState.requests.length}</span>}
              </button>
            )}
            {appState.isLoggedIn ? (
              <div style={{ borderLeft: `1px solid ${border}`, paddingLeft: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: ff, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', opacity: 0.45 }}>{appState.user?.name}</span>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Icon name="logout" /></button>
              </div>
            ) : <Btn onClick={() => setAuthOpen(true)} color={dark ? 'red' : 'black'} small>Agent Login</Btn>}
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: 60 }}>
        {AUTH_REQUIRED.includes(page) && !appState.isLoggedIn ? (
          <div style={{ textAlign: 'center', padding: '120px 20px' }}>
            <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(128,128,128,0.4)', marginBottom: 20 }}>Please log in to access this page.</p>
            <Btn onClick={() => setAuthOpen(true)} color="red">Agent Login</Btn>
          </div>
        ) : (
          <>
            {page === 'home' && <HomePage dark={dark} isLoggedIn={appState.isLoggedIn} onLogin={() => setAuthOpen(true)} onNavigate={navigate} />}
            {page === 'dashboard' && <DashboardPage onNavigate={navigate} />}
            {page === 'admin' && appState.isAdmin && <AdminPage state={appState} />}
            {['orange-info', 'corporate', 'incentives', 'medical', 'activities'].includes(page) && <MaterialsPage category={page} materials={appState.materials} onBack={() => navigate('dashboard')} />}
            {page === 'heroes' && <HeroesPage onBack={() => navigate('home')} />}
            {page === 'events' && <EventsPage onBack={() => navigate('home')} />}
            {page === 'activities' && <ActivitiesPage onBack={() => navigate('dashboard')} />}
          </>
        )}
      </main>

      <footer style={{ marginTop: 80, padding: '48px 20px', textAlign: 'center', borderTop: `1px solid ${border}`, background: dark ? '#050505' : '#f2f2f2' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 22 }}>
          {[{ icon: 'linkedin', href: 'https://linkedin.com' }, { icon: 'mail', href: 'mailto:info@pyramidsexpress.com' }, { icon: 'mapPin', href: '#' }].map(l => (
            <a key={l.icon} href={l.href} style={{ color: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}><Icon name={l.icon} /></a>
          ))}
        </div>
        <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)' }}>© {new Date().getFullYear()} Pyramids Express Quality App</p>
      </footer>

      {authOpen && <AuthModal dark={dark} shops={appState.shops} onClose={() => setAuthOpen(false)} onLoginSuccess={() => navigate('dashboard')} />}
      {viewer && <MediaViewer material={viewer} onClose={() => setViewer(null)} />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function NavLink({ label, onClick, active, dark }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff, fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: active ? '#ef4444' : (dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'), transition: 'color 0.2s' }}>{label}</button>
  )
}
