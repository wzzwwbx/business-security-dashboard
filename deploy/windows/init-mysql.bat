@echo off
chcp 65001 >nul
setlocal
REM ============================================================
REM  便携版 MySQL 8 首次初始化（免安装）
REM  用法: init-mysql.bat [MySQL解压目录] [数据目录] [端口]
REM  示例: init-mysql.bat C:\bss\mysql-8.4.4-winx64 C:\bss\mysql-data 3306
REM  说明: 1) 初始化数据目录(root 初始密码为空)
REM        2) 启动 MySQL(新窗口)
REM        3) root 密码改为 root
REM        4) 创建数据库 business_security_dashboard (utf8mb4)
REM  之后每次启动用 start-mysql.bat，不要重复执行本脚本。
REM ============================================================

set "MYSQL_HOME=%~1"
if "%MYSQL_HOME%"=="" set "MYSQL_HOME=C:\bss\mysql-8.4.4-winx64"
set "DATA_DIR=%~2"
if "%DATA_DIR%"=="" set "DATA_DIR=C:\bss\mysql-data"
set "MYSQL_PORT=%~3"
if "%MYSQL_PORT%"=="" set "MYSQL_PORT=3306"

if not exist "%MYSQL_HOME%\bin\mysqld.exe" (
  echo [错误] 未找到 mysqld.exe: %MYSQL_HOME%\bin\mysqld.exe
  echo        请确认第一个参数是 MySQL 解压目录。
  exit /b 1
)

REM ---- 1. 初始化数据目录（仅首次） ----
if not exist "%DATA_DIR%" (
  echo [1/4] 初始化数据目录 %DATA_DIR% ...
  "%MYSQL_HOME%\bin\mysqld" --initialize-insecure --basedir="%MYSQL_HOME%" --datadir="%DATA_DIR%"
  if errorlevel 1 (
    echo [错误] 初始化失败，请检查数据目录权限或磁盘空间。
    exit /b 1
  )
) else (
  echo [1/4] 数据目录已存在，跳过初始化。
)

REM ---- 2. 启动 MySQL（新窗口） ----
echo [2/4] 启动 MySQL 端口 %MYSQL_PORT% ...
start "bss-mysql" cmd /k ""%MYSQL_HOME%\bin\mysqld" --console --basedir="%MYSQL_HOME%" --datadir="%DATA_DIR%" --port=%MYSQL_PORT% --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci"

REM ---- 3. 等待就绪并设置 root 密码 ----
echo [3/4] 等待 MySQL 就绪（约 10~20 秒）...
set "READY="
for /l %%i in (1,1,30) do (
  "%MYSQL_HOME%\bin\mysqladmin" -h127.0.0.1 -P%MYSQL_PORT% -uroot ping >nul 2>&1
  if not errorlevel 1 set "READY=1"
  if defined READY goto :ready
  timeout /t 1 /nobreak >nul
)
:ready
if not defined READY (
  echo [警告] MySQL 未在预期时间内就绪，可能端口被占用或初始化异常。
  echo        请手动执行后续命令：
  echo        %MYSQL_HOME%\bin\mysql -uroot -P%MYSQL_PORT% -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
  echo        %MYSQL_HOME%\bin\mysql -uroot -proot -P%MYSQL_PORT% -e "CREATE DATABASE IF NOT EXISTS business_security_dashboard DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  exit /b 1
)
echo        MySQL 已就绪。

"%MYSQL_HOME%\bin\mysql" -h127.0.0.1 -P%MYSQL_PORT% -uroot -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root'; FLUSH PRIVILEGES;" >nul 2>&1

REM ---- 4. 创建数据库（幂等） ----
echo [4/4] 创建数据库 business_security_dashboard ...
"%MYSQL_HOME%\bin\mysql" -h127.0.0.1 -P%MYSQL_PORT% -uroot -proot -e "CREATE DATABASE IF NOT EXISTS business_security_dashboard DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if errorlevel 1 (
  echo [错误] 创建数据库失败，请检查 root 口令是否已修改。
  exit /b 1
)

echo.
echo ============================================================
echo  MySQL 初始化完成：
echo   数据目录 : %DATA_DIR%
echo   数据库   : business_security_dashboard (utf8mb4)
echo   root 口令: root
echo   MySQL 正在独立窗口中运行（标题 bss-mysql）
echo   下一步: 执行 start-backend.bat 启动后端
echo ============================================================
endlocal
