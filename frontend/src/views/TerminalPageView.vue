<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import PanelCard from '@/components/common/PanelCard.vue';
import EChartWidget from '@/components/widgets/EChartWidget.vue';
import { useTerminalDetail } from '@/composables/useTerminalDetail';
import { useTerminalOverview } from '@/composables/useTerminalOverview';
import {
  boolLabel,
  deviceStatusLabel,
  eventSeverityLabel,
  formatBytes,
  formatDateTime,
  formatRelativeTime,
  ownershipStatusLabel,
  passwordModuleStatusLabel,
  peripheralActionLabel,
  riskLevelLabel,
  softwareChangeTypeLabel,
  sourceStatusLabel,
  sourceSystemLabel,
  sourceTypeLabel,
  statusTone
} from '@/utils/terminalFormatters';
import { computed } from 'vue';

const {
  overview,
  sources,
  devices,
  selectedDeviceId,
  loading,
  refreshing,
  errorMessage,
  keyword,
  status,
  riskLevel,
  ownershipStatus,
  selectDevice,
  reload,
  resetFilters
} = useTerminalOverview();

const {
  detail,
  timeseries,
  events,
  softwareChanges,
  peripheralEvents,
  range,
  errorMessage: detailErrorMessage
} = useTerminalDetail(selectedDeviceId);

const metricCards = computed(() => {
  if (!overview.value) {
    return [];
  }

  return [
    { label: '在线终端', value: overview.value.onlineDevices, note: '当前周期内有新鲜上报' },
    { label: '延迟终端', value: overview.value.staleDevices, note: '已超过 2 个采样周期未更新' },
    { label: '离线终端', value: overview.value.offlineDevices, note: '已超过 5 个采样周期未更新' },
    { label: '高风险终端', value: overview.value.highRiskDevices, note: '高风险与严重风险终端数量' },
    { label: '密码模块异常', value: overview.value.abnormalPasswordModuleDevices, note: '密码模块状态异常或不可用' },
    { label: '指纹变化终端', value: overview.value.fingerprintChangedDevices, note: '检测到指纹录入变化' },
    { label: '待认领终端', value: overview.value.pendingClaimDevices, note: '已上报手机号但尚未关联人员档案' },
    { label: '外设接入事件', value: overview.value.peripheralAlertCount, note: '近 24 小时外设接入总量' },
    { label: '软件变更终端', value: overview.value.softwareChangeDevices, note: '近 24 小时发生安装更新卸载' }
  ];
});

const trendOption = computed(() => {
  const points = timeseries.value?.points ?? [];
  if (!points.length) {
    return {};
  }

  return {
    legend: { top: 0 },
    grid: { left: 24, right: 24, top: 42, bottom: 20, containLabel: true },
    xAxis: { type: 'category', data: points.map((point) => point.observedAt.slice(11, 16)) },
    yAxis: [
      { type: 'value', name: '流量(MB)' },
      { type: 'value', name: '次数/分值' }
    ],
    series: [
      {
        type: 'bar',
        name: '流量使用',
        data: points.map((point) => Math.round(point.trafficUsedBytes / 1024 / 1024))
      },
      {
        type: 'line',
        smooth: true,
        name: '口令错误次数',
        yAxisIndex: 1,
        data: points.map((point) => point.wrongPasswordCount)
      },
      {
        type: 'line',
        smooth: true,
        name: '风险分',
        yAxisIndex: 1,
        data: points.map((point) => point.riskScore ?? 0)
      }
    ]
  };
});

const selectedDeviceSummary = computed(() => devices.value.find((item) => item.id === selectedDeviceId.value) ?? null);
</script>

