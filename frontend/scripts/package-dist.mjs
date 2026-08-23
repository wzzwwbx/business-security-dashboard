import { existsSync, rmSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(scriptDir, '..');
const distDir = resolve(frontendDir, 'dist');
const archivePath = resolve(frontendDir, 'dist.tar.gz');

if (!existsSync(resolve(distDir, 'index.html'))) {
  throw new Error(`Missing build output: ${distDir}`);
}

rmSync(archivePath, { force: true });

const result = spawnSync('tar', [
  '-czf',
  archivePath,
  '--exclude=._*',
  '--exclude=.DS_Store',
  '-C',
  frontendDir,
  'dist'
], {
  stdio: 'inherit',
  env: { ...process.env, COPYFILE_DISABLE: '1' }
});

if (result.error) {
  console.error(`Unable to run tar: ${result.error.message}`);
  console.error('请确认系统已安装 tar：Windows 10 1803+、macOS 和 Linux 通常已自带。');
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`tar failed with exit code ${result.status ?? 'unknown'}`);
  console.error('请确认系统已安装 tar：Windows 10 1803+、macOS 和 Linux 通常已自带。');
  process.exit(result.status ?? 1);
}

const sizeMb = (statSync(archivePath).size / 1024 / 1024).toFixed(1);
console.log(`Created ${archivePath} (${sizeMb} MB)`);
