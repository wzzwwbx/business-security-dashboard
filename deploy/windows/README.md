# Windows 原生部署（无 Docker）指南

本目录提供在 **Windows 上不使用 Docker** 部署业务安全态势系统的完整方案，覆盖两种场景：

1. **纯部署演示**：用已构建产物（后端 jar + 前端 dist）直接跑起来，作为演示系统展示。
2. **离线开发**：在内网/离线 Windows 环境拉取代码后继续开发（解决 `npm install`、Maven 依赖下载等断网问题）。

## 一、总体架构（无 Docker）

```
浏览器 ──▶ nginx (Windows 进程, 端口 8081)
            ├─ /        → 前端静态文件 frontend/dist（SPA，try_files 回退 index.html）
            └─ /api/*   → 反向代理 http://127.0.0.1:8080（Spring Boot 后端）
后端:      java -jar business-security-dashboard-0.1.0.jar  (端口 8080, mysql profile)
数据库:    MySQL 8 原生 Windows 服务（或便携版，端口 3306）
探针:      Linux-only（/proc），Windows 演示不需要；后端空库会自动灌入演示数据
```

关键事实（已核实）：

- `backend/target/business-security-dashboard-0.1.0.jar` 是 **Spring Boot fat jar**，只要有 JRE 17 即可运行，不需要 Maven。
- `frontend/dist` 是已构建的生产产物，当前构建带 `VITE_PREVIEW_AUTH=preview`：**演示预览模式跳过登录**，打开即看（各页面展示内置演示数据）。若想体验“登录 + 真实 MySQL 数据 + 接口联调”的完整闭环，见第五节去掉 preview 重新构建即可。
- 后端以 `mysql` profile 启动时，会自动在空库上：建全部表（`classpath:schema.sql`）、灌入 `/ops` 演示数据（`OpsDemoDataSeeder`）、初始化 IAM 角色权限（`IamMetadataSeeder`）。**不需要手工执行 SQL 建表**，只需先把数据库建出来。
- `/api/situation/**` 数据来自后端内置 `mock/situations.json`，登录后即可命中（无需数据库）。
- **注意**：`backend/target/`、`frontend/dist/`、`frontend/node_modules/` 都被 `.gitignore` 排除，**git pull 不会带过来**。离线环境必须通过下方“离线打包”流程把产物和依赖带过去。

## 二、端口规划

| 组件 | 端口 | 说明 |
|------|------|------|
| MySQL | 3306 | 本机 |
| Spring Boot 后端 | 8080 | 本机 |
| nginx 前端 | 8081 | 访问入口 `http://localhost:8081`（可改，若 80 空闲也可用 80） |

## 三、场景一：纯部署演示（Windows）

### 3.1 组件清单

| 组件 | 推荐版本 | 获取方式 |
|------|----------|----------|
| JDK / JRE | Temurin 17 LTS（运行只需 JRE，开发用 JDK） | MSI 或免安装 ZIP |
| MySQL | 8.0.x 或 8.4 LTS | MySQL Installer MSI，或免安装 ZIP |
| nginx | 1.27.x Windows 版 | ZIP（解压即用） |
| 构建产物 | 后端 jar + 前端 dist | 见 3.2 |

建议目录规划（可自定）：

```text
C:\bss\
├── jdk-17\                  # 或安装到系统
├── mysql-8.4.x-winx64\     # 便携版
├── mysql-data\              # MySQL 数据目录
├── nginx-1.27.4\           # nginx
└── dist-offline-win64\      # 离线部署包（或直接把仓库 checkout 到这里）
```

### 3.2 准备构建产物（两种方式任选）

**方式 A：仓库里已有（本机联过网）** — 直接使用：

```text
backend\target\business-security-dashboard-0.1.0.jar
frontend\dist\                （需含 maps\world-110m.json）
```

**方式 B：离线包** — 在任意联网 Windows 机器上执行 `deploy\windows\prepare-offline.ps1`（见第五节），生成 `dist-offline-win64\`，整目录拷贝到演示机。

### 3.3 安装 JDK 17

安装 Temurin 17，或在 cmd 中验证：

```bat
java -version   :: 需显示 17.x
```

如果 `java` 不在 PATH，可在 `start-backend.bat` 中设置 `JAVA_HOME`。

### 3.4 启动 MySQL

**方式 1：MySQL Installer 安装版（推荐）**

1. 安装 MySQL Server 8.x，设置 root 密码（建议设为 `root` 或改 `start-backend.bat` 里的 `SPRING_DATASOURCE_PASSWORD`）。
2. 把 MySQL 注册为 Windows 服务并启动（安装器默认已注册）。
3. 建库（后端启动时会自动建表，只需建库）：

```bat
mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS business_security_dashboard DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

