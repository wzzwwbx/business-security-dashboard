import { existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(scriptDir, '..');
const distDir = resolve(frontendDir, 'dist');
const archivePath = resolve(frontendDir, 'dist.zip');

function removeSystemMetadata(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);
    if (entry.name === '.DS_Store' || entry.name.startsWith('._')) {
      rmSync(entryPath, { recursive: true, force: true });
    } else if (entry.isDirectory()) {
      removeSystemMetadata(entryPath);
    }
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(distDir)) {
  throw new Error(`Missing build output: ${distDir}`);
}

rmSync(archivePath, { force: true });
removeSystemMetadata(distDir);

if (process.platform === 'win32') {
  const quotePowerShell = (value) => `'${value.replaceAll("'", "''")}'`;
  const command = `Compress-Archive -Path ${quotePowerShell(distDir)} -DestinationPath ${quotePowerShell(archivePath)} -Force`;
  run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command]);
} else {
  run('zip', ['-qr', archivePath, 'dist', '-x', '*/.DS_Store', '*/._*'], { cwd: frontendDir });
}

console.log(`Created ${archivePath}`);
