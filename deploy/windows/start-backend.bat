@echo off
chcp 65001 >nul
setlocal
REM ============================================================
REM  启动后端 Spring Boot（mysql profile, 端口 8080）
REM  用法: start-backend.bat [jar路径]
REM  说明: 可通过环境变量覆盖默认配置：
REM        BSS_JAR                   后端 jar 路径
REM        SPRING_DATASOURCE_PASSWORD 数据库口令（默认 root）
REM        SPRING_DATASOURCE_URL      JDBC 连接串
REM  前置: MySQL 已就绪且存在库 business_security_dashboard
REM ============================================================

REM ---- 定位 jar（优先级: 参数 > 环境变量 > 仓库 target > 离线包） ----
set "JAR=%~1"
if "%JAR%"=="" if defined BSS_JAR set "JAR=%BSS_JAR%"
if "%JAR%"=="" if exist "%~dp0..\..\backend\target\business-security-dashboard-0.1.0.jar" set "JAR=%~dp0..\..\backend\target\business-security-dashboard-0.1.0.jar"
if "%JAR%"=="" if exist "%~dp0..\backend\business-security-dashboard-0.1.0.jar" set "JAR=%~dp0..\backend\business-security-dashboard-0.1.0.jar"
if "%JAR%"=="" if exist "C:\bss\dist-offline-win64\backend\business-security-dashboard-0.1.0.jar" set "JAR=C:\bss\dist-offline-win64\backend\business-security-dashboard-0.1.0.jar"
if "%JAR%"=="" (
  echo [错误] 未找到后端 jar，请传入参数或设置 BSS_JAR。
  echo        仓库构建产物: backend\target\business-security-dashboard-0.1.0.jar
  exit /b 1
)
if not exist "%JAR%" (
  echo [错误] jar 不存在: %JAR%
  exit /b 1
)

REM ---- 定位 java（优先 JAVA_HOME） ----
set "JAVA_CMD=java"
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" set "JAVA_CMD=%JAVA_HOME%\bin\java.exe"

REM ---- 环境变量（可改） ----
set "SPRING_PROFILES_ACTIVE=mysql"
if not defined SPRING_DATASOURCE_URL set "SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:3306/business_security_dashboard?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false"
if not defined SPRING_DATASOURCE_USERNAME set "SPRING_DATASOURCE_USERNAME=root"
if not defined SPRING_DATASOURCE_PASSWORD set "SPRING_DATASOURCE_PASSWORD=root"
if not defined OPS_PROBE_SHARED_SECRET set "OPS_PROBE_SHARED_SECRET=dev-probe-secret"
if not defined OPS_EXTERNAL_INGEST_TOKEN set "OPS_EXTERNAL_INGEST_TOKEN=external-dev-token"
if not defined OPS_MANUAL_INGEST_TOKEN set "OPS_MANUAL_INGEST_TOKEN=manual-dev-token"
if not defined TERMINAL_EXTERNAL_INGEST_TOKEN set "TERMINAL_EXTERNAL_INGEST_TOKEN=terminal-external-dev-token"
if not defined TERMINAL_MANUAL_INGEST_TOKEN set "TERMINAL_MANUAL_INGEST_TOKEN=terminal-manual-dev-token"

echo 使用 jar : %JAR%
echo 后端端口 : 8080（首次启动约 20~40 秒，含建表与演示数据灌入）

"%JAVA_CMD%" "-Dfile.encoding=UTF-8" "-Dstdout.encoding=UTF-8" "-Dstderr.encoding=UTF-8" -jar "%JAR%"

echo.
echo [后端已退出] 按任意键关闭窗口...
pause >nul
endlocal
