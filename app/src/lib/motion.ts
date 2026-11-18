import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/** The native driver is not available on web (react-native-web animates in JS). */
export const nativeDriver = Platform.OS !== 'web';

/** True when the person turned on "Reduce motion": animations then jump straight to the end. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduced(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
