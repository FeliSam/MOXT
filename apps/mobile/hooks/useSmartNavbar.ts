import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, Platform } from 'react-native';

type SmartNavbarListener = (visible: boolean) => void;
const listeners = new Set<SmartNavbarListener>();

let isCurrentVisible = true;
let lastScrollY = 0;
let upDistance = 0;
let downDistance = 0;

export function notifyNavbarVisibility(visible: boolean) {
  if (isCurrentVisible !== visible) {
    isCurrentVisible = visible;
    listeners.forEach((fn) => fn(visible));
  }
}

export function resetNavbarVisibility() {
  lastScrollY = 0;
  upDistance = 0;
  downDistance = 0;
  notifyNavbarVisibility(true);
}

export function handleSmartNavbarScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
  const currentY = event.nativeEvent.contentOffset.y;
  const delta = currentY - lastScrollY;
  lastScrollY = currentY;

  // Near the top of the page: always visible
  if (currentY <= 35) {
    upDistance = 0;
    downDistance = 0;
    notifyNavbarVisibility(true);
    return;
  }

  // Scrolling downwards: hide after small buffer
  if (delta > 0) {
    downDistance += delta;
    upDistance = 0;
    if (downDistance > 45) {
      notifyNavbarVisibility(false);
    }
  } else if (delta < 0) {
    // Scrolling upwards: reveal quickly
    upDistance += -delta;
    downDistance = 0;
    if (upDistance > 25) {
      notifyNavbarVisibility(true);
    }
  }
}

export function useSmartNavbarScroll() {
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleSmartNavbarScroll(event);
  }, []);

  return {
    onScroll,
    scrollEventThrottle: 16,
  };
}

export function useSmartNavbarVisibility() {
  const [visible, setVisible] = useState(isCurrentVisible);

  useEffect(() => {
    const listener: SmartNavbarListener = (next) => setVisible(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return visible;
}
