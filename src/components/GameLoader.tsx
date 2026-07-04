import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, useWindowDimensions, Animated as RNAnimated } from 'react-native';

import { styles } from './GameLoader.styles';

interface GameLoaderProps {
  onFinished: () => void;
}

export const GameLoader = ({ onFinished }: GameLoaderProps) => {
  const { width } = useWindowDimensions();
  const [percent, setPercent] = useState(0);

  // Use React Native's built-in Animated API — zero Reanimated, zero Skia, zero crashes
  const pulseAnim = useRef(new RNAnimated.Value(0.95)).current;
  const rotateAnim = useRef(new RNAnimated.Value(0)).current;
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;
  const barWidth = useRef(new RNAnimated.Value(0)).current;

  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  const finish = useCallback(() => {
    // Scale burst + fade out
    RNAnimated.parallel([
      RNAnimated.spring(scaleAnim, { toValue: 4, damping: 12, useNativeDriver: true }),
      RNAnimated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      onFinishedRef.current();
    });
  }, [scaleAnim, fadeAnim]);

  useEffect(() => {
    // 1. Continuous pulse
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.spring(pulseAnim, { toValue: 1.08, damping: 6, useNativeDriver: true }),
        RNAnimated.spring(pulseAnim, { toValue: 0.95, damping: 6, useNativeDriver: true }),
      ])
    ).start();

    // 2. Continuous rotation
    RNAnimated.loop(
      RNAnimated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();

    // 3. Progress stages with faster dopamine curve
    const stages = [
      { target: 40, duration: 300 },
      { target: 80, duration: 400 },
      { target: 100, duration: 250 },
    ];

    let delay = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    stages.forEach((stage, i) => {
      const timer = setTimeout(() => {
        // Animate bar width
        RNAnimated.timing(barWidth, {
          toValue: (width * 0.7) * (stage.target / 100),
          duration: stage.duration,
          useNativeDriver: false, // width can't use native driver
        }).start();

        // Animate percent counter
        const startPercent = i === 0 ? 0 : stages[i - 1].target;
        const steps = stage.target - startPercent;
        const stepDuration = stage.duration / steps;
        for (let s = 1; s <= steps; s++) {
          const stepTimer = setTimeout(() => {
            setPercent(startPercent + s);
          }, s * stepDuration);
          timers.push(stepTimer);
        }

        if (i === stages.length - 1) {
          const burstTimer = setTimeout(() => {
            finish();
          }, stage.duration);
          timers.push(burstTimer);
        }
      }, delay);

      timers.push(timer);
      delay += stage.duration;
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [pulseAnim, rotateAnim, barWidth, width, finish]);

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <RNAnimated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Central portal */}
      <RNAnimated.View
        style={[
          styles.portalContainer,
          { transform: [{ scale: RNAnimated.multiply(pulseAnim, scaleAnim) }] },
        ]}
      >
        {/* Outer rotating dashed ring */}
        <RNAnimated.View
          style={[
            styles.outerRing,
            { transform: [{ rotate: rotateInterpolation }] },
          ]}
        />
        {/* Middle glow */}
        <View style={styles.middleGlow} />
        {/* Inner core */}
        <View style={styles.innerCore} />
      </RNAnimated.View>

      {/* Progress bar */}
      <View style={[styles.barTrack, { width: width * 0.7 }]}>
        <RNAnimated.View style={[styles.barFill, { width: barWidth }]} />
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={styles.loadingText}>LOADING</Text>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>
    </RNAnimated.View>
  );
};
