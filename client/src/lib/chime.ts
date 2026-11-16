/**
 * Web Audio API synthesized order chime and desktop notification utility.
 * Requires 0 external audio files, works completely offline and cross-browser.
 */

export function isAudioEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('admin_order_sound') !== 'false';
}

export function setAudioEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_order_sound', enabled ? 'true' : 'false');
}

/**
 * Plays a pleasant, upbeat e-commerce register chime ("Cha-Ching!" / Two-Tone Bell)
 */
export function playOrderChime(): void {
  if (!isAudioEnabled()) return;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => void 0);
    }

    const now = ctx.currentTime;

    // Tone 1: High shimmer register ding (C6: 1046.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Upbeat resolve tone (E6: 1318.5 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.1);
    gain2.gain.setValueAtTime(0.3, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('Could not play order chime:', err);
  }
}

/**
 * Triggers a desktop notification for the store admin
 */
export function triggerDesktopNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/logo-256.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
    } catch {
      // Ignore notification spawn errors
    }
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => void 0);
  }
}

