// Utilitários de notificação no navegador: desktop (Notification API), som
// (Web Audio, sem precisar de arquivos de áudio), vibração (mobile) e
// inscrição em Push Notification via Service Worker.

export function isDesktopNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getDesktopPermission(): NotificationPermission | "unsupported" {
  if (!isDesktopNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestDesktopPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isDesktopNotificationSupported()) return "unsupported";
  return Notification.requestPermission();
}

export function showDesktopNotification(title: string, body: string) {
  if (!isDesktopNotificationSupported() || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/icons/icon-192.svg" });
}

// --- Som (gerado via Web Audio API, sem depender de arquivos .mp3) ---
const SOUND_PATTERNS: Record<string, { freq: number; duration: number }[]> = {
  default: [{ freq: 880, duration: 0.12 }, { freq: 1180, duration: 0.12 }],
  chime: [{ freq: 660, duration: 0.15 }, { freq: 990, duration: 0.15 }, { freq: 1320, duration: 0.2 }],
  ping: [{ freq: 1400, duration: 0.08 }],
  none: [],
};

export function playNotificationSound(sound: string) {
  const pattern = SOUND_PATTERNS[sound];
  if (!pattern || pattern.length === 0) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    let time = ctx.currentTime;
    pattern.forEach(({ freq, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
      time += duration * 0.8;
    });
  } catch {
    // Web Audio indisponível — silenciosamente ignora
  }
}

// --- Vibração (mobile) ---
export function vibrateDevice() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([120, 60, 120]);
  }
}

// --- Push Notification (Web Push via Service Worker) ---
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscriptionJSON | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  });
  return subscription.toJSON();
}

export async function unsubscribeFromPush(): Promise<string | null> {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return null;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return endpoint;
}
