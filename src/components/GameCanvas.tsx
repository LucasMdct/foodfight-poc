import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';
import { useGameStore } from '../store/gameStore';
import { GAME_CONSTANTS } from '../types/constants';
import { RunnerEngine } from '../hooks/useRunnerEngine';

interface GameCanvasProps {
  engine: RunnerEngine;
  screenWidth: number;
  screenHeight: number;
  onReset: () => void;
}

export const GameCanvas = ({ engine, screenWidth, screenHeight, onReset }: GameCanvasProps) => {
  const { state } = useGameStore();
  const laneHeight = screenHeight / 3;

  const laneTops = useMemo(
    () => [0, laneHeight, laneHeight * 2],
    [laneHeight]
  );

  return (
    <View style={{ flex: 1, backgroundColor: GAME_CONSTANTS.COLORS.CANVAS_BG }}>
      <Canvas style={{ flex: 1 }}>
        {/* 3 fixed lanes */}
        {laneTops.map((top, i) => (
          <Rect
            key={`lane-bg-${i}`}
            x={0}
            y={top}
            width={screenWidth}
            height={laneHeight}
            color={i % 2 === 0 ? 'rgba(230, 244, 254, 0.3)' : 'rgba(255, 255, 255, 0.5)'}
          />
        ))}
        {laneTops.slice(1).map((top, i) => (
          <Rect
            key={`lane-border-${i}`}
            x={0}
            y={top}
            width={screenWidth}
            height={2}
            color="rgba(200, 200, 200, 0.5)"
          />
        ))}

        {/* Hero — position/opacity driven by shared values (UI thread) */}
        <Rect
          x={engine.heroX}
          y={engine.heroY}
          width={GAME_CONSTANTS.HERO_WIDTH}
          height={GAME_CONSTANTS.HERO_HEIGHT}
          color={GAME_CONSTANTS.COLORS.HERO}
          opacity={engine.heroOpacity}
        />

        {/* Obstacle pool — fixed set of Rects, animated via shared values */}
        {Array.from({ length: engine.poolSize }, (_, i) => (
          <Rect
            key={`obs-${i}`}
            x={engine.obstacleX[i]}
            y={engine.obstacleY[i]}
            width={GAME_CONSTANTS.OBSTACLE_WIDTH}
            height={GAME_CONSTANTS.OBSTACLE_HEIGHT}
            color={GAME_CONSTANTS.COLORS.OBSTACLE}
            opacity={engine.obstacleActive[i]}
          />
        ))}
      </Canvas>

      {/* HUD (discrete state only — no per-frame re-render) */}
      <View
        style={{
          position: 'absolute',
          top: 70,
          left: 20,
          right: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>
            Health: {state.health}  |  Score: {state.score}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: state.fps >= 55 ? '#4CAF50' : '#FF9800',
            }}
          >
            FPS: {Math.round(state.fps)}
          </Text>
        </View>
      </View>

      {/* Game Over screen with integrated Play Again button */}
      {state.isGameOver && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.gameOverTitle}>Game Over</Text>
            <Text style={styles.scoreSubtitle}>Final Score: {state.score}</Text>
            <TouchableOpacity
              onPress={onReset}
              activeOpacity={0.8}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel="Play again"
            >
              <Text style={styles.buttonText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    width: '80%',
    maxWidth: 320,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  scoreSubtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
