<script setup lang="ts">
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import type { IamPermissionDto, IamRoleDto } from '@/types/iam';
import { computed } from 'vue';

const props = defineProps<{
  roles: IamRoleDto[];
  permissions: IamPermissionDto[];
}>();

const permissionGroups = computed(() => {
  const grouped = new Map<string, IamPermissionDto[]>();

  props.permissions.forEach((item) => {
    const group = grouped.get(item.resourceType) ?? [];
    group.push(item);
    grouped.set(item.resourceType, group);
  });

  return Array.from(grouped.entries());
});
</script>

<template>
  <section class="roles-grid">
    <article class="glass-card card">
      <div class="card-head">
        <div>
          <h2>角色清单</h2>
          <p>内置角色保持三员边界，模板角色用于页面只读授权扩展。</p>
        </div>
        <span class="tag">{{ roles.length }} 个角色</span>
      </div>

      <div v-if="roles.length" class="role-list">
        <article v-for="role in roles" :key="role.code" class="role-item">
          <div class="role-title-row">
            <div>
              <strong>{{ role.name }}</strong>
              <p>{{ role.description }}</p>
            </div>
            <span class="badge" :class="role.enabled ? 'success' : 'warning'">{{ role.type }}</span>
          </div>

          <div class="tag-row">
            <span v-for="pageCode in role.pageCodes" :key="pageCode" class="tag">页面：{{ pageCode }}</span>
          </div>

          <div class="permission-list">
            <span v-for="permission in role.permissions" :key="permission" class="permission-chip">{{ permission }}</span>
          </div>
        </article>
      </div>
      <BaseEmpty v-else title="暂无角色数据" description="请确认当前账号具备 role:view 权限。" />
    </article>

    <article class="glass-card card">
      <div class="card-head">
        <div>
          <h2>权限目录</h2>
          <p>按资源域查看页面权限、账户动作权限、审批权限与审计权限。</p>
        </div>
        <span class="tag">{{ permissions.length }} 个权限点</span>
      </div>

      <div v-if="permissionGroups.length" class="permission-groups">
        <section v-for="[group, items] in permissionGroups" :key="group" class="permission-group">
          <strong>{{ group }}</strong>
          <div class="group-items">
            <article v-for="item in items" :key="item.code" class="group-item">
              <div class="code">{{ item.code }}</div>
              <p>{{ item.description }}</p>
            </article>
          </div>
        </section>
      </div>
      <BaseEmpty v-else title="暂无权限目录" description="当前未加载到后端权限元数据。" />
    </article>
  </section>
</template>

<style scoped>
.roles-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.role-list,
.permission-groups {
  display: grid;
  gap: var(--space-5);
}

.role-item,
.permission-group {
  padding: var(--space-5);
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-xl);
  background: var(--sys-color-surface-panel);
}

.role-title-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.role-title-row p,
.group-item p {
  margin: var(--space-2) 0 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-base);
}

.tag-row,
.permission-list,
.group-items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.permission-chip,
.code {
  display: inline-flex;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--sys-color-surface-muted);
  color: var(--sys-color-text-secondary);
  font-size: var(--font-size-13);
}

.group-item {
  min-width: min(320px, 100%);
  padding: var(--space-4);
  border: 1px solid var(--sys-color-border-secondary);
  border-radius: var(--radius-lg);
}

@media (max-width: 1100px) {
  .roles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
