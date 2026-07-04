import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameCanvas } from './src/components/GameCanvas';
import { SwipeHandler } from './src/components/SwipeHandler';
import { useGameStore } from './src/store/gameStore';
import { useRunnerEngine } from './src/hooks/useRunnerEngine';
import { GameLoader } from './src/components/GameLoader';
import { styles } from './App.styles';

function GameScreen() {
  const { width, height } = useWindowDimensions();
  const actions = useGameStore((s) => s.actions);
  const engine = useRunnerEngine(width, height);

  const handleReset = () => {
    engine.reset();
    actions.reset();
  };

  return (
    <View style={styles.container}>
      <SwipeHandler onMoveLane={engine.moveLane}>
        <View style={styles.container}>
          <GameCanvas
            engine={engine}
            screenWidth={width}
            screenHeight={height}
            onReset={handleReset}
          />
        </View>
      </SwipeHandler>
    </View>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <GestureHandlerRootView style={styles.container}>
      {isLoading ? (
        <GameLoader onFinished={() => setIsLoading(false)} />
      ) : (
        <GameScreen />
      )}
    </GestureHandlerRootView>
  );
}
