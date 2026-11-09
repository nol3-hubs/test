# Bacarra Hub — upgraded on the Badoc Hub v20 base

## What changed
- UI, layout, navigation, themes, Dispatch page, Daily Data (Pickup / Performance / Consolidated / EOD), Daily History v7,
  POD/POOH Checker, Sync All, Riders filters + "Clear all riders data" all come from Badoc v20 (CFR1 pickup-time fix included).
- Bacarra logic kept as-is: 4 town sections (Bacarra 44 / Vintar 19 / Pasuquin 32 / MB 19), town-name matching & aliases,
  Cagayan DC -> Bacarra Hub / MB hub route rules, Planning Board linehaul filter, local OnHold source, KPI source,
  town move logic (no Zone ID), IndexedDB linehaul storage, Firebase Realtime Database backend.

## Logic improvements taken from Badoc
- Stay on the current page after automatic SPX imports; per-kind SPX sync progress.
- Parcel cloud uploads tagged by source; serialized uploads; pending-write guards in cloud sync.
- CFR1 pick-up-time fix; Dispatch recipient-name lookup and exemption sync.
## Logic improvements added
- Extension handshake only reports "installed" after the extension background confirms (no false positives).
- Extension version is now 73 and checked with ">=" everywhere.
- Same-origin storage keys that collided with Badoc Hub were renamed to bacarra_*.

## Install
1. Remove the old "SPX BRIDGE" extension, then load `extension/` (or the ZIP the app offers) in Chrome/Edge.
2. Upload the folder to GitHub Pages and open it. First load may need a hard refresh (service worker cache v21).

## Notes
- Zone ID stays disabled (Bacarra rule); Badoc's zone picker was not ported.
- Badoc's Google-Sheet OnHold + unmatched-hold popup were not ported (Bacarra derives OnHold locally).
- Cloud backend is Firebase Realtime Database (see FIREBASE-SETUP.md); set your databaseURL in index.html.
- Tested: all scripts parse, headless page load with 0 JS errors, all pages open, parcel classification checks.
  Not tested: live Firebase sync and the extension against SPX.
