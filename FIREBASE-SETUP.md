# Badoc Hub — Firebase setup

The app already points at your Realtime Database
(`nol3-backup-default-rtdb.asia-southeast1.firebasedatabase.app`). Two things left:

1. **Rules** — Firebase console → Realtime Database → Rules → paste, then Publish:

       {
         "rules": {
           ".read": false,
           ".write": false,
           "badoc": { ".read": true, ".write": true }
         }
       }

   (Test-mode rules expire after 30 days, which would silently stop syncing.)

2. **Optional config** — in `index.html`, find `BADOC_FIREBASE_CONFIG` and paste your
   `apiKey` / `appId` from Project settings → Your apps → Web app. Sync works with
   `databaseURL` alone.

Then open Settings → *Test Cloud Connection*. All green = every device syncs.

Data lives under `/badoc` (rows, blobs, meta). Files are gzip-compressed before upload and
cached on each device, so downloads stay small.
