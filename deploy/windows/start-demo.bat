@echo off
chcp 65001 >nul
setlocal
REM ============================================================
REM  业务安全态势系统 - Windows 一键演示启动
REM  步骤: 1) 检测/拉起 MySQL (3306)
REM        2) 新窗口启动后端 (8080)
REM        3) 启动 nginx 托管前端 + 反代 /api (8081)
REM  停止: 执行 stop-demo.bat
REM ============================================================

set "MYSQL_HOME=C:\bss\mysql-8.4.4-winx64"
set "NGINX_HOME=C:\bss\nginx-1.27.4"
if defined BSS_MYSQL_HOME set "MYSQL_HOME=%BSS_MYSQL_HOME%"
if defined BSS_NGINX_HOME set "NGINX_HOME=%BSS_NGINX_HOME%"

echo ============================================================
echo  业务安全态势系统 - Windows 演示部署
echo ============================================================

REM ---- 1. MySQL ----
echo [1/3] 检查 MySQL (127.0.0.1:3306) ...
set "MYSQL_READY="
"%MYSQL_HOME%\bin\mysqladmin" -h127.0.0.1 -P3306 -uroot -proot ping >nul 2>&1
if not errorlevel 1 set "MYSQL_READY=1"

if not defined MYSQL_READY (
  echo        未检测到 MySQL 服务，尝试启动便携版...
  call "%~dp0start-mysql.bat" "%MYSQL_HOME%" C:\bss\mysql-data 3306
  "%MYSQL_HOME%\bin\mysqladmin" -h127.0.0.1 -P3306 -uroot -proot ping >nul 2>&1
  if not errorlevel 1 set "MYSQL_READY=1"
)

if not defined MYSQL_READY (
  echo [错误] MySQL 不可用。请任选其一：
  echo        1、安装 MySQL 8 并注册服务（root 密码 root），或
  echo        2、先执行 init-mysql.bat 初始化便携版，再重跑本脚本。
  goto :fail
)
echo        MySQL 就绪。

REM ---- 2. 后端 ----
echo [2/3] 启动后端 (http://127.0.0.1:8080) ...
start "bss-backend" cmd /k call "%~dp0start-backend.bat"

echo        等待后端就绪（首次约 20~40 秒）...
set "BACKEND_READY="
for /l %%i in (1,1,60) do (
  curl -s -o nul http://127.0.0.1:8080/actuator/health 2>nul
  if not errorlevel 1 set "BACKEND_READY=1"
  if defined BACKEND_READY goto :backend_ok
  timeout /t 1 /nobreak >nul
)
:backend_ok
if not defined BACKEND_READY (
  echo [警告] 后端 60 秒内未就绪。请查看 bss-backend 窗口日志：
  echo        常见原因：MySQL 口令不对 / 端口 8080 被占用 / jar 缺失。
  echo        后端就绪后仍可继续访问前端（部分接口将显示 Mock 回退）。
)

REM ---- 3. nginx ----
echo [3/3] 启动 nginx 前端 (http://localhost:8081) ...
if exist "%NGINX_HOME%\nginx.exe" (
  start "bss-nginx" /min cmd /k ""%NGINX_HOME%\nginx.exe" -p "%NGINX_HOME%" -c conf/nginx.conf"
  timeout /t 2 /nobreak >nul
  curl -s -o nul http://127.0.0.1:8081/ >nul 2>&1
  if errorlevel 1 (
    echo [提示] nginx 已启动，但 8081 端口暂未响应，请检查 conf\nginx.conf 的 root 路径。
  )
) else (
  echo [提示] 未找到 %NGINX_HOME%\nginx.exe
  echo        请解压 nginx 到该目录，并把 deploy\windows\nginx-windows.conf 替换到 conf\nginx.conf。
  echo        或用任意静态服务器托管 frontend\dist（需自行处理 /api 反向代理）。
)

echo.
echo ============================================================
echo  启动完成
echo   演示入口   : http://localhost:8081   （preview 模式，免登录）
echo   健康检查   : http://127.0.0.1:8080/actuator/health
echo   运维闭环   : /ops  （后端自动灌入演示数据）
echo   停止        : stop-demo.bat
echo ============================================================
endlocal
exit /b 0

:fail
echo.
echo 启动中止。
endlocal
exit /b 1
