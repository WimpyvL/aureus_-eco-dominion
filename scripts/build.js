import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const tscScript = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const viteScript = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');

function run(command, args) {
    const result = spawnSync(command, args, {
        stdio: 'inherit',
        shell: false,
        cwd: repoRoot,
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

run(process.execPath, [tscScript, '--noEmit']);
run(process.execPath, [viteScript, 'build']);
