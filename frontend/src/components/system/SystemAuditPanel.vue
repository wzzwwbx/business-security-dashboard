<script setup lang="ts">
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import type { IamLoginAuditDto, IamOperationAuditDto } from '@/types/iam';

defineProps<{
  loginAudits: IamLoginAuditDto[];
  operationAudits: IamOperationAuditDto[];
}>();
</script>

<template>
  <section class="audit-grid">
    <article class="glass-card card">
      <div class="card-head">
        <div>
          <h2>登录审计</h2>
          <p>记录登录结果、来源 IP 与终端信息，支撑账号安全追踪。</p>
        </div>
        <span class="tag">{{ loginAudits.length }} 条</span>
      </div>

      <div v-if="loginAudits.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>用户</th>
              <th>结果</th>
              <th>来源 IP</th>
              <th>终端</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in loginAudits" :key="item.id">
              <td>{{ item.username }}</td>
              <td><span class="badge" :class="item.success ? 'success' : 'danger'">{{ item.success ? '成功' : '失败' }}</span></td>
              <td>{{ item.clientIp || '-' }}</td>
              <td>{{ item.userAgent || '-' }}</td>
              <td>{{ item.loggedAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <BaseEmpty v-else title="暂无登录审计" description="后端尚未记录到登录事件。" />
    </article>

    <article class="glass-card card">
      <div class="card-head">
        <div>
          <h2>操作审计</h2>
          <p>记录账户治理、审批操作与 traceId，便于问题回溯。</p>
        </div>
        <span class="tag">{{ operationAudits.length }} 条</span>
      </div>

      <div v-if="operationAudits.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>操作者</th>
              <th>操作</th>
              <th>对象</th>
              <th>结果</th>
              <th>Trace</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in operationAudits" :key="item.id">
              <td>{{ item.operatorUsername }}</td>
              <td>{{ item.operationType }}</td>
              <td>{{ item.targetLabel || item.targetId || '-' }}</td>
              <td><span class="badge" :class="item.result === 'SUCCESS' ? 'success' : item.result === 'PENDING' ? 'warning' : 'danger'">{{ item.result }}</span></td>
              <td>{{ item.traceId }}</td>
              <td>{{ item.operatedAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <BaseEmpty v-else title="暂无操作审计" description="请完成一次账号治理操作后再查看审计记录。" />
    </article>
  </section>
</template>

<style scoped>
.audit-grid {
  display: grid;
  gap: var(--space-7);
}

.card {
  padding: var(--space-8);
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;
  margin-bottom: var(--space-6);
}

.card-head h2 {
  margin: 0;
}

.card-head p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--sys-color-border-table);
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
  font-weight: var(--font-weight-medium);
}
</style>
