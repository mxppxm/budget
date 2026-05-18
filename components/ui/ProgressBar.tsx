import React from 'react';
import { View } from 'react-native';
import { theme } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color: string;
  bgColor?: string;
  height?: number;
}

export function ProgressBar({ progress, color, bgColor = theme.colors.key, height = 8 }: ProgressBarProps) {
  return (
    <View style={{ backgroundColor: bgColor, height, borderRadius: height / 2, overflow: 'hidden' }}>
      <View
        style={{
          backgroundColor: color,
          height: '100%',
          width: `${Math.min(progress * 100, 100)}%`,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
