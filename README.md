# Pyramids Express — Agent Portal

React + Vite + Firebase app. Deploy to Vercel in minutes.

---

## Project Structure

```
pyramids-express/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx          ← React entry point
│   ├── App.jsx           ← Root component, Firebase sync, routing
│   ├── firebase.js       ← Firebase config & exports
│   ├── ui.jsx            ← Shared UI primitives (Icon, Btn, Input…)
│   ├── AuthModal.jsx     ← Login / Signup / Forgot Password
│   ├── MediaViewer.jsx   ← Full-screen photo/video/PDF viewer
│   ├── Pages.jsx         ← Home, Dashboard, Materials, Heroes, Events
│   └── AdminPage.jsx     ← Full admin panel incl. Shops & Managers CRUD
├── index.html
├── vite.config.js
├── vercel.json           ← SPA rewrite rule (fixes 404 on refresh)
└── package.json
```

---

## Deploy to Vercel (step by step)

### 1. Push to GitHub
```bash
# From inside the pyramids-express folder:
git init
git add .
git commit -m "Initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/pyramids-express.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to https://vercel.com → **Add New Project**
2. Import your GitHub repo
3. Framework preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy** — that's it!

> The `vercel.json` file already handles SPA routing so page refreshes won't 404.

---

## Firebase Setup (already done)
The Firebase config in `src/firebase.js` is pre-configured for your project.

Make sure your Firestore rules allow read/write for authenticated users:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Admin Account
Email: `admin@pyramidsexpress.com`

Set this password in Firebase Console → Authentication → Users.

---

## Shops & Managers
No shops are hardcoded anymore.
Log in as admin → **Management** → **Shops & Managers** tab to:
- Add area managers
- Add shops under each manager
- Delete shops or managers

These are stored in Firestore under `shops/` and reflect live in the signup form.

---

## Features
- ✅ Agent login / signup / **forgot password** (Firebase email reset)
- ✅ Admin can manage shops & area managers from the UI
- ✅ Upload resources (photo/video/PDF, max 750KB as base64)
- ✅ Approve / reject agent applications
- ✅ Dark mode
- ✅ Media viewer (photo, video, PDF)
- ✅ Medical dashboard (Looker Studio embed)
