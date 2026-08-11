@echo off
chcp 65001 >nul
setlocal
REM ============================================================
REM  停止演示环境（nginx / 后端窗口 / 便携 MySQL）
REM  注意: 若本机 MySQL 是 Windows 服务，本脚本不会停服务。
REM ============================================================

set "NGINX_HOME=C:\bss\nginx-1.27.4"
if defined BSS_NGINX_HOME set "NGINX_HOME=%BSS_NGINX_HOME%"

echo [1/3] 停止 nginx ...
if exist "%NGINX_HOME%\nginx.exe" (
  "%NGINX_HOME%\nginx.exe" -p "%NGINX_HOME%" -s stop >nul 2>&1
)
taskkill /F /IM nginx.exe >nul 2>&1

echo [2/3] 关闭后端窗口 ...
taskkill /F /FI "WINDOWTITLE eq bss-backend*" >nul 2>&1

echo [3/3] 关闭便携 MySQL 窗口（若为服务则不受影响）...
taskkill /F /FI "WINDOWTITLE eq bss-mysql*" >nul 2>&1

echo.
echo 已停止。如需彻底关闭 MySQL 服务，请执行:
echo   net stop MySQL80    （服务名以实际安装为准）
endlocal
