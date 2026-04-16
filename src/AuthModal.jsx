import React, { useState } from 'react'
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db, APP_ID, authErrorMessage } from './firebase.js'
import { Icon, Input, Select, Btn, Toast } from './ui.jsx'

const ff = "'Barlow Condensed', sans-serif"

// ── Password strength indicator ───────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null
  const score = (() => {
    let s = 0
    if (password.length >= 6)            s++
    if (password.length >= 10)           s++
    if (/[A-Z]/.test(password))          s++
    if (/[0-9]/.test(password))          s++
    if (/[^A-Za-z0-9]/.test(password))   s++
    return s
  })()
  const labels = ['Too Short','Weak','Fair','Good','Strong','Very Strong']
  const colors = ['#ef4444','#ef4444','#f97316','#eab308','#22c55e','#16a34a']
  return (
    <div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= score ? colors[score] : 'rgba(128,128,128,0.15)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: colors[score], margin: 0 }}>
        {labels[score]}
      </p>
    </div>
  )
}

// ── Inline styled select (matches app style) ──────────────────────────────────
function ModalSelect({ value, onChange, disabled, children, dark }) {
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      className="pe-select"
      style={{
        width: '100%', padding: '11px 14px',
        background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        borderRadius: 10, color: dark ? '#fff' : '#111',
        fontFamily: ff, fontWeight: 600, fontSize: 12, letterSpacing: '0.1em',
        outline: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'border-color 0.2s',
      }}
    >
      {children}
    </select>
  )
}

