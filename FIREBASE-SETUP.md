# Bacarra Hub — Firebase setup

Bacarra Hub syncs through Firebase Realtime Database (data under /bacarra). The databaseURL is already set in index.html.

1. Firebase console → create a project → Build → **Realtime Database** → Create database.
2. **Rules** → paste and Publish:

       {
         "rules": {
           ".read": false,
           ".write": false,
           "bacarra": { ".read": true, ".write": true }
         }
       }

   (If you share a project with Badoc Hub, keep its `"badoc"` rule too.)
3. Project settings → Your apps → Web app → copy the config into `window.BADOC_FIREBASE_CONFIG`
   near the top of `index.html`. `databaseURL` alone is enough; `apiKey`/`appId` are optional.
4. Open the hub → Settings → **Test Cloud Connection**.

Existing Supabase data is not migrated automatically: after switching, re-upload the Parcel Count / Riders / Linehaul
files once (or use the extension's Sync All) and the shared state is rebuilt in Firebase.
