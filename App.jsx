import { useState, useEffect, useRef } from "react";

// ─── Firebase SDK (loaded via CDN in index.html, accessed via window) ─────────
const FB_CONFIG = {
  apiKey: "AIzaSyD-1puhqN-3YUCx4PU2d0_Umb06g6Kacco",
  authDomain: "pyramids-express-52a27.firebaseapp.com",
  projectId: "pyramids-express-52a27",
  storageBucket: "pyramids-express-52a27.firebasestorage.app",
  messagingSenderId: "806262842725",
  appId: "1:806262842725:web:97e8c0493d7b5d4a1bad8c",
};
const APP_ID = "pyramids-express-52a27";

// Lazy-load Firebase
let _app, _auth, _db;
async function getFB() {
  if (_auth) return { auth: _auth, db: _db };
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
  const { getAuth, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    sendPasswordResetEmail, signOut, onAuthStateChanged } =
    await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
  const { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, deleteDoc, query } =
    await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");

  _app = initializeApp(FB_CONFIG);
  _auth = getAuth(_app);
  _db = getFirestore(_app);

  // expose auth methods on _auth for use below
  _auth._methods = {
    signInAnonymously: () => signInAnonymously(_auth),
    signInWithEmail: (e, p) => signInWithEmailAndPassword(_auth, e, p),
    sendPasswordResetEmail: (e) => sendPasswordResetEmail(_auth, e),
    signOut: () => signOut(_auth),
    onAuthStateChanged: (cb) => onAuthStateChanged(_auth, cb),
  };
  _db._methods = { doc, setDoc, getDoc, collection, onSnapshot, deleteDoc };
  return { auth: _auth, db: _db };
}

// ─── Shop Data ────────────────────────────────────────────────────────────────
const SHOPS = [
  { shop: "EXP El Eskandrany", manager: "Abdallah Ibrahim" },
  { shop: "EXP El Wardian", manager: "Abdallah Ibrahim" },
  { shop: "OB. Bashayer Elkhair", manager: "Abdallah Ibrahim" },
  { shop: "EXP El Bahr El Azam", manager: "Ahmed Bahgat" },
  { shop: "EXP Embaba 2", manager: "Ahmed Bahgat" },
  { shop: "EXP Giza Mall", manager: "Ahmed Bahgat" },
  { shop: "Fr Down Town", manager: "Ahmed Bahgat" },
  { shop: "EXP Damietta", manager: "Ahmed Elgendy" },
  { shop: "EXP Manzala", manager: "Ahmed Elgendy" },
  { shop: "Fr Port Said Canal", manager: "Ahmed Elgendy" },
  { shop: "EXP Amria", manager: "Ahmed Moharam" },
  { shop: "EXP Bahary", manager: "Ahmed Moharam" },
  { shop: "EXP El Betash", manager: "Ahmed Moharam" },
  { shop: "EXP Abu Tesht", manager: "Amir Nakhla" },
  { shop: "EXP El Gouna", manager: "Amir Nakhla" },
  { shop: "EXP Qena Down Town", manager: "Amir Nakhla" },
  { shop: "EXP Ismailia3", manager: "Amr Ali" },
  { shop: "EXP Port Fouad", manager: "Amr Ali" },
  { shop: "EXP Ahmed Al Zomor", manager: "Eslam Gouda" },
  { shop: "EXP El Marg", manager: "Eslam Gouda" },
  { shop: "EXP MADIENET EL SALAM", manager: "Eslam Gouda" },
  { shop: "EXP Sadat 3", manager: "Hossam Hafez" },
  { shop: "EXP Wadi EL Natron", manager: "Hossam Hafez" },
  { shop: "EXP El Haram", manager: "Ibrahim Mahmoud" },
  { shop: "EXP El Lebeny", manager: "Ibrahim Mahmoud" },
  { shop: "Fr 6 October", manager: "Ibrahim Mahmoud" },
  { shop: "EXP Galaa Tanta", manager: "Maged Magdy" },
  { shop: "EXP Tanta", manager: "Maged Magdy" },
  { shop: "EXP Ahnsia", manager: "Michael Fayek" },
  { shop: "EXP Beba", manager: "Michael Fayek" },
  { shop: "EXP Matarya", manager: "Mohamed Emad" },
  { shop: "EXP Sawah", manager: "Mohamed Emad" },
  { shop: "EXP Ismailia", manager: "Mostafa Mohamed" },
  { shop: "EXP Suez", manager: "Mostafa Mohamed" },
  { shop: "EXP Kanater", manager: "Mohamed Mostafa" },
  { shop: "EXP Shabory", manager: "Mohamed Mostafa" },
  { shop: "EXP ElKharga", manager: "Mohamed Sayed" },
  { shop: "Fr Ahly Club", manager: "Mohamed Sayed" },
  { shop: "EXP Borg El Arab", manager: "Mostafa Adel" },
  { shop: "EXP Ibrahimia", manager: "Mostafa Adel" },
  { shop: "EXP Talia", manager: "Mustafa Shaqery" },
  { shop: "EXP Assuit", manager: "Shady Maher" },
  { shop: "EXP Asyut", manager: "Shady Maher" },
];

