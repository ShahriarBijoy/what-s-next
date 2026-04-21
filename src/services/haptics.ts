import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

type Weight = 'tick' | 'select' | 'bump';

const STYLE: Record<Weight, ImpactStyle> = {
  tick: ImpactStyle.Light,
  select: ImpactStyle.Medium,
  bump: ImpactStyle.Heavy,
};

// Fire-and-forget: a missed haptic never blocks UI. Swallow plugin errors so
// emulators without a vibration service don't flood the console.
export function haptic(weight: Weight = 'tick'): void {
  if (!Capacitor.isNativePlatform()) return;
  Haptics.impact({ style: STYLE[weight] }).catch(() => {
    /* no-op */
  });
}