<template>
  <div class="terminal-page">
    <section class="hero glass-card">
      <div>
        <p class="hero-eyebrow">终端态势</p>
        <h1>零信任终端监测与人员关联视图</h1>
        <p class="hero-description">
          终端侧采集密码模块、手机号、系统版本、外设、软件变更、流量等数据，
          先关联人员主数据，再统一呈现终端在线状态、风险与事件。
        </p>
        <div class="hero-tags">
          <span class="tag">人员主数据优先</span>
          <span class="tag">手机号仅作关联线索</span>
          <span class="tag">支持外部接口与手工注入</span>
        </div>
      </div>
      <div class="hero-actions">
        <div class="hero-time">生成时间：{{ overview ? formatDateTime(overview.generatedAt) : '加载中' }}</div>
        <BaseButton :variant="refreshing ? 'secondary' : 'primary'" @click="reload(true)">
          {{ refreshing ? '刷新中…' : '刷新数据' }}
        </BaseButton>
      </div>
    </section>

    <template v-if="loading">
      <section class="metrics-grid">
        <article v-for="item in 9" :key="item" class="glass-card skeleton-card">
          <BaseSkeleton width="96px" height="14px" />
          <BaseSkeleton width="160px" height="32px" />
          <BaseSkeleton width="85%" height="14px" />
        </article>
      </section>
      <section class="page-grid">
        <div v-for="item in 6" :key="item" class="grid-item" :style="{ gridColumn: item === 1 ? 'span 12' : 'span 6' }">
          <section class="glass-card skeleton-panel">
            <BaseSkeleton width="180px" height="20px" />
            <BaseSkeleton width="100%" height="260px" />
          </section>
        </div>
      </section>
    </template>

    <BaseEmpty
      v-else-if="errorMessage"
      title="终端态势加载失败"
      :description="errorMessage"
    />

    <template v-else>
      <section class="metrics-grid">
        <article v-for="item in metricCards" :key="item.label" class="metric-card glass-card">
          <span class="metric-label">{{ item.label }}</span>
          <strong class="metric-value">{{ item.value }}</strong>
          <span class="metric-note">{{ item.note }}</span>
        </article>
      </section>

      <section class="page-grid">
        <div class="grid-item" :style="{ gridColumn: 'span 12' }">
          <PanelCard title="数据来源概览" :tags="['真实接口', `来源 ${overview?.sourceCount ?? 0} 个`]" :min-height="220">
            <div v-if="sources.length" class="source-grid">
              <article v-for="source in sources" :key="`${source.sourceType}-${source.sourceSystem}`" class="source-card">
                <div class="source-head">
                  <div>
                    <strong>{{ sourceTypeLabel(source.sourceType) }}</strong>
                    <p>{{ sourceSystemLabel(source.sourceSystem) }}</p>
                  </div>
                  <span class="badge" :class="statusTone(source.status)">{{ sourceStatusLabel(source.status) }}</span>
                </div>
                <div class="source-meta">
                  <span>终端数量：{{ source.deviceCount }}</span>
                  <span>最近同步：{{ formatRelativeTime(source.lastSeenAt) }}</span>
                </div>
              </article>
            </div>
            <BaseEmpty v-else title="暂无来源数据" description="等待外部接口或手工注入推送终端快照。" />
          </PanelCard>
        </div>

        <div class="grid-item" :style="{ gridColumn: 'span 4' }">
          <PanelCard title="终端列表" :tags="['人员关联', `共 ${devices.length} 台`]" :min-height="560">
            <div class="filter-block">
              <label class="field">
                <span>关键字</span>
                <input v-model.trim="keyword" type="text" placeholder="姓名、工号、IP、设备标识" />
              </label>
              <div class="field-row field-row-triple">
                <label class="field">
                  <span>在线状态</span>
                  <select v-model="status">
                    <option value="">全部</option>
                    <option value="ONLINE">在线</option>
                    <option value="STALE">延迟</option>
                    <option value="OFFLINE">离线</option>
                  </select>
                </label>
                <label class="field">
                  <span>风险等级</span>
                  <select v-model="riskLevel">
                    <option value="">全部</option>
                    <option value="LOW">低风险</option>
                    <option value="MEDIUM">中风险</option>
                    <option value="HIGH">高风险</option>
                    <option value="CRITICAL">严重风险</option>
                  </select>
                </label>
                <label class="field">
                  <span>归属状态</span>
                  <select v-model="ownershipStatus">
                    <option value="">全部</option>
                    <option value="BOUND">已关联人员</option>
                    <option value="PENDING_CLAIM">待认领</option>
                    <option value="ANONYMOUS">匿名终端</option>
                  </select>
                </label>
              </div>
              <div class="action-row">
                <BaseButton variant="primary" @click="reload()">应用筛选</BaseButton>
                <BaseButton variant="secondary" @click="resetFilters()">重置</BaseButton>
              </div>
            </div>

            <div v-if="devices.length" class="device-list">
              <button
                v-for="device in devices"
                :key="device.id"
                class="device-row"
                :class="{ active: device.id === selectedDeviceId }"
                type="button"
                @click="selectDevice(device.id)"
              >
                <div class="device-row-head">
                  <div>
                    <strong>{{ device.displayName }}</strong>
                    <p>{{ device.personName || ownershipStatusLabel(device.ownershipStatus) }} · {{ device.departmentName || '待归属部门' }}</p>
                  </div>
                  <span class="badge" :class="statusTone(device.status)">{{ deviceStatusLabel(device.status) }}</span>
                </div>
                <div class="device-row-metrics">
                  <span>风险：{{ riskLevelLabel(device.riskLevel) }}</span>
                  <span>密码模块：{{ passwordModuleStatusLabel(device.passwordModuleStatus) }}</span>
                </div>
                <div class="device-row-foot">
                  <span class="tag">{{ ownershipStatusLabel(device.ownershipStatus) }}</span>
                  <span class="tag">{{ sourceTypeLabel(device.sourceType) }}</span>
                  <span>{{ formatRelativeTime(device.lastObservedAt) }}</span>
                </div>
              </button>
            </div>
            <BaseEmpty v-else title="暂无终端" description="请检查筛选条件，或等待终端数据上报。" />
          </PanelCard>
        </div>

        <div class="grid-item" :style="{ gridColumn: 'span 8' }">
          <PanelCard title="终端详情" :tags="['人员信息', '设备信息', '最新安全状态']" :min-height="560">
            <div v-if="detail" class="detail-shell">
              <div class="detail-top">
                <div>
                  <h3>{{ detail.displayName }}</h3>
                  <p>
                    {{ sourceSystemLabel(detail.sourceSystem) }} · {{ deviceStatusLabel(detail.status) }} · 最近上报 {{ formatDateTime(detail.lastObservedAt) }}
                  </p>
                </div>
                <div class="detail-badges">
                  <span class="badge" :class="statusTone(detail.status)">{{ deviceStatusLabel(detail.status) }}</span>
                  <span class="badge" :class="statusTone(detail.riskLevel)">{{ riskLevelLabel(detail.riskLevel) }}</span>
                </div>
              </div>

              <div class="detail-grid two-col">
                <section class="detail-card">
                  <strong>人员信息</strong>
                  <dl>
                    <div><dt>姓名</dt><dd>{{ detail.person?.displayName || detail.person?.fullName || '待认领' }}</dd></div>
                    <div><dt>工号</dt><dd>{{ detail.person?.employeeNo || '暂无' }}</dd></div>
                    <div><dt>部门</dt><dd>{{ detail.person?.departmentName || '暂无' }}</dd></div>
                    <div><dt>岗位</dt><dd>{{ detail.person?.jobTitle || '暂无' }}</dd></div>
                    <div><dt>归属状态</dt><dd>{{ ownershipStatusLabel(detail.ownershipStatus) }}</dd></div>
                    <div><dt>人员手机号</dt><dd>{{ detail.person?.phoneNumberMasked || '暂无' }}</dd></div>
                    <div><dt>上报手机号</dt><dd>{{ detail.reportedPhoneNumberMasked || selectedDeviceSummary?.phoneNumberMasked || '暂无' }}</dd></div>
                    <div><dt>组织路径</dt><dd>{{ detail.person?.organizationPath || '暂无' }}</dd></div>
                  </dl>
                </section>
                <section class="detail-card">
                  <strong>设备信息</strong>
                  <dl>
                    <div><dt>设备编码</dt><dd>{{ detail.deviceCode }}</dd></div>
                    <div><dt>IP 地址</dt><dd>{{ detail.deviceInfo.primaryIp || '暂无' }}</dd></div>
                    <div><dt>系统版本</dt><dd>{{ detail.deviceInfo.osVersion || '暂无' }}</dd></div>
                    <div><dt>设备 IMEI</dt><dd>{{ detail.deviceInfo.imei || '暂无' }}</dd></div>
                    <div><dt>设备 MEID</dt><dd>{{ detail.deviceInfo.meid || '暂无' }}</dd></div>
                    <div><dt>网络标识</dt><dd>{{ detail.deviceInfo.plmn || '暂无' }}</dd></div>
                  </dl>
                </section>
              </div>

              <div class="detail-grid three-col">
                <section class="detail-card compact">
                  <span>累计流量</span>
                  <strong>{{ formatBytes(detail.deviceInfo.trafficUsedBytes) }}</strong>
                </section>
                <section class="detail-card compact">
                  <span>口令错误次数</span>
                  <strong>{{ detail.latestSecurity.wrongPasswordCount }}</strong>
                </section>
                <section class="detail-card compact">
                  <span>风险分</span>
                  <strong>{{ detail.latestSecurity.riskScore ?? '暂无' }}</strong>
                </section>
              </div>

              <section class="detail-card">
                <strong>安全状态</strong>
                <dl class="security-grid">
                  <div><dt>密码模块状态</dt><dd>{{ passwordModuleStatusLabel(detail.latestSecurity.passwordModuleStatus) }}</dd></div>
                  <div><dt>密码模块版本</dt><dd>{{ detail.latestSecurity.passwordModuleVersion || '暂无' }}</dd></div>
                  <div><dt>密码服务套件</dt><dd>{{ passwordModuleStatusLabel(detail.latestSecurity.passwordSuiteStatus) }}</dd></div>
                  <div><dt>指纹录入变化</dt><dd>{{ boolLabel(detail.latestSecurity.fingerprintChanged) }}</dd></div>
                  <div><dt>配置文件修改</dt><dd>{{ boolLabel(detail.latestSecurity.configModified) }}</dd></div>
                  <div><dt>来源类型</dt><dd>{{ sourceTypeLabel(detail.sourceType) }}</dd></div>
                </dl>
                <p class="security-summary">{{ detail.latestSecurity.summary || '当前未生成风险摘要。' }}</p>
              </section>

              <section class="detail-card" v-if="detail.bindings.length">
                <strong>来源绑定</strong>
                <ul class="binding-list">
                  <li v-for="binding in detail.bindings" :key="`${binding.sourceSystem}-${binding.externalDeviceId}`">
                    <span>{{ sourceSystemLabel(binding.sourceSystem) }}</span>
                    <span>{{ binding.externalDeviceName || '未命名终端' }}</span>
                    <span>{{ binding.externalDeviceId }}</span>
                  </li>
                </ul>
              </section>

              <div class="detail-grid two-col">
                <section class="detail-card">
                  <strong>最近软件变更</strong>
                  <div v-if="softwareChanges.length" class="mini-list">
                    <article v-for="item in softwareChanges.slice(0, 4)" :key="item.id" class="mini-item">
                      <div class="mini-item-top">
                        <span class="badge info">{{ softwareChangeTypeLabel(item.changeType) }}</span>
                        <time>{{ formatDateTime(item.observedAt) }}</time>
                      </div>
                      <strong>{{ item.softwareName }}</strong>
                      <p>{{ item.detail || `版本：${item.softwareVersion || '未知'}` }}</p>
                    </article>
                  </div>
                  <BaseEmpty v-else title="暂无软件变更" description="当前选中终端最近未上报安装、更新或卸载记录。" />
                </section>
                <section class="detail-card">
                  <strong>最近外设接入</strong>
                  <div v-if="peripheralEvents.length" class="mini-list">
                    <article v-for="item in peripheralEvents.slice(0, 4)" :key="item.id" class="mini-item">
                      <div class="mini-item-top">
                        <span class="badge warning">{{ peripheralActionLabel(item.actionType) }}</span>
                        <time>{{ formatDateTime(item.observedAt) }}</time>
                      </div>
                      <strong>{{ item.peripheralName || item.peripheralType }}</strong>
                      <p>{{ item.detail || `类型：${item.peripheralType}` }}</p>
                    </article>
                  </div>
                  <BaseEmpty v-else title="暂无外设记录" description="当前选中终端最近未上报新的外设接入事件。" />
                </section>
              </div>
            </div>
            <BaseEmpty v-else title="请选择终端" description="从左侧终端列表选择一台终端后查看详情。" />
          </PanelCard>
        </div>

        <div class="grid-item" :style="{ gridColumn: 'span 7' }">
          <PanelCard title="流量与风险趋势" :tags="['流量', '口令错误', '风险分']" :min-height="380">
            <template #extra>
              <div class="range-group">
                <BaseButton
                  v-for="item in [
                    { value: '6h', label: '近 6 小时' },
                    { value: '24h', label: '近 24 小时' },
                    { value: '7d', label: '近 7 天' }
                  ]"
                  :key="item.value"
                  :variant="item.value === range ? 'primary' : 'secondary'"
                  @click="range = item.value as '6h' | '24h' | '7d'"
                >
                  {{ item.label }}
                </BaseButton>
              </div>
            </template>
            <EChartWidget v-if="timeseries?.points.length" :option="trendOption" />
            <BaseEmpty v-else title="暂无趋势数据" description="等待终端持续上报多个时间点后展示趋势。" />
          </PanelCard>
        </div>

        <div class="grid-item" :style="{ gridColumn: 'span 5' }">
          <PanelCard title="最新事件" :tags="['软件变更', '外设接入', '安全事件']" :min-height="380">
            <div v-if="detailErrorMessage && !events.length" class="inline-error">{{ detailErrorMessage }}</div>
            <div v-if="events.length" class="event-list">
              <article v-for="event in events" :key="event.id" class="event-card">
                <div class="event-top">
                  <span class="badge" :class="statusTone(event.severity)">{{ eventSeverityLabel(event.severity) }}</span>
                  <time>{{ formatDateTime(event.observedAt) }}</time>
                </div>
                <strong>{{ event.title }}</strong>
                <p>{{ event.detail || '暂无补充说明' }}</p>
              </article>
            </div>
            <BaseEmpty v-else title="暂无事件" description="当前选中终端暂未产生新的事件记录。" />
          </PanelCard>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.terminal-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: var(--space-8);
  padding: var(--space-8);
}

