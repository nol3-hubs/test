# NOL3 Planning Dashboard — GitHub Cloud Switch

This repository contains the 26 hub HTML dashboards plus a shared `cloud-config.json`.

## Normal mode

`cloud-config.json` uses:

```json
{
  "provider": "supabase",
  "firebaseUrl": "https://nol3-backup-default-rtdb.asia-southeast1.firebasedatabase.app",
  "mirror": true,
  "hubs": {}
}
```

Supabase is the active provider. Changes are mirrored to Firebase so Firebase stays current.

## Switch to Firebase

When Supabase is unavailable, edit `cloud-config.json`:

```json
{
  "provider": "firebase",
  "firebaseUrl": "https://nol3-backup-default-rtdb.asia-southeast1.firebasedatabase.app",
  "mirror": false,
  "hubs": {}
}
```

Push the change to GitHub. Users can refresh immediately; the dashboards also refresh the config periodically.

## Per-hub override

A hub can be switched independently:

```json
"hubs": {
  "BADOC": "firebase"
}
```

This does not require re-uploading inventory as long as Firebase has been kept mirrored.

## Hub pages

There are 26 hub HTML files. The Badoc file is the latest working cloud-connected build.
