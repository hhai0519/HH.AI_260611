const path = require('path');
const fs = require('fs');

function resolveWorkspaceRoot(callerDir, maxDepth = 10) {
  if (process.env.WORKSPACE_ROOT) {
    const resolved = path.resolve(process.env.WORKSPACE_ROOT);
    if (fs.existsSync(path.join(resolved, '.env.local'))) return resolved;
    console.warn(
      `[WorkspaceLoader] ⚠️ WORKSPACE_ROOT="${resolved}" 找不到 .env.local，` +
      `將改用目錄迭代推導。請確認環境變數設定正確。`
    );
  }

  let current = callerDir;
  for (let i = 0; i < maxDepth; i++) {
    if (fs.existsSync(path.join(current, '.env.local'))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  
  return path.resolve(callerDir, '../../../../');
}

function loadWorkspaceEnv(callerDir) {
  const root = resolveWorkspaceRoot(callerDir);
  require('dotenv').config({ path: path.join(root, '.env.local') });
  return root;
}

module.exports = { resolveWorkspaceRoot, loadWorkspaceEnv };