.hero-eyebrow {
  margin: 0 0 var(--space-3);
  color: var(--sys-color-brand-secondary);
  letter-spacing: 0.08em;
}

.hero h1 {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
}

.hero-description {
  margin: var(--space-4) 0 0;
  max-width: 760px;
  line-height: 1.8;
  color: var(--sys-color-text-secondary);
}

.hero-tags,
.hero-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.hero-actions {
  min-width: 220px;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
}

.hero-time {
  color: var(--sys-color-text-secondary);
  text-align: right;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--layout-grid-gap);
}

.metric-card,
.skeleton-card,
.skeleton-panel {
  padding: var(--space-7);
}

.metric-card {
  display: grid;
  gap: var(--space-3);
}

.metric-label,
.metric-note,
.source-head p,
.device-row-head p,
.device-row-foot,
.inline-error,
.detail-top p,
.security-summary,
.event-card p,
.event-top time {
  color: var(--sys-color-text-secondary);
}

.metric-value {
  font-size: var(--font-size-32);
  line-height: 1;
}

.source-grid,
.device-list,
.event-list {
  display: grid;
  gap: var(--space-4);
}

.source-card,
.device-row,
.detail-card,
.event-card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-color-border-secondary);
  background: var(--sys-color-surface-panel);
}

.source-card,
.detail-card,
.event-card {
  padding: var(--space-5);
}