**方式 2：便携版（免安装，适合离线）**

1. 解压 `mysql-8.x-winx64.zip` 到 `C:\bss\mysql-8.4.x-winx64`。
2. 首次初始化 + 启动 + 建库（一次性）：

```bat
deploy\windows\init-mysql.bat C:\bss\mysql-8.4.x-winx64 C:\bss\mysql-data
```

3. 以后每次开机只需：

```bat
deploy\windows\start-mysql.bat C:\bss\mysql-8.4.x-winx64 C:\bss\mysql-data
```

> 脚本会自动执行 `--initialize-insecure`（root 初始空密码）→ 启动 → 把 root 密码改为 `root` → 创建 `business_security_dashboard` 库。

### 3.5 启动后端

```bat
deploy\windows\start-backend.bat
```

脚本内容要点（如需改端口/口令，直接改这个文件）：

```bat
set "SPRING_PROFILES_ACTIVE=mysql"
set "SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:3306/business_security_dashboard?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai"
set "SPRING_DATASOURCE_USERNAME=root"
set "SPRING_DATASOURCE_PASSWORD=root"
java -Dfile.encoding=UTF-8 -jar business-security-dashboard-0.1.0.jar
```

首次启动约 20~40 秒（建表 + 灌演示数据 + IAM 初始化）。就绪验证：

```bat
curl http://127.0.0.1:8080/actuator/health
:: 返回 {"status":"UP",...} 即正常
```

### 3.6 nginx 托管前端 + 反向代理

1. 解压 `nginx-1.27.x.zip` 到 `C:\bss\nginx-1.27.4`。
2. **把 `deploy\windows\nginx-windows.conf` 的内容替换到 `C:\bss\nginx-1.27.4\conf\nginx.conf`**（覆盖默认配置；`include mime.types;` 保持原样即可，与配置文件同目录能正常解析）。
3. 修改 `nginx-windows.conf` 中的 `root` 为实际 `frontend\dist` 路径（注意用正斜杠）。
4. 启动：

```bat
cd /d C:\bss\nginx-1.27.4
start nginx
:: 或双击 deploy\windows\start-demo.bat 一键启动
```

### 3.7 一键启动脚本（推荐演示用）

```bat
deploy\windows\start-demo.bat
```

自动完成：检测 MySQL（未启动则尝试拉起便携版）→ 新窗口启动后端 → 启动 nginx → 轮询健康检查 → 打印访问地址：

- 演示入口：**http://localhost:8081**（预览模式，免登录）
- 健康检查：http://127.0.0.1:8080/actuator/health

停止：

```bat
deploy\windows\stop-demo.bat
```

### 3.8 访问验证清单

**演示模式 A：零配置（当前 dist，preview 免登录）**

1. `http://localhost:8081/overview` — 综合态势
2. `/security`、`/business`、`/terminal` — 主题态势页
3. `/ops` — 运维态势
4. 说明：预览模式下未登录，后端接口返回 401 后前端会自动回退到内置演示数据，页面可能出现「已自动回退到本地经验数据」提示条——这是预期行为，页面内容完整可用。

**演示模式 B：完整闭环（推荐正式讲解，真实 MySQL 数据 + 三员登录）**

1. 去掉 preview（见第五节）重新构建 `frontend/dist`；
2. 打开 `http://localhost:8081/bootstrap`，初始化三个管理员并设置密码；
3. 打开 `http://localhost:8081/login`，用 sysadmin 登录；
4. `/overview` 等页面数据来源应显示「接口联调」；`/ops` 显示 MySQL 演示数据（主机、告警、趋势）；
5. `/system/accounts` 可查看三员账户，验证权限裁剪。

### 3.9 日常更新（后端或前端变更后）

```bat
:: 后端：替换 jar 后重启
deploy\windows\start-backend.bat

:: 前端：重新构建 frontend\dist 后，nginx 无需重启（静态文件即时生效）
cd frontend && npm run build
```