const MANAGERS = [...new Set(SHOPS.map((s) => s.manager))].sort();

// ─── Icons (inline SVG components) ───────────────────────────────────────────
const Icon = ({ name, size = 20, className = "" }) => {
  const icons = {
    menu: "M4 6h16M4 12h16M4 18h16",
    x: "M18 6L6 18M6 6l12 12",
    moon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    sun: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z",
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
    settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
    award: "M12 15a6 6 0 100-12 6 6 0 000 12zM8.21 13.89L7 23l5-3 5 3-1.21-9.12",
    camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z",
    globe: "M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20",
    briefcase: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    arrowLeft: "M19 12H5M12 5l-7 7 7 7",
    chevRight: "M9 18l6-6-6-6",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
    trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
    userX: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 7a4 4 0 100 8 4 4 0 000-8zM20 8l-4 4m0-4l4 4",
    fileText: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
    video: "M23 7l-7 5 7 5V7zM1 5h15a2 2 0 012 2v10a2 2 0 01-2 2H1a2 2 0 01-2-2V7a2 2 0 012-2z",
    image: "M21 19a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
    upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
    check: "M20 6L9 17l-5-5",
    barChart: "M18 20V10M12 20V4M6 20v-6",
    rotate: "M2.5 2v6h6M2.66 15.57a10 10 0 1010.95 2",
    linkedin: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z",
    mail: "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
    key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={icons[name] || ""} />
    </svg>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);
  const color = type === "error" ? "#ef4444" : type === "success" ? "#22c55e" : "#f97316";
  return (
    <div
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        background: "#111", color: "#fff", borderLeft: `4px solid ${color}`,
        padding: "14px 20px", borderRadius: 12, maxWidth: 340,
        fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em",
        fontSize: 13, fontWeight: 600, textTransform: "uppercase",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "slideUp 0.3s ease",
      }}
    >
      {message}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Input({ id, type = "text", placeholder, value, onChange, required, dark }) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      style={{
        width: "100%",
        padding: "12px 16px",
        background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        borderRadius: 10,
        color: dark ? "#fff" : "#111",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        outline: "none",
        transition: "border-color 0.2s",
        boxSizing: "border-box",
      }}
      onFocus={(e) => (e.target.style.borderColor = "#ef4444")}
      onBlur={(e) => (e.target.style.borderColor = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}
    />
  );
}

function Select({ id, value, onChange, children, dark, disabled }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "12px 16px",
        background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        borderRadius: 10,
        color: dark ? "#fff" : "#111",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        outline: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxSizing: "border-box",
      }}
    >
      {children}
    </select>
  );
}

