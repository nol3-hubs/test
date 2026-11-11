BADOC HUB FIRST MILE — DARK UI TEST BUILD

Dashboard: index.html
Chrome extension: extension-chrome/ (Badoc Hub Extension v1.0.6)

Install extension:
1. Extract this package.
2. Open chrome://extensions in Chrome.
3. Enable Developer mode.
4. Choose Load unpacked and select extension-chrome.
5. Log in to https://spx.shopee.ph/.
6. Open index.html from this package or deploy it to the dashboard host.

The First Mile sync still requests Orders first, then Tasks, through the existing SPX Bridge messages. CSV exports remain in browser local storage. This build changes the UI presentation; it does not enable Firebase/cloud sync.
