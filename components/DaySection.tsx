import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DaySection as DaySectionType } from '../types';
import { formatDate } from '../lib/utils';
import { theme } from '../constants/theme';

interface DaySectionProps {
  section: DaySectionType;
}

export function DaySection({ section }: DaySectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(section.title)}</Text>
        <View style={styles.totals}>
          {section.dayTotalExpense > 0 && (
            <Text style={styles.expense}>支 ¥{section.dayTotalExpense.toFixed(2)}</Text>
          )}
          {section.dayTotalIncome > 0 && (
            <Text style={styles.income}>收 ¥{section.dayTotalIncome.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 13, color: theme.colors.muted, fontWeight: '900' },
  totals: { flexDirection: 'row', gap: 12 },
  expense: { fontSize: 12, color: theme.colors.amber, fontWeight: '800' },
  income: { fontSize: 12, color: theme.colors.green, fontWeight: '800' },
});
