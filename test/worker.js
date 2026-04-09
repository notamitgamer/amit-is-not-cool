export default {
  async fetch(request) {
    // === CONFIGURATION ===
    // 1. The permanent URL of your PC's cloudflared tunnel
    const LOCAL_TUNNEL_URL = "https://dda4dba6-997d-40e8-aa24-8b8143bf5af8.cfargotunnel.com"; 
    // 2. The Firebase URL where your M3 HTML is hosted
    const FIREBASE_FALLBACK_URL = "https://localtestdomain.web.app"; 
    
    const url = new URL(request.url);

    // --- API ROUTE: Used by the HTML page to check server status ---
    if (url.pathname === "/--check-connection") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout
        
        const response = await fetch(LOCAL_TUNNEL_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        // 502/530 means tunnel is up but PC is off
        if (response.status >= 500) throw new Error("Offline");
        return new Response(JSON.stringify({ status: "online" }), { headers: { "Content-Type": "application/json" }});
      } catch (e) {
        return new Response(JSON.stringify({ status: "offline" }), { headers: { "Content-Type": "application/json" }});
      }
    }

    // --- PROXY ROUTER ---
    const cookies = request.headers.get("Cookie") || "";
    
    // If the browser knows the PC is online, proxy to the Local PC
    if (cookies.includes("route_target=local")) {
      try {
        let response = await fetch(LOCAL_TUNNEL_URL + url.pathname + url.search, request);
        // If the PC suddenly went offline, clear the cookie and fallback
        if (response.status >= 500) {
            return new Response("Connection lost. Reloading...", {
              status: 302,
              headers: { "Location": "/", "Set-Cookie": "route_target=; path=/; max-age=0" }
            });
        }
        return response;
      } catch (e) {
        // Fallback on error
        return new Response("Error. Reloading...", {
            status: 302,
            headers: { "Location": "/", "Set-Cookie": "route_target=; path=/; max-age=0" }
        });
      }
    }
    
    // Default Behavior: Fetch the Firebase HTML Splash/Fallback page
    // We proxy it so the URL stays test.ammit.is-a.dev
    let fbResponse = await fetch(FIREBASE_FALLBACK_URL + url.pathname + url.search, request);
    return new Response(fbResponse.body, {
        status: fbResponse.status,
        headers: fbResponse.headers
    });
  }
};