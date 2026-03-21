# AHA Finance PWA 💰

Personal Finance Dashboard — installable on Android/iOS, works offline, syncs across devices via Firebase Firestore.

---

## 🚀 One-Time Setup

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial PWA"
git remote add origin https://github.com/YOUR_USERNAME/aha-finance.git
git push -u origin main
```

### Step 2 — Enable GitHub Pages
1. Go to your repo → **Settings → Pages**
2. Source: **GitHub Actions**
3. Your app will be live at `https://YOUR_USERNAME.github.io/aha-finance/`

### Step 3 — Firebase Setup
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Open your `goldloan` project
3. **Authentication → Sign-in method → Google → Enable → Save**
4. **Firestore Database → Rules** → paste and Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/finance/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. **Project Settings (⚙️) → Your apps → Web → copy firebaseConfig**
6. Open `index.html`, find `PASTE_apiKey_HERE` and replace the entire config block

### Step 4 — Add your GitHub Pages URL to Firebase Auth
1. Firebase Console → **Authentication → Settings → Authorized domains**
2. Add: `YOUR_USERNAME.github.io`

### Step 5 — Redeploy
```bash
git add index.html
git commit -m "Add Firebase config"
git push
```

---

## 📱 Install on Android
1. Open your GitHub Pages URL in **Chrome**
2. Tap the **Install** banner that appears → "Add to Home screen"
3. App icon appears on your home screen!

## 📱 Install on iPhone
1. Open URL in **Safari**
2. Tap **Share → Add to Home Screen**

---

## ☁️ How Sync Works

| Action | What happens |
|---|---|
| Add/Edit/Delete any entry | Auto-pushes to Firestore after 1.5s |
| Open app on another device | Live listener pulls latest data |
| **Push to Cloud** button | Force-push all local data |
| **Pull from Cloud** button | Force-pull cloud data to this device |
| Offline | Works normally, syncs when back online |

Data path in Firestore: `users/{uid}/finance/data`

---

## 📁 File Structure
```
aha-finance/
├── index.html          ← Main app (edit firebaseConfig here)
├── manifest.json       ← PWA manifest
├── sw.js               ← Service Worker (offline cache)
├── icons/              ← App icons (72px – 512px)
└── .github/workflows/  ← Auto-deploy to GitHub Pages
    └── deploy.yml
```
