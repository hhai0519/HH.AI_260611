const { execSync } = require('child_process');

// 🛡️ [SOP14 Audited] Platform check to prevent command execution crashes on non-Windows platforms
if (process.platform !== 'win32') {
  console.error('[Error] This zombie cleanup script only supports Windows OS.');
  process.exit(1);
}

try {
  // Query all active node.exe processes with CommandLines
  const output = execSync('wmic process where "name=\'node.exe\'" get ProcessID, CommandLine').toString();
  const lines = output.split('\r\n').map(l => l.trim()).filter(Boolean);
  
  console.log('[System] Scanning active Node.exe processes for zombie listeners...');
  
  // 🛡️ [SOP14 Audited] Precision path regex boundary filter to prevent false positives (like project directories containing the script name)
  const targetRegex = /(?:\s|^|[\\/])(start_line\.js|poll_inbox\.js|start_tg\.js|poll_tg\.js)(?:\s|$|['"])/;
  
  let foundZombie = false;
  for (const line of lines) {
    if (targetRegex.test(line)) {
      const tokens = line.split(/\s+/);
      const pid = tokens[tokens.length - 1];
      
      // 🛡️ [SOP14 Audited] Ensure PID is strictly digits to prevent Command Injection, and guard against self-termination
      if (/^\d+$/.test(pid) && pid !== String(process.pid)) {
        foundZombie = true;
        console.log(`[Target Lock] Found zombie process: PID=${pid}, Command=${line}`);
        try {
          execSync(`taskkill /F /PID ${pid}`);
          console.log(`[Success] Terminated PID ${pid} successfully.`);
        } catch (e) {
          console.error(`[Error] Failed to terminate PID ${pid}:`, e.message);
        }
      }
    }
  }
  
  if (!foundZombie) {
    console.log('[Clean] No matching zombie start_line.js or poll_inbox.js processes detected.');
  }
} catch (err) {
  console.error('[Error] Failed to list or manage Node processes:', err.message);
}
