module.exports = {
  apps: [
    {
      name: "line-bridge",
      script: "bridge.js",
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: "cloudflare-tunnel",
      script: "..\\..\\cloudflared.exe",
      args: "tunnel --url http://localhost:3000",
      autorestart: true,
    }
  ]
};