function Btn({ children, onClick, type = "button", color = "red", full = false, disabled, small }) {
  const bg = color === "red" ? "#ef4444" : color === "black" ? "#111" : color === "blue" ? "#3b82f6" : color === "green" ? "#22c55e" : "#666";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: full ? "100%" : "auto",
        padding: small ? "8px 16px" : "14px 24px",
        background: disabled ? "#444" : bg,
        color: "#fff",
        border: "none",
        borderRadius: 10,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800,
        fontSize: small ? 11 : 13,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "opacity 0.2s, transform 0.1s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
      onMouseEnter={(e) => !disabled && (e.target.style.opacity = "0.85")}
      onMouseLeave={(e) => !disabled && (e.target.style.opacity = "1")}
      onMouseDown={(e) => !disabled && (e.target.style.transform = "scale(0.98)")}
      onMouseUp={(e) => !disabled && (e.target.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ dark, onClose, onLogin }) {
  const [view, setView] = useState("login"); // login | signup | forgot
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  // login
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  // signup
  const [name, setName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPass, setSPass] = useState("");
  const [area, setArea] = useState("");
  const [shop, setShop] = useState("");
  // forgot
  const [fEmail, setFEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const shopsForArea = area ? SHOPS.filter((s) => s.manager === area).map((s) => s.shop) : [];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { auth } = await getFB();
      await auth._methods.signInWithEmail(email, pass);
      onLogin();
      onClose();
    } catch (err) {
      setToast({ message: "Login failed: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!area || !shop) return setToast({ message: "Please select area and shop", type: "error" });
    setLoading(true);
    try {
      const { auth, db } = await getFB();
      if (!auth.currentUser) await auth._methods.signInAnonymously();
      const { doc, setDoc } = db._methods;
      const id = Date.now().toString();
      await setDoc(doc(db, "artifacts", APP_ID, "public", "data", "requests", id), {
        id, agentName: name, email: sEmail, password: sPass,
        areaManager: area, shopName: shop, status: "pending",
        createdAt: new Date().toISOString(),
      });
      setToast({ message: "Application submitted! Await admin approval.", type: "success" });
      setTimeout(() => setView("login"), 2000);
    } catch (err) {
      setToast({ message: "Signup failed: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!fEmail) return setToast({ message: "Please enter your email", type: "error" });
    setLoading(true);
    try {
      const { auth } = await getFB();
      await auth._methods.sendPasswordResetEmail(fEmail);
      setResetSent(true);
    } catch (err) {
      setToast({ message: "Error: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const card = {
    background: dark ? "#111" : "#fff",
    borderRadius: 20,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 400,
    position: "relative",
    boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
    border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.92)", padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={card}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none", cursor: "pointer",
            color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)",
          }}
        >
          <Icon name="x" size={18} />
        </button>

        {/* ── LOGIN ── */}
        {view === "login" && (
          <form onSubmit={handleLogin}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 48, height: 48, background: "#ef4444", borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", color: "#fff",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20,
              }}>PE</div>
              <h2 style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: "0.1em", textTransform: "uppercase", color: dark ? "#fff" : "#111" }}>Agent Portal</h2>
              <p style={{ margin: "4px 0 0", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>Authorize your session</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required dark={dark} />
              <Input type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} required dark={dark} />
              <Btn type="submit" color="black" full disabled={loading}>{loading ? "Verifying..." : "Authorize Session"}</Btn>
            </div>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10, textAlign: "center" }}>
              <button type="button" onClick={() => setView("forgot")} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#ef4444",
              }}>
                <Icon name="key" size={12} style={{ marginRight: 4 }} /> Forgot Password?
              </button>
              <button type="button" onClick={() => setView("signup")} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
                color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
              }}>New Agent? Apply for access</button>
            </div>
          </form>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === "forgot" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 48, height: 48, background: "rgba(239,68,68,0.15)", borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", color: "#ef4444",
              }}>
                <Icon name="key" size={24} />
              </div>
              <h2 style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: "0.1em", textTransform: "uppercase", color: dark ? "#fff" : "#111" }}>Reset Password</h2>
              <p style={{ margin: "4px 0 0", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>We'll send a reset link to your email</p>
            </div>

            {!resetSent ? (
              <form onSubmit={handleForgotPassword}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Input type="email" placeholder="Your Email Address" value={fEmail} onChange={(e) => setFEmail(e.target.value)} required dark={dark} />
                  <Btn type="submit" color="red" full disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Btn>
                </div>
              </form>
            ) : (
              <div style={{
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 12, padding: "20px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✉️</div>
                <p style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: "#22c55e" }}>Check Your Email</p>
                <p style={{ margin: "8px 0 0", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                  A password reset link was sent to <strong style={{ color: dark ? "#fff" : "#111" }}>{fEmail}</strong>
                </p>
              </div>
            )}

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button type="button" onClick={() => { setView("login"); setResetSent(false); setFEmail(""); }} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
                color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              }}>← Back to Login</button>
            </div>
          </div>
        )}

        {/* ── SIGNUP ── */}
        {view === "signup" && (
          <form onSubmit={handleSignup}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: "0.1em", textTransform: "uppercase", color: dark ? "#fff" : "#111" }}>Agent Application</h2>
              <p style={{ margin: "4px 0 0", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>Request account activation</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required dark={dark} />
              <Input type="email" placeholder="Email Address" value={sEmail} onChange={(e) => setSEmail(e.target.value)} required dark={dark} />
              <Input type="password" placeholder="Set Password" value={sPass} onChange={(e) => setSPass(e.target.value)} required dark={dark} />
              <Select value={area} onChange={(e) => { setArea(e.target.value); setShop(""); }} dark={dark}>
                <option value="">SELECT AREA MANAGER</option>
                {MANAGERS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
              <Select value={shop} onChange={(e) => setShop(e.target.value)} dark={dark} disabled={!area}>
                <option value="">SELECT SHOP</option>
                {shopsForArea.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Btn type="submit" color="red" full disabled={loading}>{loading ? "Submitting..." : "Submit Application"}</Btn>
            </div>
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button type="button" onClick={() => setView("login")} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
                color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
              }}>Already registered? Login</button>
            </div>
          </form>
        )}

        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}

