# ============================================================
#  业务安全态势系统 - 离线依赖打包脚本（在联网 Windows 机器上运行）
#
#  作用：把离线环境开发/部署所需的一切都打包到 dist-offline-win64\：
#    1) 前端构建产物 frontend\dist
#    2) 前端 node_modules（离线前端开发，免 npm install）
#    3) 后端 jar（运行后端，免 Maven）
#    4) ~/.m2 本地 Maven 仓库（离线后端开发，mvn -o）
#    5) 部署脚本 / SQL / 文档
#    6) 需要手动携带的安装包清单（JDK/Node/MySQL/nginx/Maven）
#
#  用法：powershell -ExecutionPolicy Bypass -File deploy\windows\prepare-offline.ps1 [-OutDir C:\bss\dist-offline-win64]
#  前置：已安装 Node.js 20+、JDK 17、Maven 3.9，且在仓库根目录下运行
# ============================================================
param(
  [string]$OutDir = "dist-offline-win64"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$outRoot  = Join-Path $repoRoot $OutDir

function Invoke-Checked {
  param([string]$Label, [scriptblock]$Block)
  Write-Host "[$Label] ..." -ForegroundColor Cyan
  & $Block
  if ($LASTEXITCODE -ne 0) { throw "[$Label] 失败 (exit=$LASTEXITCODE)" }
  Write-Host "[$Label] OK" -ForegroundColor Green
}

function Copy-DirChecked {
  param([string]$Src, [string]$Dst, [string]$Label)
  Write-Host "[$Label] 拷贝 $Src -> $Dst" -ForegroundColor Cyan
  $null = New-Item -ItemType Directory -Force -Path $Dst
  robocopy $Src $Dst /E /NFL /NDL /NJH /NJS /NP | Out-Null
  # robocopy 退出码 0-7 均表示成功
  if ($LASTEXITCODE -gt 7) { throw "[$Label] robocopy 失败 (exit=$LASTEXITCODE)" }
  Write-Host "[$Label] OK" -ForegroundColor Green
}

# ---------- 0. 校验工具 ----------
Write-Host "==== 工具校验 ====" -ForegroundColor Yellow
foreach ($tool in @("node", "npm", "mvn", "java")) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "缺少工具: $tool （需先安装）"
  }
  Write-Host "  $tool  ->  $((& $tool --version 2>&1 | Select-Object -First 1))"
}

# ---------- 1. 前端构建 ----------
Write-Host "==== 前端构建 ====" -ForegroundColor Yellow
Invoke-Checked "npm ci"        { Push-Location (Join-Path $repoRoot "frontend"); npm ci; if ($LASTEXITCODE -ne 0) { Pop-Location; throw "npm ci 失败" }; Pop-Location }
Invoke-Checked "npm run build" { Push-Location (Join-Path $repoRoot "frontend"); npm run build; if ($LASTEXITCODE -ne 0) { Pop-Location; throw "build 失败" }; Pop-Location }

$distDir = Join-Path $repoRoot "frontend\dist"
if (-not (Test-Path (Join-Path $distDir "maps\world-110m.json"))) {
  throw "frontend\dist\maps\world-110m.json 缺失，构建可能不完整"
}

# ---------- 2. 后端构建（顺带灌满 ~/.m2） ----------
Write-Host "==== 后端构建 ====" -ForegroundColor Yellow
Invoke-Checked "mvn package" { Push-Location $repoRoot; mvn -B -DskipTests -f backend\pom.xml package; if ($LASTEXITCODE -ne 0) { Pop-Location; throw "mvn 失败" }; Pop-Location }

# ---------- 3. 组装离线包目录 ----------
Write-Host "==== 组装离线包 ====" -ForegroundColor Yellow
$backendOut = Join-Path $outRoot "backend"
$frontendOut = Join-Path $outRoot "frontend"
$depsOut = Join-Path $outRoot "offline-deps"
$null = New-Item -ItemType Directory -Force -Path $backendOut, $frontendOut, $depsOut

Copy-Item (Join-Path $repoRoot "backend\target\business-security-dashboard-0.1.0.jar") $backendOut
Copy-DirChecked (Join-Path $repoRoot "frontend\dist") (Join-Path $frontendOut "dist") "拷贝 frontend\dist"

# ---------- 4. 前端依赖（离线开发用） ----------
Copy-DirChecked (Join-Path $repoRoot "frontend\node_modules") (Join-Path $depsOut "node_modules") "拷贝 node_modules"

