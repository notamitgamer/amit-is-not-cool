export default {
  async fetch(request) {
    // === CONFIGURATION ===
    const LOCAL_TUNNEL_URL = "https://nonretentive-unillusive-marhta.ngrok-free.dev"; 
    const FIREBASE_FALLBACK_URL = "https://localtestdomain.web.app"; 
    
    // === AUTHENTICATION CREDENTIALS ===
    const USERNAME = "";
    const PASSWORD = "";

    const url = new URL(request.url);
    const cookies = request.headers.get("Cookie") || "";
    
    // Check states
    const isAuthenticated = cookies.includes("gateway_session=active");
    const isLocalRouted = cookies.includes("route_target=local");

    // ==========================================
    // 1. HANDLE LOGIN SUBMISSION (POST)
    // ==========================================
    if (url.pathname === "/--login" && request.method === "POST") {
      try {
        const formData = await request.formData();
        if (formData.get("uid_edge") === USERNAME && formData.get("pwd_edge") === PASSWORD) {
          return new Response("Redirecting...", {
            status: 302,
            headers: {
              "Location": "/",
              "Set-Cookie": "gateway_session=active; path=/; HttpOnly; SameSite=Lax"
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
    // 2. ENABLE LOCAL ROUTING ENDPOINT
    // ==========================================
    if (url.pathname === "/--enable-local" && isAuthenticated) {
       return new Response("Connecting...", {
         status: 302,
         headers: {
           "Location": "/",
           "Set-Cookie": "route_target=local; path=/; HttpOnly; SameSite=Lax"
         }
       });
    }

    // ==========================================
    // 3. RENDER M3 LOGIN PAGE (GET) - ANTI-AUTOFILL
    // ==========================================
    if (url.pathname === "/--login" && request.method === "GET") {
      const hasError = url.searchParams.has("error");
      const loginHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Restricted Node Access</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">
          <style>
            :root { --md-sys-color-background: #111318; --md-sys-color-on-background: #e2e2e9; --md-sys-color-surface-container: #1d2024; --md-sys-color-surface-container-hi: #282b30; --md-sys-color-outline: #8d9199; --md-sys-color-outline-variant: #43474e; --md-sys-color-primary: #a8c7fa; --md-sys-color-on-primary-container: #d6e3ff; --md-sys-color-primary-container: #0842a0; --md-sys-color-error: #ffb4ab; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            ::-webkit-scrollbar { width: 10px; height: 10px; } ::-webkit-scrollbar-track { background: var(--md-sys-color-background); } ::-webkit-scrollbar-thumb { background: var(--md-sys-color-outline-variant); border-radius: 5px; border: 2px solid var(--md-sys-color-background); } ::-webkit-scrollbar-thumb:hover { background: var(--md-sys-color-outline); }
            body { font-family: 'Outfit', sans-serif; background: var(--md-sys-color-background); color: var(--md-sys-color-on-background); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
            .md-card { background: var(--md-sys-color-surface-container); border-radius: 28px; padding: 40px 32px; width: 100%; max-width: 380px; box-shadow: 0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15); }
            
            .input-group { position: relative; width: 100%; margin-bottom: 16px; }
            .md-input { width: 100%; background: var(--md-sys-color-surface-container-hi); border: 1px solid var(--md-sys-color-outline-variant); color: white; padding: 16px; padding-right: 48px; border-radius: 12px; font-family: inherit; font-size: 15px; transition: border-color 0.2s; outline: none; }
            .md-input:focus { border-color: var(--md-sys-color-primary); }
            .eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--md-sys-color-outline); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 50%; outline: none; -webkit-tap-highlight-color: transparent; transition: color 0.2s, background 0.2s; }
            .eye-btn:hover { color: var(--md-sys-color-primary); background: rgba(255,255,255,0.05); }
            
            .md-btn { width: 100%; display: flex; align-items: center; justify-content: center; background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); border: none; border-radius: 20px; padding: 12px; font-size: 15px; font-weight: 500; font-family: inherit; cursor: pointer; margin-top: 8px; transition: transform 0.1s, opacity 0.2s; min-height: 48px; outline: none; -webkit-tap-highlight-color: transparent; }
            .md-btn:hover { opacity: 0.9; } .md-btn:active { transform: scale(0.98); }
            .error-box { background: rgba(255, 180, 171, 0.1); border: 1px solid rgba(255, 180, 171, 0.2); color: var(--md-sys-color-error); padding: 12px 16px; border-radius: 12px; margin-bottom: 24px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
            
            /* Button Animation Styles */
            .btn-content { display: flex; align-items: center; justify-content: center; gap: 8px; }
            .btn-icon-container { position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
            .btn-arrow { font-size: 20px !important; position: absolute; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s; }
            .btn-spinner { position: absolute; width: 20px; height: 20px; opacity: 0; transform: scale(0.5); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s; animation: spin 1.5s linear infinite; }
            .btn-spinner circle { fill: none; stroke: currentColor; stroke-width: 4; stroke-linecap: round; stroke-dasharray: 100; animation: md-dash 1.5s ease-in-out infinite; }
            
            .is-loading { pointer-events: none; opacity: 0.8; }
            .is-loading .btn-arrow { transform: translateX(15px) scale(0); opacity: 0; }
            .is-loading .btn-spinner { opacity: 1; transform: scale(1); }
            
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
            
            <form method="POST" action="/--login" autocomplete="off" onsubmit="document.getElementById('submit-btn').classList.add('is-loading')">
              <input style="display:none" type="text" name="fakeusernameremembered" autocomplete="username">
              <input style="display:none" type="password" name="fakepasswordremembered" autocomplete="current-password">
              
              <div class="input-group">
                <input type="text" name="uid_edge" class="md-input" placeholder="User ID" required readonly 
                       onfocus="this.removeAttribute('readonly'); setTimeout(() => this.scrollIntoView({behavior: 'smooth', block: 'center'}), 300);" 
                       autocomplete="nope" autocorrect="off" autocapitalize="none" spellcheck="false" data-lpignore="true">
              </div>
              
              <div class="input-group">
                <input type="password" id="pwd_edge" name="pwd_edge" class="md-input" placeholder="Password" required readonly 
                       onfocus="this.removeAttribute('readonly'); setTimeout(() => this.scrollIntoView({behavior: 'smooth', block: 'center'}), 300);" 
                       autocomplete="one-time-code" autocorrect="off" autocapitalize="none" spellcheck="false" data-lpignore="true">
                <button type="button" class="eye-btn" onclick="togglePassword()" tabindex="-1" title="Toggle password visibility">
                  <span class="material-icons-round" id="eye-icon" style="font-size: 20px;">visibility_off</span>
                </button>
              </div>
              
              <p style="font-size: 12px; color: var(--md-sys-color-outline); text-align: center; margin-bottom: 16px;">
                <span class="material-icons-round" style="font-size: 14px; vertical-align: middle;">security</span>
                Session automatically terminates on browser close.
              </p>
              
              <button type="submit" class="md-btn" id="submit-btn">
                <div class="btn-content">
                  <span>Verify Identity</span>
                  <div class="btn-icon-container">
                    <span class="material-icons-round btn-arrow">arrow_forward</span>
                    <svg class="btn-spinner" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20"/></svg>
                  </div>
                </div>
              </button>
            </form>
          </div>
          
          <script>
            function togglePassword() {
              const pwdInput = document.getElementById('pwd_edge');
              const eyeIcon = document.getElementById('eye-icon');
              if (pwdInput.type === 'password') {
                pwdInput.type = 'text';
                eyeIcon.textContent = 'visibility';
              } else {
                pwdInput.type = 'password';
                eyeIcon.textContent = 'visibility_off';
              }
            }
          </script>
        </body>
        </html>
      `;
      return new Response(loginHTML, { headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-store" }});
    }

    // ==========================================
    // 4. MAIN LANDING PAGE (Served on root '/' if not routed locally)
    // ==========================================
    if (url.pathname === "/" && !isLocalRouted) {
      const landingHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Testing Gateway</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700&family=Roboto+Mono&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">
        <style>
          :root { --md-sys-color-background: #111318; --md-sys-color-on-background: #e2e2e9; --md-sys-color-surface-container: #1d2024; --md-sys-color-surface-container-hi: #282b30; --md-sys-color-outline: #8d9199; --md-sys-color-outline-variant: #43474e; --md-sys-color-primary: #a8c7fa; --md-sys-color-primary-container: #0842a0; --md-sys-color-on-primary-container: #d6e3ff; --md-sys-color-secondary: #bec6dc; --md-sys-color-error: #ffb4ab; --md-sys-color-success: #6dd58c; }
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 10px; height: 10px; } ::-webkit-scrollbar-track { background: var(--md-sys-color-background); } ::-webkit-scrollbar-thumb { background: var(--md-sys-color-outline-variant); border-radius: 5px; border: 2px solid var(--md-sys-color-background); } ::-webkit-scrollbar-thumb:hover { background: var(--md-sys-color-outline); }
          
          /* Changed from center to flex-start so mobile scrolling doesn't clip the top */
          body { font-family: 'Outfit', sans-serif; background-color: var(--md-sys-color-background); color: var(--md-sys-color-on-background); min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; position: relative; }
          .material-icons-round { font-family: 'Material Icons Round' !important; }
          
          /* Made the Auth / Localhost button sticky during scroll */
          .top-nav { position: fixed; top: 16px; right: 16px; z-index: 100; }
          
          .md-card { background-color: var(--md-sys-color-surface-container); border-radius: 28px; padding: 40px 32px; width: 100%; max-width: 444px; box-shadow: 0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15); }
          .headline { font-size: 24px; font-weight: 700; line-height: 32px; margin-bottom: 24px; text-align: center; }
          
          /* Flowchart CSS - Mathematically locked line alignment */
          .flowchart { display: flex; flex-direction: column; align-items: center; background: var(--md-sys-color-surface-container-hi); padding: 32px 24px; border-radius: 16px; margin: 24px 0; border: 1px solid var(--md-sys-color-outline-variant); overflow-x: auto; }
          .flow-node { background: var(--md-sys-color-surface-container); border: 1px solid var(--md-sys-color-outline-variant); padding: 14px 20px; border-radius: 12px; text-align: center; z-index: 2; min-width: 220px; }
          .flow-node.primary { border-color: var(--md-sys-color-primary); } .flow-node.success { border-color: var(--md-sys-color-success); } .flow-node.error { border-color: var(--md-sys-color-error); }
          .flow-title { font-weight: 700; color: var(--md-sys-color-primary); margin-bottom: 6px; font-size: 14px; }
          .flow-desc { color: var(--md-sys-color-outline); font-size: 13px; line-height: 1.4; }
          code { font-family: 'Roboto Mono', monospace; font-size: 12px; background: var(--md-sys-color-surface-container-hi); padding: 2px 6px; border-radius: 4px; color: var(--md-sys-color-secondary); }
          .flow-arrow { width: 2px; height: 24px; background: var(--md-sys-color-outline-variant); position: relative; margin: 0 auto; }
          .flow-arrow::after { content: ''; position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%); border-width: 6px 5px 0 5px; border-style: solid; border-color: var(--md-sys-color-outline-variant) transparent transparent transparent; }
          .flow-branch-container { display: flex; width: 100%; position: relative; margin-top: 16px; min-width: 450px; }
          /* Locked 50% lines so arrows never misalign */
          .flow-branch-container::before { content: ''; position: absolute; top: 0; left: 25%; width: 50%; height: 2px; background: var(--md-sys-color-outline-variant); }
          .flow-branch-container::after { content: ''; position: absolute; top: -16px; left: 50%; width: 2px; height: 16px; background: var(--md-sys-color-outline-variant); transform: translateX(-50%); }
          .flow-branch { flex: 1 1 50%; width: 50%; display: flex; flex-direction: column; align-items: center; position: relative; padding-top: 16px; padding-inline: 8px; box-sizing: border-box; }
          .flow-branch::before { content: ''; position: absolute; top: 0; left: 50%; width: 2px; height: 16px; background: var(--md-sys-color-outline-variant); transform: translateX(-50%); }
          .flow-branch::after { content: ''; position: absolute; top: 15px; left: 50%; border-width: 6px 5px 0 5px; border-style: solid; border-color: var(--md-sys-color-outline-variant) transparent transparent transparent; transform: translateX(-50%); }
          .branch-label { font-size: 13px; font-weight: 500; margin-bottom: 8px; padding: 2px 8px; z-index: 2; }
          
          /* Notices & FAQ - Now enclosed in their own dedicated card styles */
          .md-notice { background: var(--md-sys-color-surface-container); border: 1px solid var(--md-sys-color-outline-variant); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
          .md-notice-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
          .md-notice-header .material-icons-round { font-size: 18px; color: var(--md-sys-color-primary); }
          .md-notice-label { font-size: 14px; font-weight: 500; color: var(--md-sys-color-primary); }
          .md-notice p { font-size: 13px; line-height: 18px; color: var(--md-sys-color-outline); }
          .faq-section { background: var(--md-sys-color-surface-container); border: 1px solid var(--md-sys-color-outline-variant); padding: 24px; border-radius: 16px; margin-top: 32px; }
          .faq-title { font-size: 18px; font-weight: 500; margin-bottom: 16px; color: var(--md-sys-color-on-background); }
          .faq-item { margin-bottom: 16px; border-left: 2px solid var(--md-sys-color-outline-variant); padding-left: 12px; }
          .faq-q { font-size: 14px; font-weight: 500; color: var(--md-sys-color-primary); margin-bottom: 4px; }
          .faq-a { font-size: 13px; color: var(--md-sys-color-outline); line-height: 1.5; }
          
          .md-btn { display: inline-flex; align-items: center; gap: 8px; background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); border: none; border-radius: 20px; padding: 10px 24px; font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer; transition: transform 0.1s, opacity 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); outline: none; -webkit-tap-highlight-color: transparent; }
          .md-btn:hover { opacity: 0.9; } .md-btn:active { transform: scale(0.98); }
          
          #loading-state, #info-state { display: none; text-align: center; }
          .md-progress { width: 48px; height: 48px; margin: 0 auto 28px; }
          .md-progress svg { width: 100%; height: 100%; animation: md-rotate 1.5s linear infinite; }
          .md-progress circle { fill: none; stroke: var(--md-sys-color-primary); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 100; animation: md-dash 1.5s ease-in-out infinite; }
          @keyframes md-rotate { 100% { transform: rotate(360deg); } } @keyframes md-dash { 0% { stroke-dashoffset: 100; } 50% { stroke-dashoffset: 25; } 100% { stroke-dashoffset: 100; } }
          .md-icon-state { display: none; width: 48px; height: 48px; border-radius: 50%; margin: 0 auto 28px; align-items: center; justify-content: center; }
          .md-icon-state.success { background-color: rgba(109,213,140,0.12); color: var(--md-sys-color-success); } .md-icon-state.error { background-color: rgba(255,180,171,0.12); color: var(--md-sys-color-error); }
          .md-icon-state.show { display: flex; animation: iconPop 0.3s cubic-bezier(0.34,1.56,0.64,1); }
          @keyframes iconPop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .md-chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 500; margin-bottom: 20px; }
          .chip-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
          .md-chip.checking { border-color: var(--md-sys-color-primary); color: var(--md-sys-color-primary); } .md-chip.checking .chip-dot { animation: chipPulse 1.2s ease-in-out infinite; }
          .md-chip.online { border-color: var(--md-sys-color-success); color: var(--md-sys-color-success); } .md-chip.offline { border-color: var(--md-sys-color-error); color: var(--md-sys-color-error); }
          @keyframes chipPulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        </style>
      </head>
      <body>
        
        <div class="top-nav">
          ${isAuthenticated 
            ? `<button class="md-btn" style="background: var(--md-sys-color-success); color: #000;" onclick="startConnection()"><span class="material-icons-round">lan</span>Connect Localhost</button>` 
            : `<button class="md-btn" onclick="location.href='/--login'"><span class="material-icons-round">login</span>Edge Auth</button>`
          }
        </div>

        <!-- Removed .md-card background class from main wrapper, relying purely on sizing and isolated section backgrounds -->
        <div id="main-content" style="width: 100%; max-width: 640px; margin: 0 auto; padding: 80px 16px 40px 16px; box-sizing: border-box;">
          <h1 class="headline">Testing Gateway</h1>
          
          <div class="flowchart">
            <div class="flow-node" style="padding: 10px 16px;">
              <span style="color: var(--md-sys-color-outline);">Visitor →</span> <code>test.amit.is-a.dev</code> <span style="color: var(--md-sys-color-outline);">→ Edge</span>
            </div>
            <div class="flow-arrow"></div>

            <div class="flow-node primary">
              <div class="flow-title">[ 1. Auth Check ]</div>
              <div class="flow-desc">Requires login at the edge.<br>Blocks unverified traffic.</div>
            </div>
            <div class="flow-arrow"></div>

            <div class="flow-node primary">
              <div class="flow-title">[ 2. Health Ping ]</div>
              <div class="flow-desc">Checks Ngrok status before routing</div>
            </div>

            <div class="flow-branch-container">
              <div class="flow-branch">
                <div class="branch-label" style="color: var(--md-sys-color-success);">If PC is ONLINE:</div>
                <div class="flow-desc" style="margin-bottom: 16px; text-align: center;">Worker sets route cookie.</div>
                <div class="flow-arrow" style="height: 16px;"></div>
                <div class="flow-node success">
                  <div class="flow-title">[ Ngrok Tunnel ]</div>
                  <div class="flow-desc">Proxies directly to my<br>localhost server (Port 3000)</div>
                </div>
              </div>

              <div class="flow-branch">
                <div class="branch-label" style="color: var(--md-sys-color-error);">If PC is OFFLINE:</div>
                <div class="flow-desc" style="margin-bottom: 16px; text-align: center;">Worker intercepts 502/<br>8012 errors safely.</div>
                <div class="flow-arrow" style="height: 16px;"></div>
                <div class="flow-node error">
                  <div class="flow-title">[ Firebase Hosting ]</div>
                  <div class="flow-desc">Serves a static Material 3<br>"Node Offline" fallback UI</div>
                </div>
              </div>
            </div>
          </div>

          <div class="md-notice">
            <div class="md-notice-header">
              <span class="material-icons-round">info</span>
              <span class="md-notice-label">Notice — Maintainers</span>
            </div>
            <p>This gateway intercepts all incoming traffic to enforce authentication before reaching the local network via Ngrok. Once verified, routing is seamless.</p>
          </div>

          <div class="md-notice">
            <div class="md-notice-header">
              <span class="material-icons-round">security</span>
              <span class="md-notice-label">Security Notice</span>
            </div>
            <p>Access is strictly governed by Cloudflare. Unauthenticated traffic is dropped instantly. Sessions are highly volatile and destroyed upon browser exit.</p>
          </div>

          <div class="faq-section">
            <div class="faq-title">Frequently Asked Questions</div>
            <div class="faq-item">
              <div class="faq-q">1. What is this gateway?</div>
              <div class="faq-a">It is a secure edge tunnel that protects my local development environment from unauthorized public access and bots.</div>
            </div>
            <div class="faq-item">
              <div class="faq-q">2. Why am I seeing this page?</div>
              <div class="faq-a">You have landed on the public gateway face. Authentication is strictly required to proceed further into the proxied network.</div>
            </div>
            <div class="faq-item">
              <div class="faq-q">3. How does the proxy work?</div>
              <div class="faq-a">Cloudflare verifies your session, pings the Ngrok tunnel, and securely proxies traffic directly to the local port if the PC is online.</div>
            </div>
            <div class="faq-item">
              <div class="faq-q">4. What happens if the local PC is offline?</div>
              <div class="faq-a">The edge worker intercepts the timeout or Bad Gateway errors and safely presents a fallback maintenance UI.</div>
            </div>
            <div class="faq-item">
              <div class="faq-q">5. Is my connection secure?</div>
              <div class="faq-a">Yes. All traffic is enforced over HTTPS and blocked at the edge level before it ever touches the local network. Passwords are not saved.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Adding 'margin: auto' perfectly centers this connection card vertically inside the flex body when main-content is hidden -->
      <div class="md-card" id="connection-ui" style="max-width: 444px; display: none; margin: auto;">
        <div id="loading-state" style="display:block;">
          <div class="md-progress" id="spinner">
            <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20"/></svg>
            </div>
            <div class="md-icon-state success" id="icon-success"><span class="material-icons-round">check</span></div>
            <div class="md-icon-state error" id="icon-error"><span class="material-icons-round">cloud_off</span></div>
            
            <div class="md-chip checking" id="status-chip">
              <span class="chip-dot"></span><span id="chip-label">Checking</span>
            </div>
            <h2 class="headline" id="status-title" style="margin-bottom:6px; font-size:24px;">Locating server</h2>
            <p style="color: var(--md-sys-color-outline); font-size:14px;" id="status-sub">Connecting to development environment…</p>
          </div>
        </div>

        <script>
          const spinner = document.getElementById('spinner');
          const iconOk = document.getElementById('icon-success');
          const iconErr = document.getElementById('icon-error');
          const chip = document.getElementById('status-chip');
          const chipLabel = document.getElementById('chip-label');
          const titleEl = document.getElementById('status-title');
          const subEl = document.getElementById('status-sub');

          function startConnection() {
            document.getElementById('main-content').style.display = 'none';
            document.getElementById('connection-ui').style.display = 'block';
            
            setTimeout(() => {
              fetch('/--check-connection')
                .then(r => r.json())
                .then(d => d.status === 'online' ? onOnline() : onOffline())
                .catch(() => onOffline());
            }, 800);
          }

          function onOnline() {
            spinner.style.display = 'none';
            iconOk.classList.add('show');
            chip.className = 'md-chip online'; chipLabel.textContent = 'Online';
            titleEl.textContent = 'Connection established';
            subEl.textContent = 'Redirecting to development server…';
            
            setTimeout(() => window.location.href = '/--enable-local', 1800);
          }

          function onOffline() {
            spinner.style.display = 'none';
            iconErr.classList.add('show');
            chip.className = 'md-chip offline'; chipLabel.textContent = 'Offline';
            titleEl.textContent = 'Server offline';
            subEl.textContent = 'Development environment is currently inactive.';
            
            setTimeout(() => window.location.reload(), 4000);
          }
        </script>
      </body>
      </html>
      `;
      return new Response(landingHTML, { headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-store" }});
    }

    // ==========================================
    // 5. SAFE PROXY HELPER & PING ENDPOINT
    // ==========================================
    async function safeProxy(targetUrl, originalReq, extraHeaders = {}) {
      const proxyHeaders = new Headers(originalReq.headers);
      proxyHeaders.delete("Host"); 
      for (const [key, val] of Object.entries(extraHeaders)) proxyHeaders.set(key, val);

      const fetchConfig = { method: originalReq.method, headers: proxyHeaders, redirect: "manual" };
      if (originalReq.method !== "GET" && originalReq.method !== "HEAD") fetchConfig.body = originalReq.body;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); 
        const res = await fetch(targetUrl, { ...fetchConfig, signal: controller.signal });
        clearTimeout(timeoutId);
        return res;
      } catch (e) { return null; }
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
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" } 
      });
    }

    // ==========================================
    // 6. THE GATEKEEPER: BLOCK UNVERIFIED TRAFFIC
    // ==========================================
    if (!isAuthenticated) {
      return new Response("Redirecting to Gateway...", {
        status: 302,
        headers: { "Location": "/" }
      });
    }

    // ==========================================
    // 7. ROUTING TO LOCALHOST OR FIREBASE
    // ==========================================
    if (isLocalRouted) {
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
    
    // --- Default / Fallback ---
    const fbTarget = FIREBASE_FALLBACK_URL + url.pathname + url.search;
    let fbResponse = await safeProxy(fbTarget, request);
    
    if (!fbResponse) {
      return new Response(
        `System Error: The assigned Fallback Server (${FIREBASE_FALLBACK_URL}) is offline.`, 
        { status: 502, headers: { "Content-Type": "text/plain" } }
      );
    }

    return new Response(fbResponse.body, {
        status: fbResponse.status,
        headers: { ...fbResponse.headers, "Cache-Control": "no-store" }
    });
  }
};
