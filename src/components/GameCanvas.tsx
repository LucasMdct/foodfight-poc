import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';
import { useGameStore } from '../store/gameStore';
import { GAME_CONSTANTS } from '../types/constants';
import { RunnerEngine } from '../hooks/useRunnerEngine';

interface GameCanvasProps {
  engine: RunnerEngine;
  screenWidth: number;
  screenHeight: number;
}

export const GameCanvas = ({ engine, screenWidth, screenHeight }: GameCanvasProps) => {
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

        {/* Game Over dim overlay */}
        {state.isGameOver && (
          <Rect x={0} y={0} width={screenWidth} height={screenHeight} color="rgba(0, 0, 0, 0.5)" />
        )}
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
            Health: {state.health}
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

      {/* Game Over screen */}
      {state.isGameOver && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          <View style={{ backgroundColor: 'white', padding: 30, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 10 }}>Game Over</Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              Press reset to play again
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
