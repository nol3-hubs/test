(() => {
  // One unified extension serves the host BACARRA HUB app and its isolated Received Checking iframe.
  // Connect only when an explicit app marker is present; never connect from the temporary SPX tab.
  const receivedCheckingMarker = document.querySelector('meta[name="badoc-received-checking"]');
  const mainBadocMarker = document.querySelector('meta[name="badoc-main-app"]');
  const isReceivedChecking = !!(receivedCheckingMarker && String(receivedCheckingMarker.content || '').trim());
  // The main app marker changes with dashboard releases (for example v70-*).
  // Accept the explicit marker regardless of its app build suffix/version.
  const isMainBadocApp = !!(mainBadocMarker && String(mainBadocMarker.content || '').trim()) ||
    !!document.getElementById('badocSpxBridgeInstallModal') || !!document.getElementById('receivedCheckingFrame');
  // The Bacarra GitHub Pages project path is recognised explicitly as a fallback marker.
  const isKnownBacarraPagesHost = location.hostname === 'nol3-hubs.github.io' &&
    /^\/Bacarra-Hub(?:\/|$)/i.test(`${location.pathname || ''}`.replace(/\\/g, '/'));
  if (!isReceivedChecking && !isMainBadocApp && !isKnownBacarraPagesHost) return;

  // about:srcdoc frames inherit their parent origin; validate that the source is an allowed BADOC host.
  let bridgeContextUrl = location.href;
  if (location.protocol === "about:") {
    try { bridgeContextUrl = document.referrer || window.parent.location.href || location.href; }
    catch (_) { bridgeContextUrl = document.referrer || location.href; }
  }
  function isGithubPagesHost(value) {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' && (url.hostname === 'github.io' || url.hostname.endsWith('.github.io'));
    } catch (_) { return false; }
  }
  const isAllowedHost =
    bridgeContextUrl.startsWith("file:") ||
    /^(https?:)\/\/(localhost|127\.0\.0\.1)(?::\d+)?\//i.test(bridgeContextUrl) ||
    isGithubPagesHost(bridgeContextUrl);
  if (!isAllowedHost) return;
  if (window.__bacarraSpxBridgeUnifiedV73) return;
  window.__bacarraSpxBridgeUnifiedV73 = true;

  const PAGE_SOURCE = "BADOC_SPX_BRIDGE";
  const BADOC_SOURCE = "BADOC_PAGE";
  const VERSION = "73";
  let port = null;
  let reconnectTimer = null;
  let shuttingDown = false;
  let backgroundConfirmed = false;

  const emit = (type, data = {}) => window.postMessage({ source: PAGE_SOURCE, type, ...data }, "*");
  const scheduleReconnect = () => {
    if (shuttingDown || reconnectTimer) return;
    reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(); }, 750);
  };

  function connect() {
    if (shuttingDown || port) return;
    try {
      const nextPort = chrome.runtime.connect({ name: "BADOC_PAGE" });
      port = nextPort;
      backgroundConfirmed = false;
      nextPort.onMessage.addListener(msg => {
        if (!msg || !msg.type) return;
        if (msg.type === "BADOC_BRIDGE_READY") {
          const backgroundVersion = Number.parseInt(String(msg.version || ""), 10);
          if (!Number.isFinite(backgroundVersion) || backgroundVersion < 73) {
            emit("BADOC_BRIDGE_DISCONNECTED", {
              version: String(msg.version || ""),
              message: `Bacarra Hub Extension background version ${msg.version || "unknown"} is too old. Reload the extension.`
            });
            return;
          }
          backgroundConfirmed = true;
          emit("BADOC_BRIDGE_READY", { version: String(backgroundVersion), extensionId: chrome.runtime.id || "" });
          return;
        }
        emit(msg.type, msg);
      });
      nextPort.onDisconnect.addListener(() => {
        const reason = chrome.runtime.lastError?.message || "Extension background did not confirm the connection.";
        if (port === nextPort) port = null;
        backgroundConfirmed = false;
        emit("BADOC_BRIDGE_DISCONNECTED", { message: reason, version: VERSION });
        scheduleReconnect();
      });
    } catch (error) {
      port = null;
      backgroundConfirmed = false;
      emit("BADOC_BRIDGE_DISCONNECTED", { message: error?.message || String(error), version: VERSION });
      scheduleReconnect();
    }
  }

  window.addEventListener("message", event => {
    if (event.source !== window) return;
    const data = event.data || {};
    if (data.source !== BADOC_SOURCE) return;

    if (data.type === "BADOC_BRIDGE_HELLO") {
      if (backgroundConfirmed) emit("BADOC_BRIDGE_READY", { version: VERSION, extensionId: chrome.runtime.id || "" });
      else connect();
      return;
    }

    if (data.type === "BADOC_OPEN_EXTENSIONS") {
      try {
        chrome.runtime.sendMessage({ type: "BADOC_OPEN_EXTENSIONS" }, response => {
          if (chrome.runtime.lastError || !response?.ok) {
            emit("BADOC_SPX_ERROR", { message: chrome.runtime.lastError?.message || response?.message || "Could not open Chrome Extensions." });
            return;
          }
          emit("BADOC_EXTENSIONS_OPENED", {});
        });
      } catch (error) { emit("BADOC_SPX_ERROR", { message: error?.message || String(error) }); }
      return;
    }

    if (data.type === "BADOC_POD_RPC") {
      const rpcId = String(data.rpcId || "");
      const method = String(data.method || "");
      const args = Array.isArray(data.args) ? data.args : [];
      const reply = (ok, result, error) => emit("BADOC_POD_RPC_RESULT", { rpcId, ok, result, error });
      (async () => {
        try {
          let result;
          if (method === "storage.local.get") result = await chrome.storage.local.get(args[0]);
          else if (method === "storage.local.set") result = await chrome.storage.local.set(args[0] || {});
          else if (method === "storage.local.remove") result = await chrome.storage.local.remove(args[0]);
          else if (method === "runtime.sendMessage") result = await chrome.runtime.sendMessage(args[0] || {});
          else if (method === "tabs.query" || method === "tabs.sendMessage" || method === "scripting.discoverWorksheetGids") {
            result = await chrome.runtime.sendMessage({ target: "POD_CHECKER_RPC", method, args });
            if (!result?.ok) throw new Error(result?.error || "Extension request failed.");
            result = result.result;
          } else {
            throw new Error(`Unsupported POD Checker bridge method: ${method}`);
          }
          reply(true, result, "");
        } catch (error) {
          reply(false, null, error?.message || String(error));
        }
      })();
      return;
    }

    if (data.type === "BADOC_GET_POD_CHECKER_URL") {
      // Serve the checker from this extension's own origin so it can use
      // chrome.tabs, chrome.storage, and chrome.scripting inside the iframe.
      emit("BADOC_POD_CHECKER_URL", {
        url: chrome.runtime.getURL("pod-checker/app.html"),
        checkerVersion: "1.5.47"
      });
      return;
    }

    const supported = new Set([
      "BADOC_START_LINEHAUL_SYNC",
      "BADOC_START_DELIVERING_RECONCILE",
      "BADOC_START_PARCEL_DELIVERY_SYNC",
      "BADOC_START_RIDER_SYNC",
      "BADOC_START_PARCEL_INBOUND_SYNC",
      "BADOC_START_RECEIVED_CHECKING_INBOUND_SYNC",
      "BADOC_START_PARCEL_SECONDARY_SYNC",
      "BADOC_ABORT_SYNC",
      "BADOC_LOOKUP_RECIPIENT_NAMES"
    ]);
    if (!supported.has(data.type)) return;
    if (!port || !backgroundConfirmed) {
      const errorKind = data.type === "BADOC_LOOKUP_RECIPIENT_NAMES" ? "recipient-names" :
        data.type === "BADOC_START_DELIVERING_RECONCILE" ? "delivering-reconcile" :
        data.type === "BADOC_START_PARCEL_SECONDARY_SYNC" ? "parcel-secondary" :
        data.type === "BADOC_START_PARCEL_DELIVERY_SYNC" ? "parcel-delivery" :
        data.type === "BADOC_START_LINEHAUL_SYNC" ? "linehaul" :
        data.type === "BADOC_START_RIDER_SYNC" ? "rider" : "parcel-inbound";
      emit("BADOC_SPX_ERROR", {
        message: "Bacarra Hub Extension v73 is not connected. Reload the extension and refresh BACARRA HUB.",
        kind: errorKind
      });
      return;
    }
    try {
      const payload = { type: data.type };
      if (data.type === "BADOC_START_DELIVERING_RECONCILE") payload.trackingNumbers = Array.isArray(data.trackingNumbers) ? data.trackingNumbers.map(v => String(v || "").trim()).filter(Boolean) : [];
      if (data.type === "BADOC_START_RIDER_SYNC") {
        payload.hubId = Number(data.hubId || 0) || 0;
        payload.hubName = String(data.hubName || "").trim();
        payload.hubCode = String(data.hubCode || "").trim();
      }
      if (data.type === "BADOC_START_LINEHAUL_SYNC" || data.type === "BADOC_START_PARCEL_INBOUND_SYNC" || data.type === "BADOC_START_PARCEL_DELIVERY_SYNC") {
        for (const key of ["hubId","hubName","hubCode","trackingStatus","bulkyType","assignedStartUnix","assignedEndUnix","assignedStart","assignedEnd","assignedLabel","createdEndUnix"]) {
          if (data[key] !== undefined) payload[key] = data[key];
        }
      }
      if (data.type === "BADOC_LOOKUP_RECIPIENT_NAMES") {
        payload.shipmentIds = Array.isArray(data.shipmentIds)
          ? [...new Set(data.shipmentIds.map(v => String(v || "").trim()).filter(v => /^[A-Za-z0-9_-]{6,80}$/.test(v)))].slice(0, 2000)
          : [];
      }
      port.postMessage(payload);
    } catch (error) {
      emit("BADOC_SPX_ERROR", { message: error?.message || String(error) });
    }
  });

  window.addEventListener("beforeunload", () => {
    shuttingDown = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    try { port?.disconnect(); } catch {}
  });
  connect();
})();
