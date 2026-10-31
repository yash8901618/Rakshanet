// Web Vibration / Device Haptic Engine

export function triggerHaptic(severity = 3) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (severity >= 5) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } else if (severity === 4) {
        navigator.vibrate([150, 75, 150]);
      } else {
        navigator.vibrate(60);
      }
    } catch (e) {}
  }
}
