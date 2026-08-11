@echo off
chcp 65001 >nul
setlocal
REM ============================================================
REM  启动便携版 MySQL（若已在运行则跳过）
REM  用法: start-mysql.bat [MySQL解压目录] [数据目录] [端口]
REM  示例: start-mysql.bat C:\bss\mysql-8.4.4-winx64 C:\bss\mysql-data 3306
REM  注意: 首次使用前请先执行 init-mysql.bat 完成初始化。
REM ============================================================

set "MYSQL_HOME=%~1"
if "%MYSQL_HOME%"=="" set "MYSQL_HOME=C:\bss\mysql-8.4.4-winx64"
set "DATA_DIR=%~2"
if "%DATA_DIR%"=="" set "DATA_DIR=C:\bss\mysql-data"
set "MYSQL_PORT=%~3"
if "%MYSQL_PORT%"=="" set "MYSQL_PORT=3306"

if not exist "%MYSQL_HOME%\bin\mysqld.exe" (
  echo [错误] 未找到 mysqld.exe: %MYSQL_HOME%\bin\mysqld.exe
  exit /b 1
)
if not exist "%DATA_DIR%" (
  echo [错误] 数据目录不存在: %DATA_DIR%
  echo        首次使用请先执行: init-mysql.bat "%MYSQL_HOME%" "%DATA_DIR%" %MYSQL_PORT%
  exit /b 1
)

REM ---- 已在运行则跳过 ----
"%MYSQL_HOME%\bin\mysqladmin" -h127.0.0.1 -P%MYSQL_PORT% -uroot -proot ping >nul 2>&1
if not errorlevel 1 (
  echo MySQL 已在运行（端口 %MYSQL_PORT%），无需重复启动。
  endlocal
  exit /b 0
)

echo 启动便携版 MySQL（端口 %MYSQL_PORT%）...
start "bss-mysql" cmd /k ""%MYSQL_HOME%\bin\mysqld" --console --basedir="%MYSQL_HOME%" --datadir="%DATA_DIR%" --port=%MYSQL_PORT% --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci"

set "READY="
for /l %%i in (1,1,30) do (
  "%MYSQL_HOME%\bin\mysqladmin" -h127.0.0.1 -P%MYSQL_PORT% -uroot -proot ping >nul 2>&1
  if not errorlevel 1 set "READY=1"
  if defined READY goto :ready
  timeout /t 1 /nobreak >nul
)
:ready
if not defined READY (
  echo [警告] MySQL 未在预期时间内就绪，请检查 3306 端口或数据目录。
  exit /b 1
)
echo MySQL 就绪（窗口标题 bss-mysql）。
endlocal
