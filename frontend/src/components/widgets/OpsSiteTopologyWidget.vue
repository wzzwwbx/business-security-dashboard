<script setup lang="ts">
import type { OpsSiteTopology, OpsTopologyDevice } from '@/types/opsTopology';
import { computed } from 'vue';

const props = defineProps<{
  topology: OpsSiteTopology;
  selectedDeviceId?: number | null;
}>();

const emit = defineEmits<{ selectDevice: [device: OpsTopologyDevice] }>();
const deviceMap = computed(() => new Map(props.topology.devices.map((item) => [item.id, item])));
const iconLabel: Record<OpsTopologyDevice['deviceType'], string> = { link: 'WAN', firewall: 'FW', gateway: 'VPN', switch: 'SW', server: 'SRV', database: 'DB', storage: 'SAN', collector: 'LOG' };
</script>

<template>
  <div class="ops-topology" role="img" :aria-label="`${topology.site.name}网络拓扑`">
    <div class="topology-layers" aria-hidden="true"><span>外部链路</span><span>安全边界</span><span>核心交换</span><span>业务资源</span></div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line
        v-for="link in topology.links"
        :key="`${link.from}-${link.to}`"
        :x1="deviceMap.get(link.from)?.x" :y1="deviceMap.get(link.from)?.y"
        :x2="deviceMap.get(link.to)?.x" :y2="deviceMap.get(link.to)?.y"
        :class="`is-${link.status}`"
      />
    </svg>
    <button
      v-for="device in topology.devices"
      :key="device.id"
      type="button"
      class="topology-device"
      :class="[`is-${device.status}`, { selected: selectedDeviceId === device.id }]"
      :style="{ left: `${device.x}%`, top: `${device.y}%` }"
      @click="emit('selectDevice', device)"
    >
      <i>{{ iconLabel[device.deviceType] }}</i>
      <span>{{ device.name }}</span>
      <small>{{ device.primaryIp }}</small>
      <b v-if="device.alertCount">{{ device.alertCount }}</b>
    </button>
  </div>
</template>

<style scoped>
.ops-topology { position: relative; height: 100%; min-height: 430px; overflow: hidden; border: 1px solid rgba(53,216,255,.18); background: linear-gradient(rgba(53,216,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(53,216,255,.035) 1px, transparent 1px), radial-gradient(circle at 50% 45%, rgba(25,130,174,.18), transparent 52%); background-size: 28px 28px, 28px 28px, auto; }
.topology-layers { position: absolute; inset: 0 auto 0 0; display: grid; grid-template-rows: repeat(4, 1fr); width: 78px; color: rgba(125,174,197,.62); font-size: 10px; pointer-events: none; }
.topology-layers span { display: flex; align-items: center; padding-left: 8px; border-bottom: 1px dashed rgba(53,216,255,.12); }
svg { position: absolute; inset: 0; width: 100%; height: 100%; }
line { stroke: #35d8ff; stroke-width: .45; stroke-dasharray: 2 1.5; vector-effect: non-scaling-stroke; animation: link-flow 10s linear infinite; }
line.is-warning { stroke: #ffc857; } line.is-danger { stroke: #ff6178; } line.is-success { stroke: #31e6a1; }
.topology-device { position: absolute; display: grid; justify-items: center; gap: 2px; width: 106px; min-height: 58px; padding: 6px; transform: translate(-50%, -50%); border: 1px solid rgba(53,216,255,.38); border-radius: 4px; background: rgba(6,25,43,.94); color: #e9faff; box-shadow: 0 0 18px rgba(53,216,255,.08); cursor: pointer; }
.topology-device:hover,.topology-device.selected { z-index: 2; border-color: #35d8ff; box-shadow: 0 0 24px rgba(53,216,255,.25); }
.topology-device.is-warning { border-color: rgba(255,200,87,.72); }.topology-device.is-danger { border-color: rgba(255,97,120,.82); }.topology-device.is-success { border-color: rgba(49,230,161,.55); }
.topology-device i { display: grid; place-items: center; width: 30px; height: 21px; border: 1px solid currentColor; color: #35d8ff; font: 700 9px var(--font-family-mono, monospace); font-style: normal; }
.topology-device span { max-width: 96px; overflow: hidden; font-size: 10px; white-space: nowrap; text-overflow: ellipsis; }.topology-device small { color: #789bb0; font-size: 8px; }.topology-device b { position: absolute; top: -6px; right: -6px; display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: #ff6178; color: white; font-size: 9px; }
@keyframes link-flow { to { stroke-dashoffset: -30; } }
@media (max-width: 720px) { .ops-topology { min-height: 520px; overflow-x: auto; }.topology-device { width: 88px; }.topology-layers { width: 56px; } }
@media (prefers-reduced-motion: reduce) { line { animation: none; } }
</style>
