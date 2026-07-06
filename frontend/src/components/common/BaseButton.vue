<template>
  <button class="base-button" :class="variant" :type="type" :disabled="disabled">
    <span v-if="$slots.icon" class="button-icon"><slot name="icon" /></span>
    <span><slot /></span>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}>(), {
  type: 'button',
  variant: 'primary',
  disabled: false
});
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0 var(--space-6);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  color: var(--sys-color-text-primary);
  cursor: pointer;
  transition:
    background var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.base-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.base-button.primary {
  background: linear-gradient(90deg, var(--sys-color-brand-primary), var(--sys-color-brand-secondary));
  color: var(--sys-color-text-primary);
}

.base-button.secondary {
  background: var(--sys-color-surface-panel);
  border-color: var(--sys-color-border-primary);
  color: var(--sys-color-text-secondary);
}

.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-icon {
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  display: inline-grid;
  place-items: center;
}
</style>
