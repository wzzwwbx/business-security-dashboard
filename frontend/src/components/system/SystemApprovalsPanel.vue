<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import type { IamApprovalTicketDto } from '@/types/iam';
import { computed, shallowRef } from 'vue';

const props = defineProps<{
  approvals: IamApprovalTicketDto[];
  busy: boolean;
  canReview: boolean;
}>();

const emit = defineEmits<{
  approve: [payload: { ticketId: number; reviewComment: string }];
  reject: [payload: { ticketId: number; reviewComment: string }];
}>();

const selectedTicketId = shallowRef<number | null>(null);
const reviewComment = shallowRef('');

const selectedTicket = computed(() => props.approvals.find((item) => item.id === selectedTicketId.value) ?? null);
const pendingTickets = computed(() => props.approvals.filter((item) => item.status === 'PENDING'));
const historyTickets = computed(() => props.approvals.filter((item) => item.status !== 'PENDING'));

function useTicket(ticketId: number) {
  selectedTicketId.value = ticketId;
  reviewComment.value = '';
}

function approve() {
  if (!selectedTicket.value) {
    return;
  }

  emit('approve', { ticketId: selectedTicket.value.id, reviewComment: reviewComment.value });
  reviewComment.value = '';
}

function reject() {
  if (!selectedTicket.value) {
    return;
  }

  emit('reject', { ticketId: selectedTicket.value.id, reviewComment: reviewComment.value });
  reviewComment.value = '';
}
</script>

<template>
  <section class="approval-grid">
    <article class="glass-card card">
      <div class="card-head">
        <div>
          <h2>待审批</h2>
          <p>安全管理员负责高危变更审批，审批意见将同步写入操作留痕。</p>
        </div>
        <span class="tag">{{ pendingTickets.length }} 条待办</span>
      </div>

      <div v-if="pendingTickets.length" class="ticket-list">
        <button v-for="ticket in pendingTickets" :key="ticket.id" class="ticket-item" :class="{ active: selectedTicketId === ticket.id }" type="button" @click="useTicket(ticket.id)">
          <div>
            <strong>{{ ticket.summary }}</strong>
            <p>{{ ticket.reason }}</p>
          </div>
          <div class="ticket-meta">
            <span class="badge warning">待审批</span>
            <span>{{ ticket.requesterUsername }}</span>
          </div>
        </button>
      </div>
      <BaseEmpty v-else title="暂无待审事项" description="当前高危账号操作已全部完成闭环。" />
    </article>

    <article class="glass-card card detail-card">
      <div class="card-head">
        <div>
          <h2>审批意见</h2>
          <p>审批时建议说明复核依据、影响范围和执行限制。</p>
        </div>
        <span v-if="selectedTicket" class="tag">工单 #{{ selectedTicket.id }}</span>
      </div>

      <BaseEmpty v-if="!selectedTicket" title="请选择待审批工单" description="从左侧选择一条待办后，可填写审批意见并执行通过/驳回。" />

      <template v-else>
        <section class="ticket-detail">
          <div><span>目标对象</span><strong>{{ selectedTicket.targetLabel }}</strong></div>
          <div><span>申请人</span><strong>{{ selectedTicket.requesterUsername }}</strong></div>
          <div><span>提交时间</span><strong>{{ selectedTicket.submittedAt }}</strong></div>
        </section>
        <div class="reason-box">{{ selectedTicket.reason }}</div>
        <label class="comment-field">
          <span>审批意见</span>
          <textarea v-model.trim="reviewComment" rows="6" :disabled="busy || !canReview" placeholder="例如：已核验离岗流程、确认岗位变更、允许执行但需在变更窗口内完成。" />
        </label>
        <div class="actions">
          <BaseButton :disabled="busy || !canReview" @click="approve">审批通过</BaseButton>
          <BaseButton variant="secondary" :disabled="busy || !canReview || !reviewComment" @click="reject">审批驳回</BaseButton>
        </div>
      </template>
    </article>

    <article class="glass-card card history-card">
      <div class="card-head">
        <div>
          <h2>历史审批</h2>
          <p>已完成审批的账号操作记录可供事后审计复查。</p>
        </div>
        <span class="tag">{{ historyTickets.length }} 条历史</span>
      </div>

      <div v-if="historyTickets.length" class="history-list">
        <article v-for="ticket in historyTickets" :key="ticket.id" class="history-item">
          <div class="history-row">
            <strong>{{ ticket.summary }}</strong>
            <span class="badge" :class="ticket.status === 'APPROVED' ? 'success' : 'danger'">{{ ticket.status }}</span>
          </div>
          <p>{{ ticket.reviewComment || '未填写审批意见' }}</p>
          <div class="history-meta">{{ ticket.reviewerUsername || '未审批' }} · {{ ticket.reviewedAt || ticket.submittedAt }}</div>
        </article>
      </div>
      <BaseEmpty v-else title="暂无历史审批" description="当前没有已完结的审批单。" />
    </article>
  </section>
</template>

<style scoped>
.approval-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: var(--space-7);
}

.card {
  padding: var(--space-8);
}

.history-card {
  grid-column: 1 / -1;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.card-head h2 {
  margin: 0;
}

.card-head p,
.ticket-item p,
.history-item p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
}

.ticket-list,
.history-list {
  display: grid;
  gap: var(--space-4);
}

.ticket-item,
.history-item {
  padding: var(--space-5);
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-xl);
  background: var(--sys-color-surface-panel);
}

.ticket-item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  width: 100%;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.ticket-item.active {
  border-color: var(--sys-color-border-accent);
  background: linear-gradient(135deg, var(--sys-color-brand-primary-soft), var(--sys-color-brand-primary-weak));
}

.ticket-meta,
.history-meta {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

.ticket-detail {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.ticket-detail div {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-muted);
}

.ticket-detail span {
  display: block;
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

.ticket-detail strong {
  display: block;
  margin-top: var(--space-2);
}

.reason-box {
  margin-top: var(--space-5);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-muted);
  line-height: var(--line-height-relaxed);
}

.comment-field {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

.comment-field span {
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

textarea {
  width: 100%;
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-panel);
  color: var(--sys-color-text-primary);
  padding: var(--space-4) var(--space-5);
  resize: vertical;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.history-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

@media (max-width: 1180px) {
  .approval-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .ticket-detail {
    grid-template-columns: 1fr;
  }

  .ticket-item,
  .history-row {
    flex-direction: column;
  }
}
</style>
