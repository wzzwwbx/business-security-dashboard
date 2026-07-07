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

<template>
  <button class="base-button" :class="variant" :type="type" :disabled="disabled">
    <span v-if="$slots.icon" class="button-icon"><slot name="icon" /></span>
    <span><slot /></span>
  </button>
</template>

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
    box-shadow var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.base-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.base-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(45, 226, 230, 0.18);
}

.base-button.primary {
  background: linear-gradient(90deg, var(--sys-color-brand-primary), var(--sys-color-brand-secondary));
  color: var(--sys-color-text-primary);
}

.base-button.primary:hover:not(:disabled) {
  box-shadow: 0 12px 24px rgba(12, 28, 48, 0.28);
}

.base-button.secondary {
  background: var(--sys-color-surface-panel);
  border-color: var(--sys-color-border-primary);
  color: var(--sys-color-text-secondary);
}

.base-button.secondary:hover:not(:disabled) {
  border-color: var(--sys-color-brand-secondary);
  color: var(--sys-color-text-primary);
}

.base-button:disabled {
  opacity: 0.56;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.button-icon {
  width: var(--icon-size-sm);
  height: var(--icon-size-sm);
  display: inline-grid;
  place-items: center;
}
</style>
