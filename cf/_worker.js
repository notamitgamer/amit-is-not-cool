export default {
  async fetch(request) {
    // === CONFIGURATION ===
    const LOCAL_TUNNEL_URL = "https://nonretentive-unillusive-marhta.ngrok-free.dev"; 
    
    // IMPORTANT: Make sure this is your ACTUAL Firebase URL. 
    // If it does not exist, the worker will safely catch it and show an error.
    const FIREBASE_FALLBACK_URL = "https://localtestdomain.web.app"; 
    
    // === AUTHENTICATION CREDENTIALS ===
    const USERNAME = "guest";
    const PASSWORD = "guest";

    const url = new URL(request.url);
    const cookies = request.headers.get("Cookie") || "";
    const isAuthenticated = cookies.includes("gateway_session=active");

    // ==========================================
    // 1. HANDLE LOGIN SUBMISSION (POST)
    // ==========================================
    if (url.pathname === "/--login" && request.method === "POST") {
      try {
        const formData = await request.formData();
        if (formData.get("userid") === USERNAME && formData.get("password") === PASSWORD) {
          return new Response("Redirecting...", {
            status: 302,
            headers: {
              "Location": "/",
              "Set-Cookie": "gateway_session=active; path=/; max-age=86400; HttpOnly; SameSite=Lax"
            }
          });
        }
      } catch (e) { /* Ignore parsing errors */ }
      
      return new Response("Invalid", {
        status: 302,
        headers: { "Location": "/--login?error=1" }
      });
    }

    // ==========================================
    // 2. RENDER M3 LOGIN PAGE (GET)
    // ==========================================
    if (url.pathname === "/--login" && request.method === "GET") {
      const hasError = url.searchParams.has("error");
      const loginHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Restricted Node Access</title>
          <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">
          <style>
            :root {
              --md-sys-color-background: #111318;
              --md-sys-color-on-background: #e2e2e9;
              --md-sys-color-surface-container: #1d2024;
              --md-sys-color-surface-container-hi: #282b30;
              --md-sys-color-outline: #8d9199;
              --md-sys-color-outline-variant: #43474e;
              --md-sys-color-primary: #a8c7fa;
              --md-sys-color-on-primary-container: #d6e3ff;
              --md-sys-color-primary-container: #0842a0;
              --md-sys-color-error: #ffb4ab;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Google Sans', sans-serif;
              background: var(--md-sys-color-background); color: var(--md-sys-color-on-background);
              min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;
            }
            .md-card {
              background: var(--md-sys-color-surface-container); border-radius: 28px; 
              padding: 40px 32px; width: 100%; max-width: 380px;
              box-shadow: 0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15);
            }
            .md-input {
              width: 100%; background: var(--md-sys-color-surface-container-hi);
              border: 1px solid var(--md-sys-color-outline-variant); color: white;
              padding: 16px; border-radius: 12px; font-family: inherit; font-size: 15px;
              margin-bottom: 16px; transition: border-color 0.2s; outline: none;
            }
            .md-input:focus { border-color: var(--md-sys-color-primary); }
            .md-btn {
              width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
              background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);
              border: none; border-radius: 20px; padding: 12px; font-size: 15px; font-weight: 500;
              font-family: inherit; cursor: pointer; margin-top: 8px; transition: transform 0.1s, opacity 0.2s;
              min-height: 48px;
            }
            .md-btn:hover { opacity: 0.9; }
            .md-btn:active { transform: scale(0.98); }
            .error-box {
              background: rgba(255, 180, 171, 0.1); border: 1px solid rgba(255, 180, 171, 0.2);
              color: var(--md-sys-color-error); padding: 12px 16px; border-radius: 12px;
              margin-bottom: 24px; font-size: 13px; display: flex; align-items: center; gap: 8px;
            }
            .btn-spinner {
              width: 22px; height: 22px; display: none; animation: spin 1.5s linear infinite;
            }
            .btn-spinner circle {
              fill: none; stroke: currentColor; stroke-width: 4; stroke-linecap: round;
              stroke-dasharray: 100; animation: md-dash 1.5s ease-in-out infinite;
            }
            .is-loading { pointer-events: none; opacity: 0.8; }
            .is-loading .btn-text { display: none; }
            .is-loading .btn-spinner { display: block; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            @keyframes md-dash { 0% { stroke-dashoffset: 100; } 50% { stroke-dashoffset: 25; } 100% { stroke-dashoffset: 100; } }
          </style>
        </head>
        <body>
          <div class="md-card">
            <div style="text-align: center; margin-bottom: 32px;">
              <span class="material-icons-round" style="font-size: 48px; color: var(--md-sys-color-primary);">lock</span>
              <h2 style="margin-top: 16px; font-weight: 400;">Restricted Access</h2>
              <p style="color: var(--md-sys-color-outline); font-size: 14px; margin-top: 8px;">Please authenticate to continue</p>
            </div>
            ${hasError ? `<div class="error-box"><span class="material-icons-round" style="font-size: 18px;">error_outline</span> Incorrect User ID or Password.</div>` : ''}
            <form method="POST" action="/--login" onsubmit="document.getElementById('submit-btn').classList.add('is-loading')">
              <input type="text" name="userid" class="md-input" placeholder="User ID" required autofocus autocomplete="username">
              <input type="password" name="password" class="md-input" placeholder="Password" required autocomplete="current-password">
              <button type="submit" class="md-btn" id="submit-btn">
                <span class="btn-text" style="display: flex; align-items: center; gap: 8px;">
                  Verify Identity <span class="material-icons-round" style="font-size: 18px;">arrow_forward</span>
                </span>
                <svg class="btn-spinner" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20"/></svg>
              </button>
            </form>
          </div>
        </body>
        </html>
      `;
      return new Response(loginHTML, { headers: { "Content-Type": "text/html;charset=UTF-8" }});
    }

    // ==========================================
    // 3. THE GATEKEEPER: BLOCK UNVERIFIED TRAFFIC
    // ==========================================
    if (!isAuthenticated) {
      return new Response("Redirecting to login...", {
        status: 302,
        headers: { "Location": "/--login" }
      });
    }

    // ==========================================
    // 4. SAFE PROXY HELPER & ROUTING
    // ==========================================
    
    // Helper to completely sanitize connections and prevent Cloudflare 522 Timeouts
    async function safeProxy(targetUrl, originalReq, extraHeaders = {}) {
      const proxyHeaders = new Headers(originalReq.headers);
      proxyHeaders.delete("Host"); // Prevents SNI Connection Drops!

      for (const [key, val] of Object.entries(extraHeaders)) {
        proxyHeaders.set(key, val);
      }

      const fetchConfig = {
        method: originalReq.method,
        headers: proxyHeaders,
        redirect: "manual"
      };

      if (originalReq.method !== "GET" && originalReq.method !== "HEAD") {
        fetchConfig.body = originalReq.body;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second absolute max
        const res = await fetch(targetUrl, { ...fetchConfig, signal: controller.signal });
        clearTimeout(timeoutId);
        return res;
      } catch (e) {
        return null; // Indicates a complete server failure or timeout
      }
    }

    async function isNgrokError(response) {
      if (response.status !== 200) return true;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const text = await response.clone().text();
        const markers = ["ERR_NGROK_", "Bad Gateway", "tunnel not found", "not found", "is not bound"];
        return markers.some(marker => text.toLowerCase().includes(marker.toLowerCase()));
      }
      return false;
    }

    // --- API ROUTE: Ping Check ---
    if (url.pathname === "/--check-connection") {
      const res = await safeProxy(LOCAL_TUNNEL_URL, request, { "ngrok-skip-browser-warning": "true" });
      const isOnline = res && !(await isNgrokError(res));
      
      return new Response(JSON.stringify({ status: isOnline ? "online" : "offline" }), { 
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        } 
      });
    }

    // --- PROXY ROUTER (Local PC) ---
    if (cookies.includes("route_target=local")) {
      const proxyTarget = LOCAL_TUNNEL_URL + url.pathname + url.search;
      const response = await safeProxy(proxyTarget, request, { "ngrok-skip-browser-warning": "true" });
      
      if (!response || await isNgrokError(response)) {
         return new Response("Connection lost. Re-syncing...", {
          status: 302,
          headers: { "Location": "/", "Set-Cookie": "route_target=; path=/; max-age=0", "Cache-Control": "no-store" }
        });
      }
      return response;
    }
    
    // --- Default: Show Material 3 Fallback UI ---
    const fbTarget = FIREBASE_FALLBACK_URL + url.pathname + url.search;
    let fbResponse = await safeProxy(fbTarget, request);
    
    // If Firebase is completely offline/dead, catch it here cleanly instead of causing a 522 crash!
    if (!fbResponse) {
      return new Response(
        `System Error: The assigned Fallback Server (${FIREBASE_FALLBACK_URL}) is offline or does not exist. Please check your configuration.`, 
        { status: 502, headers: { "Content-Type": "text/plain" } }
      );
    }

    return new Response(fbResponse.body, {
        status: fbResponse.status,
        headers: { ...fbResponse.headers, "Cache-Control": "no-store" }
    });
  }
};