// ─── Media Viewer ─────────────────────────────────────────────────────────────
function MediaViewer({ material, onClose }) {
  if (!material) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.97)", padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ position: "relative", maxWidth: 900, width: "100%" }}>
        <button onClick={onClose} style={{
          position: "absolute", top: -40, right: 0,
          background: "none", border: "none", color: "#fff", cursor: "pointer",
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
          display: "flex", alignItems: "center", gap: 8,
        }}>Close Preview <Icon name="x" size={18} /></button>
        <div style={{ background: "#111", borderRadius: 20, overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          {material.type === "photo" && <img src={material.url} style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />}
          {material.type === "video" && <video src={material.url} controls autoPlay style={{ maxWidth: "100%", maxHeight: "70vh" }} />}
          {material.type === "pdf" && <iframe src={material.url} style={{ width: "100%", height: "75vh", border: "none" }} />}
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: 12, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>{material.title}</p>
      </div>
    </div>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────
function HomePage({ dark, isLoggedIn, onLogin, onNavigate }) {
  return (
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <div style={{
        position: "relative", height: 560, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.3)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(239,68,68,0.3) 100%)" }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 20px" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 16px", borderRadius: 6, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#fff", marginBottom: 16 }}>Partner Orange Egypt</div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(48px, 10vw, 96px)", color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 0.9, margin: "0 0 16px" }}>
            One <span style={{ color: "#ef4444" }}>Team</span><br />One <span style={{ color: "#ef4444" }}>Goal</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 400, fontSize: 18, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 36 }}>Reliability & Excellence</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Btn onClick={() => onNavigate("heroes")} color="black"><Icon name="award" size={16} /> Pyramids Heroes</Btn>
            <Btn onClick={() => onNavigate("events")} color="black"><Icon name="camera" size={16} /> Pyramids Events</Btn>
            {!isLoggedIn && <Btn onClick={onLogin} color="red">Agent Portal</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ dark, onNavigate }) {
  const cards = [
    { id: "medical", title: "Medical Insurance", sub: "Omega Care Network", icon: "heart" },
    { id: "orange-info", title: "Orange Info", sub: "Sales & Tariffs", icon: "globe" },
    { id: "corporate", title: "Corporate Materials", sub: "Solutions", icon: "briefcase" },
    { id: "incentives", title: "Incentives", sub: "Rewards & Recognition", icon: "award" },
  ];
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 20px", animation: "fadeUp 0.4s ease" }}>
      <div style={{ marginBottom: 48, borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, paddingBottom: 32 }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0, color: dark ? "#fff" : "#111" }}>Agent Dashboard</h2>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#ef4444", marginTop: 4 }}>Authorized Access Only</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
        {cards.map((c) => (
          <div
            key={c.id}
            onClick={() => onNavigate(c.id)}
            style={{
              padding: "32px 28px",
              background: dark ? "#111" : "#fff",
              border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
              borderRadius: 16,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(239,68,68,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <div style={{ width: 52, height: 52, background: dark ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.05)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: dark ? "#ef4444" : "#111" }}>
              <Icon name={c.icon} size={26} />
            </div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, textTransform: "uppercase", letterSpacing: "0.03em", margin: "0 0 4px", color: dark ? "#fff" : "#111" }}>{c.title}</h3>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#ef4444", margin: "0 0 20px" }}>{c.sub}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
              View Portal <Icon name="chevRight" size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MaterialsPage({ dark, category, materials, onBack, onView }) {
  const items = materials[category] || [];
  const label = category.replace("-", " ");
  const isMedical = category === "medical";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 20px", animation: "fadeUp 0.4s ease" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "#ef4444", marginBottom: 32 }}>
        <Icon name="arrowLeft" size={16} /> Back to Dashboard
      </button>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, textTransform: "uppercase", letterSpacing: "-0.02em", margin: "0 0 40px", color: dark ? "#fff" : "#111" }}>
        {label} <span style={{ color: "#ef4444" }}>Portal</span>
      </h1>

      {isMedical && (
        <div style={{ marginBottom: 40, borderRadius: 20, overflow: "hidden", border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`, paddingBottom: "56.25%", position: "relative", height: 0 }}>
          <iframe src="https://lookerstudio.google.com/embed/reporting/01d55067-0527-435e-9e17-5a692003f0b0/page/N7h0D" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onView(item)}
            style={{
              padding: "20px 24px",
              background: dark ? "#111" : "#fff",
              border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
              borderRadius: 14,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)"; e.currentTarget.style.borderColor = dark ? "rgba(239,68,68,0.4)" : "rgba(0,0,0,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"; }}
          >
            <div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, color: dark ? "#fff" : "#111" }}>{item.title}</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(128,128,128,0.7)", margin: "4px 0 0" }}>Preview Data</p>
            </div>
            <div style={{ color: "#ef4444" }}>
              <Icon name={item.type === "pdf" ? "fileText" : item.type === "video" ? "video" : "image"} size={20} />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: "80px 20px", textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(128,128,128,0.4)", border: `2px dashed ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`, borderRadius: 20 }}>
            No materials uploaded yet
          </div>
        )}
      </div>
    </div>
  );
}

function HeroesPage({ dark, materials, onBack, onView }) {
  const items = materials["heroes"] || [];
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 20px", animation: "fadeUp 0.4s ease" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "#ef4444", marginBottom: 32 }}>
        <Icon name="arrowLeft" size={16} /> Back Home
      </button>
      <div style={{ marginBottom: 48, borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, paddingBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0, color: dark ? "#fff" : "#111" }}>Pyramids <span style={{ color: "#ef4444" }}>Heroes</span></h1>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(128,128,128,0.6)", marginTop: 6 }}>Recognizing Excellence & Achievement</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 28 }}>
        {items.map((item) => (
          <div key={item.id} onClick={() => onView(item)} style={{ cursor: "pointer" }}>
            <div style={{ aspectRatio: "210/297", background: dark ? "#111" : "#f5f5f5", borderRadius: 16, overflow: "hidden", marginBottom: 12, border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`, transition: "box-shadow 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 20px 48px rgba(0,0,0,0.25)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = ""}
            >
              <img src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, textTransform: "uppercase", color: dark ? "#fff" : "#111", margin: 0 }}>{item.title}</p>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(128,128,128,0.5)", marginTop: 4 }}>Achiever Profile</p>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: "80px 20px", textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(128,128,128,0.3)", border: `2px dashed ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`, borderRadius: 20 }}>
            No heroes announced yet
          </div>
        )}
      </div>
    </div>
  );
}

