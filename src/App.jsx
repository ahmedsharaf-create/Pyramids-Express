import React, { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  UserPlus
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
    plus: UserPlus
  }
  const Component = icons[name] || X
  return <Component size={size} {...props} />
}

const Btn = ({ children, onClick, color = 'red', small, disabled, type = 'button', ...props }) => {
  const bg = color === 'red' ? '#ef4444' : (color === 'black' ? '#111' : '#eee')
  const text = color === 'red' || color === 'black' ? '#fff' : '#111'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg, color: text, border: 'none', cursor: 'pointer',
        padding: small ? '6px 14px' : '10px 24px',
        borderRadius: 8, fontFamily: ff, fontWeight: 700, fontSize: small ? 12 : 14,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, transition: 'opacity 0.2s', opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = 0.8)}
      onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = 1)}
      {...props}
    >
      {children}
    </button>
  )
}

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: type === 'error' ? '#ef4444' : '#111', color: '#fff',
      padding: '12px 24px', borderRadius: 12, zIndex: 1000, fontFamily: ff, fontWeight: 600,
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    }}>
      {msg}
    </div>
  )
}

// ─── Feature Components ───

const AuthModal = ({ dark, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      if (isRegistering) {
        // Create Auth User
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        // Create Firestore Profile for Admin Panel tracking
        await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', res.user.uid), {
          email: email,
          createdAt: new Date().toISOString(),
          role: 'agent'
        });
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
      onLoginSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') setErr('This email is already registered.');
      else if (error.code === 'auth/weak-password') setErr('Password should be at least 6 characters.');
      else setErr('Invalid credentials. Please check and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: dark ? '#111' : '#fff', padding: 32, borderRadius: 20, width: '100%', maxWidth: 400, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: ff, fontSize: 24, fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
            {isRegistering ? 'Create Account' : 'Agent Portal'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#fff' : '#111' }}><Icon name="x" /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(128,128,128,0.2)', background: dark ? '#1a1a1a' : '#fff', color: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>Password</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(128,128,128,0.2)', background: dark ? '#1a1a1a' : '#fff', color: 'inherit' }} />
          </div>
          
          {err && <p style={{ color: '#ef4444', fontSize: 13, margin: 0, fontWeight: 600 }}>{err}</p>}
          
          <Btn type="submit" disabled={loading}>
            {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Sign In')}
          </Btn>

          <button 
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setErr(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13, fontWeight: 700, fontFamily: ff, textTransform: 'uppercase', marginTop: 8 }}
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </form>
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

    const unsubReqs = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'requests'), snap => {
      const requests = []; snap.forEach(d => requests.push({ id: d.id, ...d.data() })); setAppState(s => ({ ...s, requests }))
    })

    return () => { unsubAuth(); unsubMat(); unsubUsers(); unsubReqs() }
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

      {authOpen && <AuthModal dark={dark} onClose={() => setAuthOpen(false)} onLoginSuccess={() => navigate('dashboard')} />}
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
