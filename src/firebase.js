import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD-1puhqN-3YUCx4PU2d0_Umb06g6Kacco",
  authDomain: "pyramids-express-52a27.firebaseapp.com",
  projectId: "pyramids-express-52a27",
  storageBucket: "pyramids-express-52a27.firebasestorage.app",
  messagingSenderId: "806262842725",
  appId: "1:806262842725:web:97e8c0493d7b5d4a1bad8c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Your App ID for Firestore path scoping
export const APP_ID = 'pyramids-express-52a27';

// Explicitly set persistence to LOCAL
// This ensures that the auth token is saved in localStorage
// so it survives page refreshes and browser restarts.
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

export { app, auth, db };
