/**
 * NeuroLoop Mobile Haptic Feedback System
 * Leverages the standard Navigator.vibrate API to provide subtle tactile responses
 * on Android and touch-enabled mobile devices.
 */

export type HapticType = 'light' | 'selection' | 'medium' | 'heavy' | 'glide' | 'success' | 'warning';

let lastHapticTime = 0;

export const triggerHaptic = (type: HapticType = 'selection'): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Check if vibration API is supported
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return false;
  }

  const now = performance.now();
  // Minimum throttle to avoid haptic stutter (except for glide/success)
  if (type === 'selection' || type === 'light') {
    if (now - lastHapticTime < 45) {
      return false;
    }
  }
  lastHapticTime = now;

  try {
    switch (type) {
      case 'light':
      case 'selection':
        // Ultra-short subtle click (10ms)
        return navigator.vibrate(10);

      case 'medium':
        // Crisp tactile tick for preset change / band selection (22ms)
        return navigator.vibrate(22);

      case 'heavy':
        // Firm pulse for play/stop / active command (40ms)
        return navigator.vibrate(40);

      case 'glide':
        // Dual rhythmic pulse for starting smooth frequency glide
        return navigator.vibrate([15, 30, 18]);

      case 'success':
        // Triple progressive confirmation pulse for export/sync
        return navigator.vibrate([12, 35, 20, 35, 30]);

      case 'warning':
        // Double alert buzz
        return navigator.vibrate([40, 50, 40]);

      default:
        return navigator.vibrate(15);
    }
  } catch {
    return false;
  }
};
