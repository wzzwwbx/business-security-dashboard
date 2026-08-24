const LEADER_KEY = 'bss-route-alarm-sound-leader';
const LEASE_MS = 8000;
const CHANNEL_NAME = 'bss-route-alarm-sound';
const MUTE_KEY = 'bss-route-alarm-sound-muted';
const ALERT_SOUND_URL = '/audio/alert.mp3';

let installed = false;
let activated = false;
let leaderId: string | null = null;
let channel: BroadcastChannel | null = null;
let alarmAudio: HTMLAudioElement | null = null;
let lastAlertIds = new Set<string>();

function claimLeader() {
  if (typeof window === 'undefined') return false;
  const now = Date.now();
  let lease: { id: string; expiresAt: number } | null = null;
  try {
    lease = JSON.parse(window.localStorage.getItem(LEADER_KEY) ?? 'null') as typeof lease;
  } catch {
    lease = null;
  }

  if (leaderId && lease?.id === leaderId && lease.expiresAt > now) {
    lease.expiresAt = now + LEASE_MS;
    window.localStorage.setItem(LEADER_KEY, JSON.stringify(lease));
    return true;
  }

  if (!lease || lease.expiresAt <= now) {
    leaderId = `${now}-${Math.random().toString(36).slice(2)}`;
    const candidate = { id: leaderId, expiresAt: now + LEASE_MS };
    window.localStorage.setItem(LEADER_KEY, JSON.stringify(candidate));
    try {
      lease = JSON.parse(window.localStorage.getItem(LEADER_KEY) ?? 'null') as typeof lease;
    } catch {
      lease = null;
    }
    return lease?.id === leaderId;
  }

  leaderId = null;
  return false;
}

function playAlertTone(repeat = 3) {
  if (!activated || isAlarmSoundMuted()) return;

  try {
    alarmAudio ??= new Audio(ALERT_SOUND_URL);
    alarmAudio.volume = 0.85;
    let count = 0;
    const playNext = () => {
      if (count >= repeat) return;
      count += 1;
      alarmAudio!.currentTime = 0;
      void alarmAudio!.play().catch(() => undefined);
      window.setTimeout(playNext, 700);
    };
    playNext();
  } catch {
    // Audio is an enhancement; a blocked or unavailable device must not break the map.
  }
}

export function isAlarmSoundMuted() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAlarmSoundMuted(muted: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Ignore storage restrictions.
  }
}

export function installAlarmSound() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;

  // Browsers require a user gesture before allowing an alert sound to play.
  ['pointerdown', 'click', 'touchstart', 'keydown'].forEach((eventName) => {
    window.addEventListener(eventName, () => { activated = true; }, { once: true, passive: true });
  });

  claimLeader();
  window.setInterval(() => { claimLeader(); }, LEASE_MS / 2);
}

export function activateAlarmSound() {
  installAlarmSound();
  activated = true;
}

export function notifyAlarmSound(alerts: Array<{ id: string }>) {
  installAlarmSound();
  const currentIds = new Set(alerts.map((item) => String(item.id)));
  const changed = [...currentIds].some((id) => !lastAlertIds.has(id));
  lastAlertIds = currentIds;
  if (!changed || !claimLeader()) return;

  playAlertTone();
  channel?.postMessage({ type: 'alarm', at: Date.now() });
}
