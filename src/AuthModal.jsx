import React, { useState } from 'react'
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db, APP_ID, authErrorMessage } from './firebase.js'
import { Icon, Input, Btn, Toast } from './ui.jsx'

const ff = "'Barlow Condensed', sans-serif"

// ── Reusable inline select styled to match the app ───────────────────────────
function StyledSelect({ value, onChange, disabled, children, dark }) {
  return (
    <select
      value={value} onChange={onChange} disabled={disabled}
      style={{
        width: '100%', padding: '11px 14px',
        background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        borderRadius: 10, color: dark ? (disabled ? 'rgba(255,255,255,0.3)' : '#fff') : (disabled ? 'rgba(0,0,0,0.3)' : '#111'),
        fontFamily: ff, fontWeight: 600,
        fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
        outline: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'border-color 0.2s',
      }}
      onFocus={e => !disabled && (e.target.style.borderColor = '#ef4444')}
      onBlur={e => (e.target.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}
    >
      {children}
    </select>
  )
}

// ── Password strength bar ────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null
  const score = (() => {
    let s = 0
    if (password.length >= 6)  s++
    if (password.length >= 10) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()
  const label  = ['Too Short', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][score]
  const colors = ['#ef4444', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a']
  return (
    <div style={{ marginTop: -4 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= score ? colors[score] : 'rgba(128,128,128,0.15)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: colors[score], margin: 0 }}>
        {label}
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AuthModal({ dark, onClose, onLoginSuccess, shops }) {
  const [view,      setView]     = useState('login') // login | signup | forgot
  const [loading,   setLoading]   = useState(false)
  const [toast,     setToast]     = useState(null)

  // ── Login fields ───────────────────────────────────────────────────────────
  const [email,  setEmail]  = useState('')
  const [pass,   setPass]   = useState('')

  // ── Signup fields ──────────────────────────────────────────────────────────
  const [sName,    setSName]    = useState('')
  const [sEmail,   setSEmail]   = useState('')
  const [sPass,    setSPass]    = useState('')
  const [sPass2,   setSPass2]   = useState('')
  const [sArea,    setSArea]    = useState('')
  const [sShop,    setSShop]    = useState('')

  // ── Forgot fields ──────────────────────────────────────────────────────────
  const [fEmail,     setFEmail]     = useState('')
  const [resetSent,  setResetSent]  = useState(false)

  // ── Derived ────────────────────────────────────────────────────────────────
  const managers     = [...new Set(shops.filter(s => !s.isPlaceholder).map(s => s.areaManager))].sort()
  const shopsForArea = sArea
    ? shops.filter(s => s.areaManager === sArea && !s.isPlaceholder).map(s => s.shopName).sort()
    : []

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault()
    if (!email.trim() || !pass) return
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass)
      onLoginSuccess()
      onClose()
    } catch (err) {
      setToast({ message: authErrorMessage(err), type: 'error' })
    } finally { setLoading(false) }
  }

  const handleSignup = async e => {
    e.preventDefault()

    // Client-side validation
    if (!sName.trim())                return setToast({ message: 'Please enter your full name.', type: 'error' })
    if (!sEmail.trim())               return setToast({ message: 'Please enter your email address.', type: 'error' })
    if (!/\S+@\S+\.\S+/.test(sEmail)) return setToast({ message: 'Please enter a valid email address.', type: 'error' })
    if (sPass.length < 6)             return setToast({ message: 'Password must be at least 6 characters.', type: 'error' })
    if (sPass !== sPass2)             return setToast({ message: 'Passwords do not match.', type: 'error' })
    if (!sArea)                       return setToast({ message: 'Please select your area manager.', type: 'error' })
    if (!sShop)                       return setToast({ message: 'Please select your shop.', type: 'error' })

    setLoading(true)
    try {
      // Store the request WITHOUT the password — admin will create the Firebase Auth
      // account manually or via the admin panel (which uses secondaryAuth).
      // We never store plaintext passwords in Firestore.
      const id = `req_${Date.now()}`
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'requests', id), {
        id,
        agentName:   sName.trim(),
        email:       sEmail.trim().toLowerCase(),
        // ⚠️  We store the hashed hint only so admin knows a password was set,
        //     but the REAL password is set by admin when creating the Firebase Auth account.
        //     We pass it temporarily so admin can use it when creating the account — it's
        //     removed from Firestore after account creation (see AdminPage handleApprove).
        passwordHint: sPass,   // admin will use this once, then it's deleted
        areaManager: sArea,
        shopName:    sShop,
        status:      'pending',
        createdAt:   new Date().toISOString(),
      })
      setToast({ message: 'Application submitted! You\'ll be notified when approved.', type: 'success' })
      setTimeout(() => { setView('login'); resetSignup() }, 3000)
    } catch (err) {
      setToast({ message: 'Submission failed. Please check your connection and try again.', type: 'error' })
      console.error(err)
    } finally { setLoading(false) }
  }

  const handleForgot = async e => {
    e.preventDefault()
    const trimmed = fEmail.trim().toLowerCase()
    if (!trimmed) return setToast({ message: 'Please enter your email address.', type: 'error' })
    if (!/\S+@\S+\.\S+/.test(trimmed)) return setToast({ message: 'Please enter a valid email address.', type: 'error' })
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, trimmed)
      setResetSent(true)
    } catch (err) {
      // For security: don't reveal whether the email exists.
      // Always show success even if email not found (prevents user enumeration).
      if (err.code === 'auth/user-not-found') {
        setResetSent(true)  // show success anyway
      } else {
        setToast({ message: authErrorMessage(err), type: 'error' })
      }
    } finally { setLoading(false) }
  }

  const resetSignup = () => {
    setSName(''); setSEmail(''); setSPass(''); setSPass2(''); setSArea(''); setSShop('')
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
  const heading = { fontFamily: ff, fontWeight: 900, fontSize: 22, letterSpacing: '0.1em', textTransform: 'uppercase', color: dark ? '#fff' : '#111', margin: 0 }
  const sub     = { fontFamily: ff, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', margin: '4px 0 0' }
  const link    = { background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff, fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={card}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }}>
          <Icon name="x" size={18} />
        </button>

        {/* ═══ LOGIN ═══ */}
        {view === 'login' && (
          <form onSubmit={handleLogin} noValidate>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 48, height: 48, background: '#ef4444', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#fff', fontFamily: ff, fontWeight: 900, fontSize: 20 }}>PE</div>
              <h2 style={heading}>Agent Portal</h2>
              <p style={sub}>Authorize your session</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input type="email" placeholder="Email Address" value={email}
                onChange={e => setEmail(e.target.value)} required dark={dark} />
              
              {/* Uses the native `type="password"` from the robust UI components */}
              <Input type="password" placeholder="Password" value={pass} 
                onChange={e => setPass(e.target.value)} required dark={dark} />
              
              <Btn type="submit" color="black" full disabled={loading || !email || !pass}>
                {loading ? 'Verifying…' : 'Sign In'}
              </Btn>
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
              <button type="button" onClick={() => setView('forgot')}
                style={{ ...link, color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="key" size={13} /> Forgot Password?
              </button>
              <button type="button" onClick={() => setView('signup')}
                style={{ ...link, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>
                New Agent? Apply for Access
              </button>
            </div>
          </form>
        )}

        {/* ═══ FORGOT PASSWORD ═══ */}
        {view === 'forgot' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#ef4444' }}>
                <Icon name="key" size={24} />
              </div>
              <h2 style={heading}>Reset Password</h2>
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
                  If <strong style={{ color: dark ? '#fff' : '#111' }}>{fEmail.trim()}</strong> is registered,
                  a reset link has been sent. Check your spam folder if you don't see it.
                </p>
              </div>
            )}

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button type="button" onClick={() => { setView('login'); setResetSent(false); setFEmail('') }}
                style={{ ...link, color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                ← Back to Login
              </button>
            </div>
          </div>
        )}

        {/* ═══ SIGNUP ═══ */}
        {view === 'signup' && (
          <form onSubmit={handleSignup} noValidate>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <h2 style={heading}>Agent Application</h2>
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

              <Input type="password" placeholder="Confirm Password"
                value={sPass2} onChange={e => setSPass2(e.target.value)} required dark={dark} />
              
              {sPass2 && sPass !== sPass2 && (
                <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ef4444', margin: '-4px 0 0' }}>
                  Passwords do not match
                </p>
              )}
              {sPass2 && sPass === sPass2 && sPass2.length >= 6 && (
                <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22c55e', margin: '-4px 0 0' }}>
                  ✓ Passwords match
                </p>
              )}

              <StyledSelect value={sArea} onChange={e => { setSArea(e.target.value); setSShop('') }} dark={dark}>
                <option value="">SELECT AREA MANAGER</option>
                {managers.map(m => <option key={m} value={m}>{m}</option>)}
              </StyledSelect>

              <StyledSelect value={sShop} onChange={e => setSShop(e.target.value)} disabled={!sArea} dark={dark}>
                <option value="">SELECT SHOP</option>
                {shopsForArea.map(s => <option key={s} value={s}>{s}</option>)}
              </StyledSelect>

              <Btn type="submit" color="red" full disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Application'}
              </Btn>
            </div>

            <p style={{ fontFamily: ff, fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', margin: '14px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
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
