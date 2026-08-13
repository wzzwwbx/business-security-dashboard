#!/usr/bin/env node
// 为离线 Windows 包生成 node_modules/.bin 下的 .cmd / .ps1 启动器（npm cmd-shim 格式）。
// 原因：macOS 上 npm install 生成的是符号链接 + bash 脚本，Windows cmd.exe 无法执行，
//       必须提供 vite.cmd / vue-tsc.cmd 等（与 npm 在 Windows 上安装时生成的完全一致）。
// 用法: node deploy/win-bins.cjs <node_modules目录>
// 例如: node deploy/win-bins.cjs /tmp/frontend-win64/node_modules
'use strict';

const fs = require('fs');
const path = require('path');

const nmDir = process.argv[2];
if (!nmDir) {
  console.error('用法: node deploy/win-bins.cjs <node_modules目录>');
  process.exit(1);
}
const binDir = path.join(nmDir, '.bin');
if (!fs.existsSync(binDir)) {
  console.error(`不存在: ${binDir}`);
  process.exit(1);
}

let n = 0;
for (const entry of fs.readdirSync(binDir)) {
  if (entry.startsWith('.') || entry.endsWith('.cmd') || entry.endsWith('.ps1')) continue;
  const abs = path.join(binDir, entry);
  let target;
  try {
    target = fs.readlinkSync(abs); // 相对路径，如 ../vite/bin/vite.js
  } catch {
    continue; // 非符号链接（Windows 上解压产生的普通文件）跳过
  }
  const winTarget = target.split(path.sep).join('/'); // 统一正斜杠

  // ---- .cmd ----
  const cmd = [
    '@ECHO off',
    'GOTO start',
    ':find_dp0',
    'SET dp0=%~dp0',
    'EXIT /b',
    ':start',
    'SETLOCAL',
    'CALL :find_dp0',
    '',
    'IF EXIST "%dp0%\\node.exe" (',
    '  SET "_prog=%dp0%\\node.exe"',
    ') ELSE (',
    '  SET "_prog=node"',
    '  SET PATHEXT=%PATHEXT:;.JS;=;%',
    ')',
    '',
    'endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\' +
      winTarget.split('/').join('\\') + '" %*'
  ].join('\r\n') + '\r\n';
  fs.writeFileSync(abs + '.cmd', cmd);

  // ---- .ps1 ----
  const ps1 = [
    '#!/usr/bin/env pwsh',
    '$basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent',
    '',
    '$exe=""',
    'if ($PSVersionTable.PSVersion -lt "6.0" -or $IsWindows) {',
    '  # Fix case when both the Windows and Linux builds of Node',
    '  # are installed in the same directory',
    '  $exe=".exe"',
    '}',
    '$ret=0',
    'if (Test-Path "$basedir/node$exe") {',
    '  # Support pipeline input',
    '  if ($MyInvocation.ExpectingInput) {',
    '    $input | & "$basedir/node$exe"  "$basedir/' + winTarget + '" $args',
    '  } else {',
    '    & "$basedir/node$exe"  "$basedir/' + winTarget + '" $args',
    '  }',
    '  $ret=$LASTEXITCODE',
    '} else {',
    '  # Support pipeline input',
    '  if ($MyInvocation.ExpectingInput) {',
    '    $input | & "node$exe"  "$basedir/' + winTarget + '" $args',
    '  } else {',
    '    & "node$exe"  "$basedir/' + winTarget + '" $args',
    '  }',
    '  $ret=$LASTEXITCODE',
    '}',
    'exit $ret'
  ].join('\r\n') + '\r\n';
  fs.writeFileSync(abs + '.ps1', ps1);

  console.log(`  ${entry} -> ${winTarget}`);
  n++;
}
console.log(`已生成 ${n} 组 .cmd/.ps1 启动器`);