.source-head,
.source-meta,
.device-row-head,
.device-row-foot,
.device-row-metrics,
.detail-top,
.event-top,
.action-row,
.field-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.source-head p,
.device-row-head p,
.security-summary,
.event-card p {
  margin: var(--space-2) 0 0;
}

.filter-block {
  display: grid;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.field {
  display: grid;
  gap: var(--space-2);
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

.field input,
.field select {
  min-height: 40px;
  border-radius: var(--radius-md);
  border: 1px solid var(--sys-color-border-primary);
  background: var(--sys-color-surface-panel);
  color: var(--sys-color-text-primary);
  padding: 0 var(--space-4);
}

.device-row {
  width: 100%;
  padding: var(--space-5);
  text-align: left;
  cursor: pointer;
  color: inherit;
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    background var(--motion-duration-fast) var(--motion-ease-standard);
}

.device-row:hover,
.device-row.active {
  transform: translateY(-1px);
  border-color: var(--sys-color-border-strong);
  background: var(--sys-color-brand-primary-weak);
}

.detail-shell {
  display: grid;
  gap: var(--space-5);
}

.detail-top h3 {
  margin: 0;
}

.detail-badges {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.detail-grid {
  display: grid;
  gap: var(--space-4);
}

.detail-grid.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-grid.three-col {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.detail-card strong {
  display: block;
  margin-bottom: var(--space-4);
}

.detail-card.compact {
  display: grid;
  gap: var(--space-2);
}

.detail-card.compact strong {
  margin: 0;
  font-size: var(--font-size-28);
}

.detail-card dl,
.security-grid,
.detail-card ul {
  margin: 0;
}

.detail-card dl {
  display: grid;
  gap: var(--space-3);
}

.detail-card dl div,
.security-grid div {
  display: grid;
  gap: var(--space-1);
}

.detail-card dt,
.detail-card.compact span {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-12);
}

.detail-card dd {
  margin: 0;
}

.security-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.binding-list {
  display: grid;
  gap: var(--space-3);
  padding-left: var(--space-5);
}

.binding-list li {
  display: grid;
  gap: var(--space-1);
}

.range-group {
  display: inline-flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.event-card strong {
  display: block;
  margin-top: var(--space-3);
}

.inline-error {
  margin-bottom: var(--space-3);
}


.field-row-triple .field {
  flex: 1 1 160px;
}

.mini-list {
  display: grid;
  gap: var(--space-3);
}

.mini-item {
  border-radius: var(--radius-md);
  border: 1px solid var(--sys-color-border-secondary);
  padding: var(--space-4);
  background: color-mix(in srgb, var(--sys-color-surface-panel) 88%, transparent);
}

.mini-item-top {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.mini-item strong {
  display: block;
  margin-top: var(--space-3);
}

.mini-item p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
}


@media (max-width: 1280px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid.two-col,
  .detail-grid.three-col,
  .security-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .hero {
    flex-direction: column;
  }

  .hero-actions {
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .metrics-grid,
  .detail-grid.two-col,
  .detail-grid.three-col,
  .security-grid {
    grid-template-columns: 1fr;
  }
}
</style>
