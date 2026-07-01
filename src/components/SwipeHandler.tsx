import React, { useRef } from 'react';
import { GestureDetector, Gesture, Directions } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface SwipeHandlerProps {
  children: React.ReactNode;
  onMoveLane: (direction: -1 | 1) => void;
}

export const SwipeHandler = ({ children, onMoveLane }: SwipeHandlerProps) => {
  const lastSwipeTimeRef = useRef(0);
  const SWIPE_DEBOUNCE_MS = 100;

  const handleSwipe = (direction: -1 | 1) => {
    const now = Date.now();
    if (now - lastSwipeTimeRef.current < SWIPE_DEBOUNCE_MS) return;
    lastSwipeTimeRef.current = now;
    onMoveLane(direction);
  };

  // Fling's onEnd payload has no `direction`, so use one gesture per direction
  // and pass the known direction explicitly (via runOnJS — onEnd is a worklet).
  const flingUp = Gesture.Fling()
    .direction(Directions.UP)
    .onEnd(() => {
      'worklet';
      runOnJS(handleSwipe)(-1); // up = toward the top lane
    });

  const flingDown = Gesture.Fling()
    .direction(Directions.DOWN)
    .onEnd(() => {
      'worklet';
      runOnJS(handleSwipe)(1); // down = toward the bottom lane
    });

  return (
    <GestureDetector gesture={Gesture.Race(flingUp, flingDown)}>
      {children}
    </GestureDetector>
  );
};
