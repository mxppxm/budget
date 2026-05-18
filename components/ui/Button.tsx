import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export function Button({ onPress, title, variant = 'primary', disabled }: ButtonProps) {
  const bg = variant === 'primary' ? theme.colors.red : variant === 'danger' ? theme.colors.red : theme.colors.key;
  const textColor = variant === 'secondary' ? theme.colors.ink : theme.colors.card;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor: bg }, disabled && styles.disabled]}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' },
  text: { fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
