import React from 'react';
import { View, Button, StyleSheet, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameCanvas } from './src/components/GameCanvas';
import { SwipeHandler } from './src/components/SwipeHandler';
import { useGameStore } from './src/store/gameStore';
import { useRunnerEngine } from './src/hooks/useRunnerEngine';

const styles = StyleSheet.create({
  container: { flex: 1 },
  resetButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 100,
  },
});

function GameScreen() {
  const { width, height } = useWindowDimensions();
  const { state, actions } = useGameStore();
  const engine = useRunnerEngine(width, height);

  const handleReset = () => {
    engine.reset();
    actions.reset();
  };

  return (
    <View style={styles.container}>
      <SwipeHandler onMoveLane={engine.moveLane}>
        <View style={styles.container}>
          <GameCanvas engine={engine} screenWidth={width} screenHeight={height} />
        </View>
      </SwipeHandler>

      {state.isGameOver && (
        <View style={styles.resetButtonContainer}>
          <Button title="Play Again" onPress={handleReset} color="#FF6B6B" />
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <GameScreen />
    </GestureHandlerRootView>
  );
}