## 四、场景二：离线环境开发

### 4.1 问题本质

仓库 `.gitignore` 排除了 `frontend/node_modules`、`frontend/dist`、`backend/target`、`probe/target`，而 Maven 依赖默认存在 `%USERPROFILE%\.m2\repository`、npm 依赖默认存在 `node_modules`。离线机器拉取代码后，这些**全部缺失**，且无法在线下载。解决思路：**在联网机器上把"依赖 + 构建产物"整体打包，随代码一起带到离线机**。

### 4.2 联网机上制作离线包

在**联网的 Windows 机器**上，checkout 代码后执行：

```bat
powershell -ExecutionPolicy Bypass -File deploy\windows\prepare-offline.ps1 -OutDir C:\bss\dist-offline-win64
```

脚本会：

1. 前端：`npm ci` + `npm run build`，拷贝 `frontend\dist` 和 `frontend\node_modules`；
2. 后端：`mvn -DskipTests package`（顺带把依赖灌满 `~/.m2`），拷贝 jar；
3. 拷贝 `~/.m2\repository`（离线 Maven 仓库）；
4. 拷贝脚本、SQL、文档，并输出一张**需要手动携带的安装包清单**（JDK17 / Node20 / MySQL8 / nginx）。

> 不联网的 Linux/Mac 也可以当"联网机"：本仓库 `deploy/prepare-arm64.sh` 是 Docker 版打包脚本；Windows 原生版用上面的 ps1。
> **注意**：jar 与 dist 跨平台，但 `node_modules` 不是——Vite 依赖 esbuild/rollup，二者都含平台原生二进制（`@esbuild/<platform>`、`@rollup/rollup-<platform>`）。
> Windows 上生成的 `node_modules` 拷到 Windows 没问题；若在 macOS/Linux 上生成，必须先按目标平台重装，见 4.4 方式 A 的"从 macOS/Linux 生成 win64 版"。

### 4.3 离线机安装清单

| 组件 | 版本 | 离线安装方式 |
|------|------|--------------|
| JDK 17 | Temurin 17 LTS | MSI 静默安装或免安装 ZIP 解压 |
| Node.js | 20 LTS（Vite 6 要求 18+/20+/22+） | MSI 或 ZIP |
| Maven | 3.9.x | ZIP 解压（仅后端改代码需要） |
| MySQL | 8.0.x / 8.4 | MSI 或便携 ZIP |
| nginx | 1.27.x | ZIP 解压 |

### 4.4 离线前端开发

方式 A（最简单）：把离线包里的 `node_modules` 原样拷回仓库 `frontend\node_modules`，然后直接：

```bat
cd frontend
npm run dev:integration        :: Vite dev，5173 端口，/api 代理到 8080
```

> **重要**：依赖并非纯 JS——Vite 依赖 esbuild、rollup，二者都带平台原生二进制（如 `@esbuild/darwin-arm64`、`@rollup/rollup-darwin-arm64`），
> 所以**跨机器直接拷贝只在"同为 Windows"时安全**。
> - 从联网 Windows 生成（最稳）：`prepare-offline.ps1` 里 `npm ci` 装出的就是 win32 版，直接拷即可。
> - 从 macOS/Linux 生成 win64 版：npm ≥ 10.5 支持 `--os/--cpu`，用 `deploy/prepare-node-modules-win64.sh` 一键打包（产物 `dist-offline-win64/node_modules-win64.tar.gz`），
>   拷到离线 Windows 仓库 `frontend/` 下用 `tar -xzf` 解压即可（Windows 10+ 自带 tar）。
> - **两端 Node 大版本需一致**（都装 Node 20）。

方式 B（规范）：npm 离线缓存。在**联网 Windows** 上先 `npm ci --cache <缓存目录>` 把缓存灌满，再把缓存目录 + `package-lock.json` 带到离线机，然后：

```bat
npm ci --offline --cache C:\offline\npm-cache
```

> 缓存同样含平台二进制：必须在目标同平台（Windows）机器上灌缓存，否则离线机 `npm ci --offline` 找不到 `@esbuild/win32-x64` 会报错。

### 4.5 离线后端开发