// ─── Main AuthModal ───────────────────────────────────────────────────────────
export default function AuthModal({ dark, onClose, onLoginSuccess, shops }) {
  // view: 'login' | 'signup' | 'pending' | 'forgot'
  const [view,      setView]      = useState('login')
  const [loading,   setLoading]   = useState(false)
  const [toast,     setToast]     = useState(null)

  // Login
  const [email,      setEmail]      = useState(() => localStorage.getItem('pe_remembered_email') || '')
  const [pass,       setPass]       = useState('')
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('pe_remembered_email'))

  // Signup
  const [sName,  setSName]  = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPass,  setSPass]  = useState('')
  const [sPass2, setSPass2] = useState('')
  const [sArea,  setSArea]  = useState('')
  const [sShop,  setSShop]  = useState('')

  // Forgot
  const [fEmail,    setFEmail]    = useState('')
  const [resetSent, setResetSent] = useState(false)

  // Derived shop data
  const managers = [...new Set(
    shops.filter(s => !s.isPlaceholder).map(s => s.areaManager)
  )].sort()
  const shopsForArea = sArea
    ? shops.filter(s => s.areaManager === sArea && !s.isPlaceholder).map(s => s.shopName).sort()
    : []

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault()
    const trimEmail = email.trim().toLowerCase()
    if (!trimEmail || !pass) return
    setLoading(true)
    try {
      // Set persistence BEFORE signing in based on the Remember Me choice:
      // - Checked  → browserLocalPersistence  (survives tab close & browser restart)
      // - Unchecked → browserSessionPersistence (cleared when tab/browser closes)
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)

      await signInWithEmailAndPassword(auth, trimEmail, pass)

      // Save or clear the remembered email
      if (rememberMe) {
        localStorage.setItem('pe_remembered_email', trimEmail)
      } else {
        localStorage.removeItem('pe_remembered_email')
      }

      onLoginSuccess()
      onClose()
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setToast({ message: 'Account not found. If you applied recently, your account may still be pending admin approval.', type: 'error' })
      } else {
        setToast({ message: authErrorMessage(err), type: 'error' })
      }
    } finally { setLoading(false) }
  }

  // ── SIGNUP ─────────────────────────────────────────────────────────────────
  const handleSignup = async e => {
    e.preventDefault()
    // Validate
    if (!sName.trim())                    return setToast({ message: 'Please enter your full name.', type: 'error' })
    if (!sEmail.trim())                   return setToast({ message: 'Please enter your email address.', type: 'error' })
    if (!/\S+@\S+\.\S+/.test(sEmail))     return setToast({ message: 'Please enter a valid email address.', type: 'error' })
    if (sPass.length < 6)                 return setToast({ message: 'Password must be at least 6 characters.', type: 'error' })
    if (sPass !== sPass2)                 return setToast({ message: 'Passwords do not match.', type: 'error' })
    if (!sArea)                           return setToast({ message: 'Please select your area manager.', type: 'error' })
    if (!sShop)                           return setToast({ message: 'Please select your shop.', type: 'error' })

    setLoading(true)
    try {
      const id = `req_${Date.now()}`
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'requests', id), {
        id,
        agentName:    sName.trim(),
        email:        sEmail.trim().toLowerCase(),
        passwordHint: sPass,          // Used once by admin on approval, then deleted
        areaManager:  sArea,
        shopName:     sShop,
        status:       'pending',
        createdAt:    new Date().toISOString(),
      })
      // Switch to the pending screen
      setView('pending')
    } catch (err) {
      setToast({ message: 'Submission failed. Please check your connection and try again.', type: 'error' })
      console.error(err)
    } finally { setLoading(false) }
  }

  // ── FORGOT PASSWORD ────────────────────────────────────────────────────────
  const handleForgot = async e => {
    e.preventDefault()
    const trimmed = fEmail.trim().toLowerCase()
    if (!trimmed)                      return setToast({ message: 'Please enter your email address.', type: 'error' })
    if (!/\S+@\S+\.\S+/.test(trimmed)) return setToast({ message: 'Please enter a valid email address.', type: 'error' })
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, trimmed)
      setResetSent(true)
    } catch (err) {
      // Always show success to prevent user enumeration attacks
      if (err.code === 'auth/user-not-found') {
        setResetSent(true)
      } else {
        setToast({ message: authErrorMessage(err), type: 'error' })
      }
    } finally { setLoading(false) }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const card = {
    background: dark ? '#111' : '#fff',
    borderRadius: 20, padding: '36px 32px',
    width: '100%', maxWidth: 420, position: 'relative',
    boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
    maxHeight: '92vh', overflowY: 'auto',
  }
  const h2style = { fontFamily: ff, fontWeight: 900, fontSize: 22, letterSpacing: '0.1em', textTransform: 'uppercase', color: dark ? '#fff' : '#111', margin: 0 }
  const sub     = { fontFamily: ff, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', margin: '4px 0 0' }
  const link    = { background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff, fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={card}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)', padding: 4 }}>
          <Icon name="x" size={18} />
        </button>

        {/* ═══ LOGIN ═══════════════════════════════════════════════════════════ */}
        {view === 'login' && (
          <form onSubmit={handleLogin} noValidate>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 48, height: 48, background: '#ef4444', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#fff', fontFamily: ff, fontWeight: 900, fontSize: 20 }}>PE</div>
              <h2 style={h2style}>Agent Portal</h2>
              <p style={sub}>Authorize your session</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input type="email" placeholder="Email Address" value={email}
                onChange={e => setEmail(e.target.value)} required dark={dark} />
              <Input type="password" placeholder="Password" value={pass}
                onChange={e => setPass(e.target.value)} required dark={dark} />

              {/* Remember Me */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', userSelect: 'none',
                padding: '2px 0',
              }}>
                <div
                  onClick={() => setRememberMe(v => !v)}
                  style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${rememberMe ? '#ef4444' : (dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')}`,
                    background: rememberMe ? '#ef4444' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s',
                    cursor: 'pointer',
                  }}
                >
                  {rememberMe && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span
                  onClick={() => setRememberMe(v => !v)}
                  style={{
                    fontFamily: ff, fontWeight: 700, fontSize: 11,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
                  }}
                >
                  Remember me on this device
                </span>
              </label>

              <Btn type="submit" color="black" full disabled={loading || !email || !pass}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Btn>
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
              <button type="button" onClick={() => setView('forgot')}
                style={{ ...link, color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="key" size={13} /> Forgot Password?
              </button>
              <button type="button" onClick={() => { setView('signup'); setSName(''); setSEmail(''); setSPass(''); setSPass2(''); setSArea(''); setSShop('') }}
                style={{ ...link, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>
                New Agent? Apply for Access
              </button>
            </div>
          </form>
        )}

        {/* ═══ PENDING APPROVAL ═══════════════════════════════════════════════ */}
        {view === 'pending' && (
          <div style={{ textAlign: 'center' }}>
            {/* Animated waiting icon */}
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Icon name="bell" size={32} style={{ color: '#f97316' }} />
            </div>
            <h2 style={{ ...h2style, marginBottom: 8 }}>Application Submitted!</h2>
            <p style={{ fontFamily: ff, fontSize: 12, letterSpacing: '0.08em', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', lineHeight: 1.7, margin: '0 0 24px' }}>
              Your application has been received. Please wait while an admin reviews and approves your account.
            </p>

            {/* Status steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: 28 }}>
              {[
                { step: '1', label: 'Application submitted', done: true },
                { step: '2', label: 'Pending admin approval', done: false, active: true },
                { step: '3', label: 'Account activated — you can sign in', done: false },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: s.done ? '#22c55e' : s.active ? 'rgba(249,115,22,0.15)' : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                    border: s.active ? '2px solid #f97316' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {s.done
                      ? <Icon name="check" size={14} style={{ color: '#fff' }} />
                      : <span style={{ fontFamily: ff, fontWeight: 900, fontSize: 11, color: s.active ? '#f97316' : 'rgba(128,128,128,0.4)' }}>{s.step}</span>
                    }
                  </div>
                  <span style={{ fontFamily: ff, fontWeight: s.active ? 800 : 600, fontSize: 12, letterSpacing: '0.08em', color: s.done ? '#22c55e' : s.active ? (dark ? '#fff' : '#111') : 'rgba(128,128,128,0.5)' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ background: dark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
              <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 11, color: '#f97316', margin: 0, lineHeight: 1.6 }}>
                Once approved, you'll be able to sign in with your email and the password you set. Wait 24h to be Approuved or contact your area manager to confirm approval.
              </p>
            </div>

            <button type="button" onClick={() => setView('login')}
              style={{ ...link, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* ═══ FORGOT PASSWORD ═══════════════════════════════════════════════ */}
        {view === 'forgot' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#ef4444' }}>
                <Icon name="key" size={24} />
              </div>
              <h2 style={h2style}>Reset Password</h2>
              <p style={sub}>We'll send a secure link to your email</p>
            </div>
            {!resetSent ? (
              <form onSubmit={handleForgot} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Input type="email" placeholder="Your Registered Email" value={fEmail}
                    onChange={e => setFEmail(e.target.value)} required dark={dark} />
                  <Btn type="submit" color="red" full disabled={loading || !fEmail}>
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </Btn>
                </div>
              </form>
            ) : (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 14, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✉️</div>
                <p style={{ fontFamily: ff, fontWeight: 800, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22c55e', margin: '0 0 10px' }}>Check Your Inbox</p>
                <p style={{ fontFamily: ff, fontSize: 12, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', lineHeight: 1.6, margin: 0 }}>
                  If <strong style={{ color: dark ? '#fff' : '#111' }}>{fEmail.trim()}</strong> is registered, a reset link was sent. Check your spam folder too.
                </p>
              </div>
            )}
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button type="button" onClick={() => { setView('login'); setResetSent(false); setFEmail('') }}
                style={{ ...link, color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                ← Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* ═══ SIGNUP ════════════════════════════════════════════════════════ */}
        {view === 'signup' && (
          <form onSubmit={handleSignup} noValidate>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <h2 style={h2style}>Agent Application</h2>
              <p style={sub}>Request account access</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input placeholder="Full Name" value={sName}
                onChange={e => setSName(e.target.value)} required dark={dark} />
              <Input type="email" placeholder="Email Address" value={sEmail}
                onChange={e => setSEmail(e.target.value)} required dark={dark} />
              <Input type="password" placeholder="Set Password (min 6 chars)" value={sPass}
                onChange={e => setSPass(e.target.value)} required dark={dark} />
              <PasswordStrength password={sPass} />
              <Input type="password" placeholder="Confirm Password" value={sPass2}
                onChange={e => setSPass2(e.target.value)} required dark={dark} />
              {sPass2 && sPass !== sPass2 && (
                <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ef4444', margin: 0 }}>
                  Passwords do not match
                </p>
              )}
              {sPass2 && sPass === sPass2 && sPass.length >= 6 && (
                <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22c55e', margin: 0 }}>
                  ✓ Passwords match
                </p>
              )}
              <ModalSelect value={sArea} onChange={e => { setSArea(e.target.value); setSShop('') }} dark={dark}>
                <option value="">SELECT AREA MANAGER</option>
                {managers.map(m => <option key={m} value={m}>{m}</option>)}
              </ModalSelect>
              <ModalSelect value={sShop} onChange={e => setSShop(e.target.value)} disabled={!sArea} dark={dark}>
                <option value="">SELECT SHOP</option>
                {shopsForArea.map(s => <option key={s} value={s}>{s}</option>)}
              </ModalSelect>
              <Btn type="submit" color="red" full disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Application'}
              </Btn>
            </div>
            <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 10, letterSpacing: '0.08em', color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', margin: '14px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
              Your application will be reviewed by an admin before access is granted.
            </p>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button type="button" onClick={() => setView('login')}
                style={{ ...link, color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                Already have access? Sign In
              </button>
            </div>
          </form>
        )}

        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  )
}
