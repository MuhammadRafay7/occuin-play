export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) return new Response("Missing URL", { status: 400 });

    try {
      const allowedDomains = ["vidsrc.me", "vidlink.pro", "autoembed.cc", "m3u8"];
      const targetHost = new URL(targetUrl).hostname;
      
      if (!allowedDomains.some(d => targetHost.endsWith(d))) {
        return new Response("Forbidden target domain", { status: 403 });
      }

      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": new URL(targetUrl).origin,
        },
      });

      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (err) {
      return new Response("Proxy Error: " + err.message, { status: 500 });
    }
  },
};
