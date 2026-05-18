import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from './ui/ProgressBar';
import { getBudgetStatus } from '../lib/utils';
import { theme } from '../constants/theme';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import type { BudgetStatus, CategoryBudgets, CategoryRanking } from '../types';

const STATUS_COLORS: Record<BudgetStatus, string> = {
  DISABLED: theme.colors.faint,
  SAFE: theme.colors.green,
  WARNING: theme.colors.amber,
  OVER: theme.colors.red,
};

const STATUS_LABELS: Record<BudgetStatus, string> = {
  DISABLED: '未开启预算',
  SAFE: '安全',
  WARNING: '预警',
  OVER: '已超支',
};

interface BudgetProgressBarProps {
  totalExpense: number;
  isOpen: boolean;
  categoryBudgets?: CategoryBudgets;
  categoryRanking?: CategoryRanking[];
}

export function BudgetProgressBar({
  totalExpense,
  isOpen,
  categoryBudgets = {},
  categoryRanking = [],
}: BudgetProgressBarProps) {
  const totalBudget = Object.values(categoryBudgets).reduce((sum, val) => sum + val, 0);
  const status = getBudgetStatus(totalExpense, totalBudget, isOpen);
  const color = STATUS_COLORS[status];
  const ratio = isOpen && totalBudget > 0 ? Math.min(totalExpense / totalBudget, 1.5) : 0;
  const percentage = Math.round((totalExpense / totalBudget) * 100) || 0;
  const categoryRows = EXPENSE_CATEGORIES
    .map((category) => {
      const budget = categoryBudgets[category.label] ?? 0;
      const spent = categoryRanking.find((item) => item.category === category.label)?.total_amount ?? 0;
      return { ...category, budget, spent, status: getBudgetStatus(spent, budget, isOpen) };
    })
    .filter((item) => item.budget > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>本月预算</Text>
        <Text style={[styles.status, { color }]}>{STATUS_LABELS[status]}</Text>
      </View>
      <ProgressBar progress={ratio} color={color} height={10} />
      {isOpen && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Text style={{ color }}>已花 ¥{totalExpense.toFixed(2)}</Text>
            {' / '}
            <Text style={styles.secondary}>¥{totalBudget.toFixed(2)}</Text>
          </Text>
          <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
        </View>
      )}
      {status === 'OVER' && (
        <View style={styles.overBanner}>
          <Text style={styles.overText}>本月预算已超支！</Text>
        </View>
      )}
      {isOpen && categoryRows.length > 0 && (
        <View style={styles.categoryList}>
          {categoryRows.map((item) => {
            const itemColor = STATUS_COLORS[item.status];
            const itemRatio = item.budget > 0 ? Math.min(item.spent / item.budget, 1.5) : 0;
            return (
              <View key={item.label} style={styles.categoryRow}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{item.icon} {item.label}</Text>
                  <Text style={[styles.categoryAmount, { color: itemColor }]}>
                    ¥{item.spent.toFixed(0)} / ¥{item.budget.toFixed(0)}
                  </Text>
                </View>
                <ProgressBar progress={itemRatio} color={itemColor} height={6} />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 14, color: theme.colors.ink, fontWeight: '800' },
  status: { fontSize: 12, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  footerText: { fontSize: 12, fontWeight: '700' },
  secondary: { color: theme.colors.muted },
  percentage: { fontSize: 12, fontWeight: '900' },
  overBanner: {
    marginTop: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.redSoft,
    paddingVertical: 8,
    alignItems: 'center',
  },
  overText: { color: theme.colors.red, fontSize: 13, fontWeight: '900' },
  categoryList: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.line, gap: 10 },
  categoryRow: { gap: 6 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryName: { fontSize: 12, color: theme.colors.ink, fontWeight: '800' },
  categoryAmount: { fontSize: 12, fontWeight: '900' },
});
