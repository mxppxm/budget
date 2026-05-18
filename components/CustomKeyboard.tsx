import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { triggerHaptic } from '../lib/haptics';
import { theme } from '../constants/theme';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
];

interface CustomKeyboardProps {
  onKeyPress: (key: string) => void;
  onConfirm: () => void;
}

export function CustomKeyboard({ onKeyPress, onConfirm }: CustomKeyboardProps) {
  return (
    <View style={styles.container}>
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.key,
                key === '⌫' && styles.deleteKey,
                pressed && styles.keyPressed,
              ]}
              onPress={() => {
                triggerHaptic('light');
                onKeyPress(key);
              }}
            >
              <Text style={[styles.keyText, key === '⌫' && styles.deleteKeyText]}>
                {key}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
      <Pressable
        style={({ pressed }) => [styles.confirmKey, pressed && styles.confirmPressed]}
        onPress={() => { triggerHaptic('light'); onConfirm(); }}
      >
        <Text style={styles.confirmText}>确认</Text>
      </Pressable>
    </View>
  );
}

const { width } = Dimensions.get('window');
const KEY_SIZE = (width - 48 - 24) / 3;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  key: {
    width: KEY_SIZE,
    height: 56,
    backgroundColor: theme.colors.key,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteKey: { backgroundColor: theme.colors.amberSoft },
  keyPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: theme.colors.line,
  },
  keyText: { fontSize: 24, fontWeight: '800', color: theme.colors.ink },
  deleteKeyText: { fontSize: 20 },
  confirmKey: {
    height: 56,
    backgroundColor: theme.colors.deepGreen,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  confirmPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#8F1023',
  },
  confirmText: { color: theme.colors.paper, fontSize: 18, fontWeight: '900' },
});
