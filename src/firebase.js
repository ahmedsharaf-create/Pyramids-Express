import { initializeApp } from 'firebase/app'
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyD-1puhqN-3YUCx4PU2d0_Umb06g6Kacco",
  authDomain:        "pyramids-express-52a27.firebaseapp.com",
  projectId:         "pyramids-express-52a27",
  storageBucket:     "pyramids-express-52a27.firebasestorage.app",
  messagingSenderId: "806262842725",
  appId:             "1:806262842725:web:97e8c0493d7b5d4a1bad8c",
}

export const APP_ID = 'pyramids-express-52a27'

// ── Primary app — used for all normal app operations ─────────────────────────
export const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)

// ── Secondary app — used ONLY by admin to create new user accounts ────────────
// This is necessary so that createUserWithEmailAndPassword doesn't switch the
// currently logged-in admin session to the newly created account.
export const secondaryApp  = initializeApp(firebaseConfig, 'secondary')
export const secondaryAuth = getAuth(secondaryApp)

// ── Keep auth session alive across page refreshes ────────────────────────────
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn('Auth persistence error:', err)
})

// ── Human-readable error messages for Firebase Auth error codes ───────────────
export function authErrorMessage(err) {
  const code = err?.code || ''
  const map = {
    'auth/invalid-email':            'Invalid email address format.',
    'auth/user-disabled':            'This account has been disabled. Contact admin.',
    'auth/user-not-found':           'No account found with this email.',
    'auth/wrong-password':           'Incorrect password. Please try again.',
    'auth/invalid-credential':       'Incorrect email or password.',
    'auth/email-already-in-use':     'An account with this email already exists.',
    'auth/weak-password':            'Password must be at least 6 characters.',
    'auth/too-many-requests':        'Too many attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed':   'Network error. Check your connection and try again.',
    'auth/popup-closed-by-user':     'Sign-in popup was closed before completing.',
    'auth/requires-recent-login':    'Please log out and log back in to perform this action.',
    'auth/operation-not-allowed':    'Email/password sign-in is not enabled. Contact admin.',
  }
  return map[code] || err?.message || 'An unexpected error occurred. Please try again.'
}
