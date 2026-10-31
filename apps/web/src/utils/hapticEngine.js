// Gravimetric Haptic Feedback Engine
// Scales vibration patterns by incident severity (Level 1-5) and falls back to visual pulse/shake

export const triggerHaptic = (severity = 1) => {
  const sev = Math.min(5, Math.max(1, parseInt(severity, 10) || 1));

  // 1. Device Vibration API
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      let pattern;
      switch (sev) {
        case 1:
          pattern = [80];
          break;
        case 2:
          pattern = [150, 60, 150];
          break;
        case 3:
          pattern = [250, 70, 250, 70, 250];
          break;
        case 4:
          pattern = [400, 80, 400, 80, 400, 80, 600];
          break;
        case 5:
          pattern = [600, 100, 600, 100, 600, 100, 800, 100, 1000];
          break;
        default:
          pattern = [150];
      }
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn('[HAPTIC ENGINE] Vibration error:', e);
    }
  }

  // 2. Visual Screen Shake fallback for High & Critical (Severity 4-5)
  if (sev >= 4 && typeof document !== 'undefined') {
    document.body.classList.remove('haptic-shake');
    void document.body.offsetWidth;
    document.body.classList.add('haptic-shake');
    setTimeout(() => {
      document.body.classList.remove('haptic-shake');
    }, 450);
  }
};