# ---------- 5. Maven 本地仓库（离线后端开发用） ----------
$m2Repo = Join-Path $env:USERPROFILE ".m2\repository"
if (Test-Path $m2Repo) {
  Copy-DirChecked $m2Repo (Join-Path $depsOut "m2-repository") "拷贝 ~/.m2\repository"
} else {
  Write-Host "[警告] 未找到 $m2Repo，将跳过 Maven 离线仓库" -ForegroundColor Yellow
}

# ---------- 6. SQL / 脚本 / 文档 ----------
$schema = Join-Path $repoRoot "database\mysql\schema.sql"
if (Test-Path $schema) {
  $null = New-Item -ItemType Directory -Force -Path (Join-Path $outRoot "database\mysql")
  Copy-Item $schema (Join-Path $outRoot "database\mysql")
}
$winDeploy = Join-Path $outRoot "deploy\windows"
$null = New-Item -ItemType Directory -Force -Path $winDeploy
Copy-Item (Join-Path $repoRoot "deploy\windows\*") $winDeploy -Recurse
Copy-Item (Join-Path $repoRoot "deploy\windows\README.md") (Join-Path $outRoot "README.md")
Copy-Item (Join-Path $repoRoot "README.md") (Join-Path $outRoot "README-repo.md") -ErrorAction SilentlyContinue

# 探针（Linux ARM 用，可选；本机没有就跳过）
if (Test-Path (Join-Path $repoRoot "probe\target\business-security-probe-0.1.0.jar")) {
  $null = New-Item -ItemType Directory -Force -Path (Join-Path $outRoot "probe")
  Copy-Item (Join-Path $repoRoot "probe\target\business-security-probe-0.1.0.jar") (Join-Path $outRoot "probe\business-security-probe-0.1.0.jar")
}

# ---------- 7. 安装包清单（需手动携带） ----------
$checklist = @"
离线环境需手动携带的安装包清单
================================

1. JDK 17 LTS（Temurin）
   运行后端只需 JRE；离线开发需要 JDK（javac）。
   下载: https://adoptium.net/temurin/releases/?version=17

2. Node.js 20 LTS（前端开发/构建；Vite 6 要求 18+/20+/22+）
   下载: https://nodejs.org/dist/latest-v20.x/

3. MySQL 8（8.0.x 或 8.4 LTS）
   方式A: MySQL Installer MSI（安装为 Windows 服务）
   方式B: 免安装 ZIP（本包 deploy\windows\init-mysql.bat 可初始化）
   下载: https://dev.mysql.com/downloads/mysql/

4. nginx 1.27.x Windows 版（前端托管 + /api 反向代理）
   下载: https://nginx.org/en/download.html （nginx-x.y.z.zip）

5. Maven 3.9.x（仅离线后端开发需要；只跑演示不需要）
   下载: https://maven.apache.org/download.cgi （apache-maven-x.y.z-bin.zip）

离线包内容说明
--------------------------------
  backend\business-security-dashboard-0.1.0.jar   后端（JRE 17 即可运行）
  frontend\dist\                                  前端构建产物（preview 免登录模式）
  offline-deps\node_modules\                      前端依赖（拷回 frontend\node_modules）
  offline-deps\m2-repository\                     Maven 仓库（拷到 %USERPROFILE%\.m2\repository）
  deploy\windows\                                 启动/停止/初始化脚本 + nginx 配置
  database\mysql\schema.sql                       建表 SQL（后端启动会自动建表，此文件备用）

离线部署（纯演示）
--------------------------------
  1. 安装 JDK 17 + MySQL 8（或用 init-mysql.bat 初始化便携版）+ nginx
  2. 执行 deploy\windows\start-demo.bat
  3. 浏览器打开 http://localhost:8081

离线开发
--------------------------------
  前端: 把 offline-deps\node_modules 拷回仓库 frontend\node_modules，然后
        npm run dev:integration
  后端: 把 offline-deps\m2-repository 拷到 %USERPROFILE%\.m2\repository，
        安装 Maven 后使用 mvn -o 离线编译

详见离线包内 README.md（deploy\windows\README.md）
"@
Set-Content -Path (Join-Path $outRoot "INSTALLERS-CHECKLIST.txt") -Value $checklist -Encoding UTF8

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " 离线包已生成: $outRoot" -ForegroundColor Green
Write-Host " 请阅读 INSTALLERS-CHECKLIST.txt 并携带其中列出的安装包" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
