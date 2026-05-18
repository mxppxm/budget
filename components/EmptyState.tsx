import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export function EmptyState() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏺</Text>
      <Text style={styles.title}>本月还没有账目哦</Text>
      <Text style={styles.subtitle}>点击下方 + 号记一笔吧！</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 120, paddingHorizontal: 24 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 17, color: theme.colors.ink, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.colors.muted, fontWeight: '600', textAlign: 'center' },
});
