import * as path from 'path';
const { resolveWorkspaceRoot } = require('../../../../../../Modules/shared/workspaceLoader.js');
const WORKSPACE_ROOT = resolveWorkspaceRoot(__dirname);
const sharedDlp = require(path.join(WORKSPACE_ROOT, 'Modules', 'shared', 'dlpSanitizer.js'));

export const sanitizeDlp = sharedDlp.sanitizeDlp as (text: string) => string;
