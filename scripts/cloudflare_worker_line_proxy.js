/**
 * ☁️ Cloudflare Worker Edge Gateway (v20.0 Master)
 * 1. 轉發 LINE Webhook 至動態本機隧道 (LOCAL_TUNNEL_URL)
 * 2. 提供 /admin/update-tunnel 特權 API，攜帶 X-Internal-Gateway-Token 完成即時同步
 * 3. 依賴 KV Namespace Binding: TUNNEL_KV (Cloudflare Console 設定)
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 特權 API：更新本機 Tunnel URL (/admin/update-tunnel)
    if (url.pathname === '/admin/update-tunnel' && request.method === 'POST') {
      const authHeader = request.headers.get('X-Internal-Gateway-Token');
      const expectedToken = env.INTERNAL_GATEWAY_TOKEN || 'gw_tok_92e811c402a73b56a1008f1c';

      if (!authHeader || authHeader !== expectedToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const body = await request.json();
        if (body && body.tunnel_url) {
          if (env.TUNNEL_KV) {
            await env.TUNNEL_KV.put('LOCAL_TUNNEL_URL', body.tunnel_url);
          }
          return new Response(JSON.stringify({ success: true, updated_url: body.tunnel_url }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400 });
      }
    }

    // 標準 Webhook 轉發 (/webhook)
    if (url.pathname === '/webhook' && request.method === 'POST') {
      let targetTunnelUrl = null;
      if (env.TUNNEL_KV) {
        targetTunnelUrl = await env.TUNNEL_KV.get('LOCAL_TUNNEL_URL');
      }
      if (!targetTunnelUrl) {
        targetTunnelUrl = env.LOCAL_TUNNEL_URL;
      }

      if (!targetTunnelUrl) {
        return new Response('No local tunnel URL configured', { status: 502 });
      }

      const forwardUrl = `${targetTunnelUrl.replace(/\/$/, '')}/webhook`;
      const bodyText = await request.text();

      ctx.waitUntil(
        fetch(forwardUrl, {
          method: 'POST',
          headers: request.headers,
          body: bodyText
        }).catch(err => console.error('Forward Error:', err))
      );

      // 17ms 極速簽收
      return new Response('OK', { status: 200 });
    }

    return new Response('Cloudflare Worker Gateway Online', { status: 200 });
  }
};
