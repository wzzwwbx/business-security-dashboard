# 终端态势数据模型（人员主数据优先版）

## 1. 关键约束

基于零信任终端客户端当前可上报字段，本项目先确定以下归一化规则：

1. **手机号不是终端主键，也不是人员信息的散落字段**
2. **手机号必须先关联到人员主数据，再由人员与终端形成业务关联**
3. 终端侧上报的 `手机号` 字段，默认视为“设备当前使用人线索”，不是绝对主键
4. 若同一人员未来存在多终端、多手机号场景，仍以 `person_profile` 为人员主记录，以 `person_phone` 维护号码集合

## 2. 建议主数据模型

### 2.1 人员主表 `person_profile`

用于维护统一人员档案，服务于终端、安全、业务等多个主题域。

建议字段：

- `person_code`：系统内部人员编码
- `external_person_id`：外部 HR / AD / 零信任平台人员 ID
- `employee_no`：工号
- `full_name`：姓名
- `display_name`：展示名
- `gender`：性别
- `status`：状态，如 `ACTIVE / INACTIVE / LEFT`
- `department_code` / `department_name`
- `organization_path`：组织路径
- `job_title`：岗位
- `email`
- `source_system`

### 2.2 人员手机号表 `person_phone`

用于维护手机号与人员之间的稳定映射关系。

建议字段：

- `person_id`
- `phone_number`
- `phone_number_masked`
- `phone_number_hash`
- `phone_type`：默认 `MOBILE`
- `country_code`
- `is_primary`
- `verified`
- `status`
- `source_system`

设计约束：

- 当前一期按 **一个有效手机号仅归属一个人员** 处理，因此对 `phone_number` 建唯一约束
- 未来若出现号码回收复用场景，再升级为“历史有效期模型”

## 3. 终端域归一规则

零信任客户端上报的以下字段：

- 手机号
- 手机 IP 地址
- 手机 OS 版本
- 手机 MEID
- 手机 IMEI
- 手机 PLMN

在接入层建议按下面顺序归一：

1. 若 payload 中直接给出 `personCode / employeeNo / externalPersonId`，优先匹配 `person_profile`
2. 否则若给出 `phoneNumber`，通过 `person_phone.phone_number` 匹配到 `person_id`
3. 若手机号未匹配到人员，则保留为“待认领终端线索”，但不直接把手机号当作人员主键
4. 终端详情页展示时，优先展示人员主数据，再附带手机号

## 4. 对前端展示的影响

终端页面后续建议把“手机号”从单纯设备字段升级为“人员关联信息”的一个切面：

- 终端列表：展示 `人员姓名 / 工号 / 部门 / 手机号 / 终端状态`
- 终端详情：展示“人员信息卡 + 设备信息卡 + 安全状态卡”
- 综合态势：可按部门、岗位、人员状态聚合终端风险

## 5. 安全与合规建议

人员与手机号属于敏感信息，后续工程实现建议遵循：

- 前端默认展示 `phone_number_masked`
- 仅具备授权的账号才可查看完整手机号
- 审计日志记录人员信息查看、导出、批量查询行为
- 后续如接入国密或字段级加密能力，可优先对 `phone_number` 做加密存储，对 `phone_number_hash` 做检索匹配

## 6. 当前落库状态

除人员主数据表外，终端域当前还已落地以下能力：

- `terminal_device`：终端主记录，保留人员快照、手机号快照、IMEI / MEID、来源与状态
- `terminal_device_snapshot` / `terminal_security_snapshot`：终端流量、密码模块、口令错误、风险分、指纹变化等快照
- `terminal_software_change`：软件安装 / 更新 / 卸载记录
- `terminal_peripheral_event`：外设接入记录

并对前端暴露以下归属状态：

- `BOUND`：已关联人员
- `PENDING_CLAIM`：待认领终端
- `ANONYMOUS`：匿名终端

### 6.1 人员主数据落库位置

本次已在以下 schema 中预留人员主数据表：

- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/database/mysql/schema.sql`
- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/backend/src/main/resources/schema.sql`

新增表：

- `person_profile`
- `person_phone`
