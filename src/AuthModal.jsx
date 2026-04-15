import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight, 
  CheckCircle2,
  X,
  Key,
  AlertCircle
} from 'lucide-react';

// ── Mock UI Components (to keep the file self-contained) ────────────────────
const ff = "'Barlow Condensed', sans-serif";

const Icon = ({ name, size = 18 }) => {
  const icons = {
    mail: <Mail size={size} />,
    lock: <Lock size={size} />,
    eye: <Eye size={size} />,
    eyeOff: <EyeOff size={size} />,
    user: <User size={size} />,
    arrowRight: <ArrowRight size={size} />,
    check: <CheckCircle2 size={size} />,
    x: <X size={size} />,
    key: <Key size={size} />,
    alert: <AlertCircle size={size} />
  };
  return icons[name] || null;
};

const Input = ({ dark, ...props }) => (
  <input
    {...props}
    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none font-sans ${
      dark 
        ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-red-500' 
        : 'bg-black/5 border-black/10 text-slate-900 placeholder:text-black/30 focus:border-red-500'
    }`}
    style={{ 
      textTransform: 'none', // FORCING NO UPPERCASE
      fontFamily: 'inherit'
    }}
  />
);

const Btn = ({ children, color, full, disabled, ...props }) => {
  const bg = color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-black';
  return (
    <button
      {...props}
      disabled={disabled}
      className={`${full ? 'w-full' : ''} ${bg} text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
      style={{ fontFamily: ff, letterSpacing: '0.1em', textTransform: 'uppercase' }}
    >
      {children}
    </button>
  );
};

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce z-[300] ${
    type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
  }`}>
    <Icon name={type === 'error' ? 'alert' : 'check'} size={18} />
    <span className="font-bold text-sm tracking-wide uppercase" style={{ fontFamily: ff }}>{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={14} /></button>
  </div>
);

// ── Reusable inline select ───────────────────────────────────────────────────
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
    >
      {children}
    </select>
  );
}

// ── Password strength bar ────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const score = (() => {
    let s = 0;
    if (password.length >= 6)  s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const label  = ['Too Short', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][score];
  const colors = ['#ef4444', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
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
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [isOpen, setIsOpen] = useState(true);
  const dark = true; // Setting theme to dark for this demo
  
  // Dummy shops data for demo
  const shops = [
    { areaManager: 'John Smith', shopName: 'Shop A' },
    { areaManager: 'John Smith', shopName: 'Shop B' },
    { areaManager: 'Jane Doe', shopName: 'Shop C' }
  ];

  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Login fields
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Signup fields
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPass, setSPass] = useState('');
  const [sPass2, setSPass2] = useState('');
  const [sArea, setSArea] = useState('');
  const [sShop, setSShop] = useState('');
  const [showSPw, setShowSPw] = useState(false);

  // Forgot fields
  const [fEmail, setFEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Derived
  const managers = [...new Set(shops.map(s => s.areaManager))].sort();
  const shopsForArea = sArea
    ? shops.filter(s => s.areaManager === sArea).map(s => s.shopName).sort()
    : [];

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToast({ message: 'Login feature requires Firebase config', type: 'error' });
    }, 1000);
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToast({ message: 'Application sent!', type: 'success' });
    }, 1000);
  };

  const handleForgot = (e) => {
    e.preventDefault();
    setResetSent(true);
  };

  // Styles
  const card = {
    background: dark ? '#111' : '#fff',
    borderRadius: 20, padding: '36px 32px',
    width: '100%', maxWidth: 420, position: 'relative',
    boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
    maxHeight: '92vh', overflowY: 'auto',
  };
  const heading = { fontFamily: ff, fontWeight: 900, fontSize: 22, letterSpacing: '0.1em', textTransform: 'uppercase', color: dark ? '#fff' : '#111', margin: 0 };
  const sub = { fontFamily: ff, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', margin: '4px 0 0' };
  const link = { background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff, fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' };

  const PwField = ({ placeholder, value, onChange, show, onToggle }) => (
    <div style={{ position: 'relative' }}>
      <Input type={show ? 'text' : 'password'} placeholder={placeholder}
        value={value} onChange={onChange} required dark={dark} />
      <button type="button" onClick={onToggle} style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
        padding: 4, display: 'flex', alignItems: 'center',
      }}>
        <Icon name={show ? 'eyeOff' : 'eye'} size={15} />
      </button>
    </div>
  );

  if (!isOpen) return <div className="p-10"><Btn onClick={() => setIsOpen(true)}>Open Modal</Btn></div>;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div style={card}>
        <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }}>
          <Icon name="x" size={18} />
        </button>

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
              <PwField placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} show={showPw} onToggle={() => setShowPw(v => !v)} />
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
                  If <strong style={{ color: dark ? '#fff' : '#111' }}>{fEmail.trim()}</strong> is registered, a reset link has been sent.
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

              <PwField placeholder="Set Password (min 6 chars)" value={sPass} onChange={e => setSPass(e.target.value)} show={showSPw} onToggle={() => setShowSPw(v => !v)} />
              <PasswordStrength password={sPass} />

              <Input type={showSPw ? 'text' : 'password'} placeholder="Confirm Password"
                value={sPass2} onChange={e => setSPass2(e.target.value)} required dark={dark} />

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
      
      <style>{`
        /* Crucial fix to ensure mixed case in input fields */
        input {
          text-transform: none !important;
        }
        input::placeholder {
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.1em;
        }
      `}</style>
    </div>
  );
}
