<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue';
import { useAuthSession } from '@/composables/useAuthSession';
import { useRouter } from 'vue-router';

const auth = useAuthSession();
const router = useRouter();

async function backToSafePage() {
  await router.replace(auth.resolveFirstRoute());
}
</script>

<template>
  <main class="forbidden-page">
    <section class="forbidden-card glass-card">
      <div class="eyebrow">访问受限</div>
      <h1>当前账户无权访问此页面</h1>
      <p>系统已根据三员职责分离和页面授权规则阻止访问。你可以返回首个有权限的页面，或切换具备对应权限的账户重新登录。</p>
      <div class="actions">
        <BaseButton @click="backToSafePage">返回可访问页面</BaseButton>
      </div>
    </section>
  </main>
</template>

<style scoped>
.forbidden-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-10);
}

.forbidden-card {
  width: min(560px, 100%);
  padding: var(--space-10);
}

.eyebrow {
  color: var(--sys-color-status-warning);
  font-size: var(--font-size-13);
  letter-spacing: var(--letter-spacing-wider);
  text-transform: uppercase;
}

h1 {
  margin: var(--space-3) 0;
}

p {
  margin: 0;
  color: var(--sys-color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.actions {
  margin-top: var(--space-7);
}
</style>