function EventsPage({ dark, materials, onBack, onView }) {
  const items = materials["events"] || [];
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 20px", animation: "fadeUp 0.4s ease" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "#ef4444", marginBottom: 32 }}>
        <Icon name="arrowLeft" size={16} /> Back Home
      </button>
      <div style={{ marginBottom: 48, borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, paddingBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0, color: dark ? "#fff" : "#111" }}>Pyramids <span style={{ color: "#ef4444" }}>Events</span></h1>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(128,128,128,0.6)", marginTop: 6 }}>Captured Moments & Memories</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {items.map((item) => (
          <div key={item.id} onClick={() => onView(item)} style={{ position: "relative", aspectRatio: "16/9", borderRadius: 20, overflow: "hidden", cursor: "pointer", border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
            <img src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
              onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.target.style.transform = ""}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)", display: "flex", alignItems: "flex-end", padding: 20 }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", margin: 0 }}>{item.title}</p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: "80px 20px", textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(128,128,128,0.3)", border: `2px dashed ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`, borderRadius: 20 }}>
            No events captured yet
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPage({ dark, state, onView, setToast }) {
  const [tab, setTab] = useState("users");
  const [createForm, setCreateForm] = useState({ name: "", email: "", pass: "", area: "", shop: "" });
  const [uploadForm, setUploadForm] = useState({ cat: "orange-info", title: "", type: "photo" });
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterShop, setFilterShop] = useState("");
  const [loading, setLoading] = useState(false);

  const allMaterials = Object.values(state.materials).flat();
  const filteredUsers = state.users.filter((u) => {
    if (filterSearch && !u.agentName?.toLowerCase().includes(filterSearch) && !u.email?.toLowerCase().includes(filterSearch)) return false;
    if (filterArea && u.areaManager !== filterArea) return false;
    if (filterShop && u.shopName !== filterShop) return false;
    return true;
  });

  const shopsForCreate = createForm.area ? SHOPS.filter((s) => s.manager === createForm.area).map((s) => s.shop) : [];
  const shopsForFilter = filterArea ? SHOPS.filter((s) => s.manager === filterArea).map((s) => s.shop) : [];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 750 * 1024) { setToast({ message: "File too large! Max 750KB", type: "error" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setFileData(ev.target.result); setFileName(file.name); };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileData) { setToast({ message: "No file selected", type: "error" }); return; }
    setLoading(true);
    try {
      const { db } = await getFB();
      const { doc, setDoc } = db._methods;
      const id = Date.now().toString();
      await setDoc(doc(db, "artifacts", APP_ID, "public", "data", "materials", id), {
        category: uploadForm.cat, title: uploadForm.title, type: uploadForm.type,
        url: fileData, createdAt: new Date().toISOString(),
      });
      setToast({ message: "Resource published!", type: "success" });
      setUploadForm({ cat: "orange-info", title: "", type: "photo" });
      setFileData(null); setFileName(null);
    } catch (err) {
      setToast({ message: "Upload failed: " + err.message, type: "error" });
    } finally { setLoading(false); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.area || !createForm.shop) { setToast({ message: "Select area and shop", type: "error" }); return; }
    setLoading(true);
    try {
      const { db } = await getFB();
      const { doc, setDoc } = db._methods;
      const id = Date.now().toString();
      await setDoc(doc(db, "artifacts", APP_ID, "public", "data", "users", id), {
        email: createForm.email, password: createForm.pass,
        agentName: createForm.name, areaManager: createForm.area,
        shopName: createForm.shop, approvedAt: new Date().toISOString(), createdBy: "Admin",
      });
      setToast({ message: "Agent account created!", type: "success" });
      setCreateForm({ name: "", email: "", pass: "", area: "", shop: "" });
    } catch (err) {
      setToast({ message: "Failed: " + err.message, type: "error" });
    } finally { setLoading(false); }
  };

  const handleApprove = async (req) => {
    const { db } = await getFB();
    const { doc, setDoc, deleteDoc } = db._methods;
    const id = Date.now().toString();
    await setDoc(doc(db, "artifacts", APP_ID, "public", "data", "users", id), {
      email: req.email, password: req.password || "reset-needed",
      agentName: req.agentName, areaManager: req.areaManager,
      shopName: req.shopName, approvedAt: new Date().toISOString(),
    });
    await deleteDoc(doc(db, "artifacts", APP_ID, "public", "data", "requests", req.id));
    setToast({ message: "Agent approved!", type: "success" });
  };

  const handleReject = async (id) => {
    if (!confirm("Reject this application?")) return;
    const { db } = await getFB();
    const { doc, deleteDoc } = db._methods;
    await deleteDoc(doc(db, "artifacts", APP_ID, "public", "data", "requests", id));
    setToast({ message: "Application rejected", type: "error" });
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Remove this agent's access?")) return;
    const { db } = await getFB();
    const { doc, deleteDoc } = db._methods;
    await deleteDoc(doc(db, "artifacts", APP_ID, "public", "data", "users", id));
    setToast({ message: "Agent removed", type: "error" });
  };

  const handleDeleteMaterial = async (id) => {
    if (!confirm("Delete this resource?")) return;
    const { db } = await getFB();
    const { doc, deleteDoc } = db._methods;
    await deleteDoc(doc(db, "artifacts", APP_ID, "public", "data", "materials", id));
    setToast({ message: "Resource deleted", type: "error" });
  };

  const card = { background: dark ? "#111" : "#fff", border: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`, borderRadius: 16, padding: 24 };
  const label = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)", marginBottom: 8, display: "block" };

  const tabs = ["users", "materials", "requests"];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 20px", animation: "fadeUp 0.4s ease" }}>
      <div style={{ marginBottom: 40, borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, paddingBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0, color: dark ? "#fff" : "#111" }}>Management</h2>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#ef4444", marginTop: 4 }}>Administrator Hub</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={card}>
            <span style={label}>Upload Resource</span>
            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Select value={uploadForm.cat} onChange={(e) => setUploadForm({ ...uploadForm, cat: e.target.value })} dark={dark}>
                {["medical", "orange-info", "corporate", "incentives", "heroes", "events"].map((c) => <option key={c} value={c}>{c.replace("-", " ").toUpperCase()}</option>)}
              </Select>
              <Input placeholder="Resource Title" value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} required dark={dark} />
              <label htmlFor="admin-file" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", border: `2px dashed ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, borderRadius: 12, cursor: "pointer", transition: "border-color 0.2s", gap: 6 }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#ef4444"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
              >
                <Icon name="upload" size={20} style={{ color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }} />
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>{fileName || "Select File (< 750KB)"}</span>
                <input id="admin-file" type="file" onChange={handleFileSelect} accept="image/*,video/*,application/pdf" style={{ display: "none" }} />
              </label>
              <div style={{ display: "flex", gap: 12 }}>
                {["photo", "video", "pdf"].map((t) => (
                  <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }}>
                    <input type="radio" name="upload-type" value={t} checked={uploadForm.type === t} onChange={() => setUploadForm({ ...uploadForm, type: t })} />
                    {t}
                  </label>
                ))}
              </div>
              <Btn type="submit" color="red" full disabled={loading}>{loading ? "Publishing..." : "Publish Resource"}</Btn>
            </form>
          </div>

          <div style={card}>
            <span style={{ ...label, color: "#3b82f6" }}>Create Agent Account</span>
            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Input placeholder="Full Name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required dark={dark} />
              <Input type="email" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required dark={dark} />
              <Input placeholder="Set Password" value={createForm.pass} onChange={(e) => setCreateForm({ ...createForm, pass: e.target.value })} required dark={dark} />
              <Select value={createForm.area} onChange={(e) => setCreateForm({ ...createForm, area: e.target.value, shop: "" })} dark={dark}>
                <option value="">SELECT AREA</option>
                {MANAGERS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
              <Select value={createForm.shop} onChange={(e) => setCreateForm({ ...createForm, shop: e.target.value })} dark={dark} disabled={!createForm.area}>
                <option value="">SELECT SHOP</option>
                {shopsForCreate.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Btn type="submit" color="blue" full disabled={loading}>{loading ? "Creating..." : "Create Agent Account"}</Btn>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderRadius: 12, padding: 4, width: "fit-content" }}>
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "8px 20px",
                background: tab === t ? (dark ? "#fff" : "#111") : "transparent",
                color: tab === t ? (dark ? "#111" : "#fff") : (dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"),
                border: "none", cursor: "pointer", borderRadius: 10,
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
                transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
              }}>
                {t}
                {t === "requests" && state.requests.length > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 }}>{state.requests.length}</span>}
              </button>
            ))}
          </div>

          {tab === "users" && (
            <div style={card}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                <Input placeholder="Search name or email..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value.toLowerCase())} dark={dark} />
                <Select value={filterArea} onChange={(e) => { setFilterArea(e.target.value); setFilterShop(""); }} dark={dark}>
                  <option value="">ALL MANAGERS</option>
                  {MANAGERS.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
                <Select value={filterShop} onChange={(e) => setFilterShop(e.target.value)} dark={dark} disabled={!filterArea}>
                  <option value="">ALL SHOPS</option>
                  {shopsForFilter.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
                <button onClick={() => { setFilterSearch(""); setFilterArea(""); setFilterShop(""); }} style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer", color: dark ? "#fff" : "#111" }}>
                  <Icon name="rotate" size={16} />
                </button>
              </div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#ef4444", marginBottom: 14 }}>{filteredUsers.length} Agents Found</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {filteredUsers.map((u) => (
                  <div key={u.id} style={{ padding: "14px 16px", background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 13, textTransform: "uppercase", margin: 0, color: dark ? "#fff" : "#111" }}>{u.agentName}</p>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 500, fontSize: 10, color: "rgba(128,128,128,0.6)", margin: "2px 0" }}>{u.email}</p>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "#ef4444", margin: 0 }}>{u.shopName}</p>
                    </div>
                    <button onClick={() => handleDeleteUser(u.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(128,128,128,0.4)", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(128,128,128,0.4)"}>
                      <Icon name="userX" size={16} />
                    </button>
                  </div>
                ))}
                {filteredUsers.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(128,128,128,0.3)" }}>No agents match filters</div>}
              </div>
            </div>
          )}

          {tab === "materials" && (
            <div style={card}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)", marginBottom: 16 }}>Platform Resources ({allMaterials.length})</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                {allMaterials.map((m) => (
                  <div key={m.id} style={{ padding: "12px 16px", background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ overflow: "hidden" }}>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12, textTransform: "uppercase", margin: 0, color: dark ? "#fff" : "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</p>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "rgba(128,128,128,0.5)", margin: "2px 0 0" }}>{m.category}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => onView(m)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(128,128,128,0.5)" }} onMouseEnter={(e) => e.currentTarget.style.color = dark ? "#fff" : "#111"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(128,128,128,0.5)"}><Icon name="eye" size={15} /></button>
                      <button onClick={() => handleDeleteMaterial(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(128,128,128,0.5)" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(128,128,128,0.5)"}><Icon name="trash" size={15} /></button>
                    </div>
                  </div>
                ))}
                {allMaterials.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(128,128,128,0.3)" }}>No resources uploaded</div>}
              </div>
            </div>
          )}

          {tab === "requests" && (
            <div style={{ ...card, border: state.requests.length > 0 ? "1px solid rgba(239,68,68,0.4)" : card.border }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#ef4444", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Pending Applications
                {state.requests.length > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>{state.requests.length}</span>}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {state.requests.map((req) => (
                  <div key={req.id} style={{ padding: "16px 20px", background: dark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)", borderRadius: 12, border: "1px solid rgba(239,68,68,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, textTransform: "uppercase", margin: 0, color: dark ? "#fff" : "#111" }}>{req.agentName}</p>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "rgba(128,128,128,0.6)", margin: "2px 0" }}>{req.email}</p>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "#ef4444", margin: 0 }}>{req.shopName}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleApprove(req)} style={{ background: "rgba(34,197,94,0.1)", border: "none", cursor: "pointer", color: "#22c55e", borderRadius: 8, padding: "8px 10px", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#22c55e"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(34,197,94,0.1)"}><Icon name="check" size={16} /></button>
                      <button onClick={() => handleReject(req.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", cursor: "pointer", color: "#ef4444", borderRadius: 8, padding: "8px 10px", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#ef4444"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}><Icon name="x" size={16} /></button>
                    </div>
                  </div>
                ))}
                {state.requests.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(128,128,128,0.3)" }}>No pending applications</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState("home");
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [toast, setToast] = useState(null);
  const [state, setState] = useState({
    isLoggedIn: false, isAdmin: false, user: null,
    materials: { "orange-info": [], corporate: [], incentives: [], heroes: [], events: [], medical: [] },
    users: [], shops: [], requests: [],
  });

  useEffect(() => {
    (async () => {
      const { auth, db } = await getFB();
      await auth._methods.signInAnonymously().catch(() => {});
      auth._methods.onAuthStateChanged((user) => {
        if (user?.email) {
          const isAdmin = user.email === "admin@pyramidsexpress.com";
          setState((s) => ({ ...s, isLoggedIn: true, isAdmin, user: { uid: user.uid, email: user.email, name: isAdmin ? "System Admin" : "PE Agent" } }));
        } else {
          setState((s) => ({ ...s, isLoggedIn: false, isAdmin: false, user: user ? { uid: user.uid } : null }));
        }
        syncData(db);
      });
    })();
  }, []);

  const syncData = (db) => {
    const { collection, onSnapshot } = db._methods;
    onSnapshot(collection(db, "artifacts", APP_ID, "public", "data", "materials"), (snap) => {
      const m = { "orange-info": [], corporate: [], incentives: [], heroes: [], events: [], medical: [] };
      snap.forEach((d) => { const data = d.data(); if (m[data.category]) m[data.category].push({ id: d.id, ...data }); });
      setState((s) => ({ ...s, materials: m }));
    });
    onSnapshot(collection(db, "artifacts", APP_ID, "public", "data", "users"), (snap) => {
      const users = []; snap.forEach((d) => users.push({ id: d.id, ...d.data() }));
      setState((s) => ({ ...s, users }));
    });
    onSnapshot(collection(db, "artifacts", APP_ID, "public", "data", "requests"), (snap) => {
      const requests = []; snap.forEach((d) => requests.push({ id: d.id, ...d.data() }));
      setState((s) => ({ ...s, requests }));
    });
  };

  const handleLogout = async () => {
    const { auth } = await getFB();
    await auth._methods.signOut();
    setPage("home");
  };

  const bg = dark ? "#0a0a0a" : "#fafafa";
  const text = dark ? "#fff" : "#111";

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Barlow Condensed', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #ef4444; border-radius: 10px; }
        input[type="radio"] { accent-color: #ef4444; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 60, background: dark ? "rgba(10,10,10,0.95)" : "rgba(250,250,250,0.95)",
        backdropFilter: "blur(12px)", borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase", color: text, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 14 }}>PE</span>
            Pyramids Express
          </button>

          {/* Desktop Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <button onClick={() => setDark(!dark)} style={{ background: "none", border: "none", cursor: "pointer", color: text, opacity: 0.6, padding: 4 }}>
              <Icon name={dark ? "sun" : "moon"} size={18} />
            </button>
            <button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: text, opacity: 0.6, transition: "opacity 0.2s" }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.6}>Home</button>
            {state.isLoggedIn ? (
              <>
                <button onClick={() => setPage("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: text, opacity: 0.6, transition: "opacity 0.2s" }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.6}>Dashboard</button>
                {state.isAdmin && (
                  <button onClick={() => setPage("admin")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="settings" size={14} /> Management
                    {state.requests.length > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{state.requests.length}</span>}
                  </button>
                )}
                <div style={{ borderLeft: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, paddingLeft: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 12, textTransform: "uppercase", opacity: 0.5 }}>{state.user?.name}</span>
                  <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><Icon name="logout" size={18} /></button>
                </div>
              </>
            ) : (
              <Btn onClick={() => setAuthOpen(true)} color={dark ? "red" : "black"} small>Agent Login</Btn>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ paddingTop: 60 }}>
        {page === "home" && <HomePage dark={dark} isLoggedIn={state.isLoggedIn} onLogin={() => setAuthOpen(true)} onNavigate={setPage} />}
        {page === "dashboard" && state.isLoggedIn && <DashboardPage dark={dark} onNavigate={setPage} />}
        {page === "admin" && state.isAdmin && <AdminPage dark={dark} state={state} onView={setViewer} setToast={setToast} />}
        {["orange-info", "corporate", "incentives", "medical"].includes(page) && (
          <MaterialsPage dark={dark} category={page} materials={state.materials} onBack={() => setPage("dashboard")} onView={setViewer} />
        )}
        {page === "heroes" && <HeroesPage dark={dark} materials={state.materials} onBack={() => setPage("home")} onView={setViewer} />}
        {page === "events" && <EventsPage dark={dark} materials={state.materials} onBack={() => setPage("home")} onView={setViewer} />}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: 80, borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, background: dark ? "#050505" : "#f5f5f5", padding: "48px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 24 }}>
          {[
            { icon: "linkedin", href: "https://www.linkedin.com/company/pyramids-express-orange" },
            { icon: "mail", href: "mailto:ahmedsharaf.pe@gmail.com" },
            { icon: "mapPin", href: "https://www.google.com/maps/place/Al+Baramelgi" },
          ].map((l) => (
            <a key={l.icon} href={l.href} target="_blank" rel="noreferrer" style={{ color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"} onMouseLeave={(e) => e.currentTarget.style.color = dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}>
              <Icon name={l.icon} size={18} />
            </a>
          ))}
        </div>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)", margin: 0 }}>
          © {new Date().getFullYear()} Pyramids Express Quality App
        </p>
      </footer>

      {authOpen && <AuthModal dark={dark} onClose={() => setAuthOpen(false)} onLogin={() => { setState((s) => ({ ...s })); setPage("dashboard"); }} />}
      {viewer && <MediaViewer material={viewer} onClose={() => setViewer(null)} />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
