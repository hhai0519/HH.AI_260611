const express = require('express');
const axios = require('axios');
const { spawn } = require('child_process');

let sshProcess = null;
const lineConfig = { channelAccessToken: 'DUMMY' };

function startPinggyDaemon() {
  sshProcess = spawn('ssh', [
    '-p', '443', 
    '-R0:localhost:3000', 
    '-o', 'StrictHostKeyChecking=no', 
    '-o', 'ServerAliveInterval=30', 
    'a.pinggy.io'
  ], { 
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'] 
  });

  const handleOutput = async (data) => {
    const output = data.toString();
    const matches = output.match(/https:\/\/[a-z0-9.-]+\.(?:trycloudflare\.com|cloudflare\.com|free\.pinggy\.link|pinggy\.io|pinggy\.net|pinggy-free\.link)/g);
    
    if (matches && matches.length > 0) {
      const latestTunnelUrl = matches[matches.length - 1];
      const newWebhookEndpoint = latestTunnelUrl + '/webhook';
    }
  };

  sshProcess.stdout.on('data', handleOutput);
  sshProcess.stderr.on('data', handleOutput);

  sshProcess.on('close', (code) => {
    sshProcess = null;
    setTimeout(startPinggyDaemon, 3000);
  });
}
startPinggyDaemon();
