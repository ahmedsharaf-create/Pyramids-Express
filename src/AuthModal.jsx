import React, { useState } from 'react'
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db, APP_ID } from './firebase.js'
import { Icon, Input, Btn, Toast } from './ui.jsx'

export default function AuthModal({ dark, onClose, onLoginSuccess, shops }) {
  const [view, setView]     = useState('login')  // login | signup | forgot
  const [loading, setLoading] = useState(false)
  const [toast, setToast]   = useState(null)

  // login fields
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')

  // signup fields
  const [sName,  setSName]  = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPass,  setSPass]  = useState('')
  const [sArea,  setSArea]  = useState('')
  const [sShop,  setSShop]  = useState('')

  // forgot fields
  const [fEmail, setFEmail]     = useState('')
  const [resetSent, setResetSent] = useState(false)

  // derive unique managers from shops list
  const managers   = [...new Set(shops.map(s => s.areaManager))].sort()
  const shopsForArea = sArea
    ? shops.filter(s => s.areaManager === sArea).map(s => s.shopName).sort()
    : []

  // ── Login ──────────────────────────────────────────────────────────────────
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

  // ── Signup (stores pending request in Firestore) ───────────────────────────
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

  // ── Forgot password ────────────────────────────────────────────────────────
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

  // ── Style helpers ─────────────────────────────────────────────────────────
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
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
    fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
  }
  const heading = {
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
    fontSize: 22, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: dark ? '#fff' : '#111', margin: 0,
  }
  const sub = {
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11,
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
          color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
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
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20,
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
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
                  fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#22c55e', margin: '0 0 8px',
                }}>Check Your Inbox</p>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12,
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
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
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
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
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
