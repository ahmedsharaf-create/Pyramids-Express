import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
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
export const app    = initializeApp(firebaseConfig)
export const auth   = getAuth(app)
export const db     = getFirestore(app)

// ── Persist auth session in localStorage so it survives page refreshes ────────
// This is the key fix: default persistence in some environments is SESSION
// (cleared on tab close / refresh). LOCAL keeps the user signed in.
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn('Auth persistence error:', err)
})