> macOS/Linux 侧可直接用 `deploy/prepare-m2-offline.sh` 生成离线仓库（产物 `dist-offline-win64/offline-deps/m2-repository.tar.gz` + 后端 jar），无需联网 Windows 机器。
> 注意：不要用 `mvn dependency:go-offline` 生成，它有缺陷会漏依赖；该脚本用"完整在线构建灌满干净仓库"的方式，已实测 `mvn -o package` 全离线可用。

1. 安装 JDK 17 + Maven 3.9。
2. 解压 `offline-deps\m2-repository.tar.gz`，把解压出的 `m2-repository` 内容合并到 `%USERPROFILE%\.m2\repository`（覆盖）。
3. 一切 Maven 命令加 `-o`（offline）：

```bat
cd backend
mvn -o -DskipTests package
java -jar target\business-security-dashboard-0.1.0.jar
```

> 如果后续加了新依赖，必须在联网机重新 `mvn dependency:go-offline` 或重新打包 `~/.m2` 再同步。

### 4.6 离线调试建议

- 端口不变：MySQL 3306 / 后端 8080 / 前端 5173（dev）或 8081（nginx 托管 dist）。
- 后端报错看控制台（新窗口）；前端 dev 模式看 Vite 输出。
- IAM 联调注意：dev 模式必须走 Vite 同源 `/api` 代理（`VITE_USE_PROXY=true`），不要直连 `127.0.0.1:8080`，否则 JSESSIONID 跨源导致"登录成功但接口未登录"。
- 只做前端演示、不接后端时：`npm run dev:mock`（本地 Mock 数据）。

## 五、完整 IAM 登录演示（可选）

当前 `frontend/dist` 是 **preview 模式（免登录）**，适合纯演示。若要演示三员分立登录：

1. 修改 `frontend/.env.integration`，**删除** `VITE_PREVIEW_AUTH=preview` 一行；
2. 重新构建 `npm run build`；
3. 打开 `http://localhost:8081/bootstrap`，按页面引导初始化三个管理员（sysadmin / secadmin / auditadmin）并各自设置密码；
4. 之后 `http://localhost:8081/login` 用三员账号登录，验证导航与系统页权限裁剪。

## 六、常见问题

| 现象 | 原因 / 解决 |
|------|-------------|
| `/ops` 无数据，页面显示「Mock 回退」 | 两种可能：a) 当前 dist 是 preview 免登录模式，401 后自动回退，属预期（改用模式 B 登录即可看到真实数据）；b) 后端未启动或 MySQL 未就绪，先 `curl http://127.0.0.1:8080/actuator/health` |
| 后端启动即退出，报 `Communications link failure` | MySQL 没起来或口令不对；检查 `start-mysql.bat` / `SPRING_DATASOURCE_PASSWORD` |
| 页面 CSS/JS 加载 404 | nginx `root` 路径没改对，或 `dist` 里缺 `maps\world-110m.json` |
| 刷新 `/overview` 404 | nginx 的 `try_files $uri $uri/ /index.html;` 未生效（确认用的是替换后的 `conf\nginx.conf`） |
| 中文乱码 | 后端启动参数已带 `-Dfile.encoding=UTF-8`；MySQL 建库要 `utf8mb4` |
| 端口被占（80/8080） | 改 `nginx-windows.conf` 的 `listen` 或后端 `--server.port`；Windows 上 80 常被 IIS 占用，默认用 8081 |
| 局域网其他机器访问不了 | Windows 防火墙放行 8080/8081 入站 |
| `mvn` 离线编译报找不到依赖 | 确认 `%USERPROFILE%\.m2\repository` 已同步，且命令带 `-o` |
| 拷贝 `node_modules` 后 `npm run dev` 报错 | 两端 Node 版本不一致，统一用 Node 20 LTS 后重试 |

## 七、文件清单

| 文件 | 用途 |
|------|------|
| `start-demo.bat` | 一键演示：MySQL 检测 → 后端 → nginx |
| `stop-demo.bat` | 停止 nginx / 后端窗口 / 便携 MySQL |
| `start-backend.bat` | 启动后端 jar（mysql profile + UTF-8） |
| `init-mysql.bat` | 便携 MySQL 首次初始化（免安装） |
| `start-mysql.bat` | 启动便携 MySQL |
| `nginx-windows.conf` | nginx 配置模板（替换 `conf\nginx.conf`） |
| `prepare-offline.ps1` | 联网机打包离线依赖 + 构建产物 |
