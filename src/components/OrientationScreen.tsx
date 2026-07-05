import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { styles } from './OrientationScreen.styles';

interface OrientationScreenProps {
  onSelect: () => void;
}

export const OrientationScreen = ({ onSelect }: OrientationScreenProps) => {
  const handleSelect = async (orientation: 'PORTRAIT' | 'LANDSCAPE') => {
    try {
      if (orientation === 'PORTRAIT') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
      onSelect();
    } catch (error) {
      console.warn('Failed to lock orientation:', error);
      // Fallback: still start game even if locking fails
      onSelect();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CHOOSE ORIENTATION</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => handleSelect('PORTRAIT')}
        >
          <Text style={styles.buttonText}>VERTICAL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonHorizontal]}
          activeOpacity={0.8}
          onPress={() => handleSelect('LANDSCAPE')}
        >
          <Text style={styles.buttonText}>HORIZONTAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
