import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
  TextInput, SafeAreaView,
} from 'react-native';
import { useRecordStore } from '../../store/recordStore';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { getMonthLabel, formatCurrency } from '../../lib/utils';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { triggerHaptic } from '../../lib/haptics';
import { theme } from '../../constants/theme';
import type { CategoryBudgets } from '../../types';

export default function StatsScreen() {
  const { state, loadData, setBudget } = useRecordStore();
  const [categoryBudgetInputs, setCategoryBudgetInputs] = useState<CategoryBudgets>({});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [state.currentMonth]);

  useEffect(() => {
    if (state.budget) {
      setIsOpen(!!state.budget.is_open);
      setCategoryBudgetInputs(state.budget.category_budgets ?? {});
    } else {
      setIsOpen(false);
      setCategoryBudgetInputs({});
    }
  }, [state.budget]);

  const derivedTotalBudget = EXPENSE_CATEGORIES.reduce(
    (sum, category) => sum + (Number(categoryBudgetInputs[category.label]) || 0),
    0
  );

  const handleToggle = async (val: boolean) => {
    setIsOpen(val);
    triggerHaptic('light');
    await setBudget({
      month: state.currentMonth,
      total_budget: derivedTotalBudget,
      is_open: val ? 1 : 0,
      category_budgets: categoryBudgetInputs,
    });
  };

  const handleCategoryBudgetChange = async (category: string, text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const nextBudgets = {
      ...categoryBudgetInputs,
      [category]: parseInt(cleaned, 10) || 0,
    };
    setCategoryBudgetInputs(nextBudgets);
    await setBudget({
      month: state.currentMonth,
      total_budget: EXPENSE_CATEGORIES.reduce(
        (sum, item) => sum + (Number(nextBudgets[item.label]) || 0),
        0
      ),
      is_open: isOpen ? 1 : 0,
      category_budgets: nextBudgets,
    });
  };

  const { total_expense, total_income } = state.monthlySummary;
  const balance = total_income - total_expense;
  const activeExpenseCategoryLabels = EXPENSE_CATEGORIES.map((item) => item.label);
  const activeCategoryRanking = state.categoryRanking.filter((item) =>
    activeExpenseCategoryLabels.includes(item.category)
  );
  const maxCategoryAmount = activeCategoryRanking[0]?.total_amount ?? 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.monthCenter}>
            <Text style={styles.monthLabel}>{getMonthLabel(state.currentMonth)}</Text>
            <Text style={styles.monthHint}>统计与设置</Text>
          </View>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>总收入</Text>
              <Text style={[styles.summaryValue, styles.income]}>{formatCurrency(total_income)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>总支出</Text>
              <Text style={styles.summaryValue}>{formatCurrency(total_expense)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>结余</Text>
              <Text style={[styles.summaryValue, balance >= 0 ? styles.income : styles.over]}>
                {formatCurrency(balance)}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>分类支出排行</Text>
          <Text style={styles.sectionHint}>按金额降序</Text>
        </View>
        {activeCategoryRanking.length === 0 ? (
          <Card><Text style={styles.emptyText}>暂无支出记录</Text></Card>
        ) : (
          <Card style={styles.rankingCard}>
            {activeCategoryRanking.map((item, index) => {
              const cat = EXPENSE_CATEGORIES.find((c) => c.label === item.category);
              const icon = cat?.icon ?? '📦';
              const ratio = item.total_amount / maxCategoryAmount;
              return (
                <View key={item.category} style={[styles.categoryRow, index > 0 && styles.rowDivider]}>
                  <View style={styles.catIconWrap}>
                    <Text style={styles.catIcon}>{icon}</Text>
                  </View>
                  <View style={styles.catInfo}>
                    <View style={styles.catHeader}>
                      <Text style={styles.catLabel}>{item.category}</Text>
                      <Text style={styles.catAmount}>¥{item.total_amount.toFixed(2)}</Text>
                    </View>
                    <ProgressBar progress={ratio} color={theme.colors.deepGreen} height={8} />
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>每月预算管理</Text>
          <Text style={styles.sectionHint}>人民币元</Text>
        </View>
        <Card>
          <View style={styles.budgetRow}>
            <View>
              <Text style={styles.budgetLabel}>开启预算</Text>
              <Text style={styles.budgetDesc}>首页会按消耗率显示绿/黄/红状态</Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={handleToggle}
              trackColor={{ false: theme.colors.key, true: theme.colors.greenSoft }}
              thumbColor={isOpen ? theme.colors.green : theme.colors.faint}
            />
          </View>
          {isOpen && (
            <View style={styles.budgetFields}>
              <View style={styles.derivedBudgetRow}>
                <Text style={styles.derivedBudgetLabel}>总预算</Text>
                <Text style={styles.derivedBudgetValue}>{formatCurrency(derivedTotalBudget)}</Text>
              </View>
              <View style={styles.categoryBudgetList}>
                <Text style={styles.categoryBudgetTitle}>分类预算</Text>
                {EXPENSE_CATEGORIES.map((category) => (
                  <View key={category.label} style={styles.categoryBudgetRow}>
                    <View style={styles.categoryBudgetLabelWrap}>
                      <Text style={styles.categoryBudgetIcon}>{category.icon}</Text>
                      <Text style={styles.categoryBudgetLabel}>{category.label}</Text>
                    </View>
                    <View style={styles.categoryBudgetInputWrap}>
                      <Text style={styles.categoryBudgetPrefix}>¥</Text>
                      <TextInput
                        style={styles.categoryBudgetInput}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={theme.colors.faint}
                        value={categoryBudgetInputs[category.label] ? String(categoryBudgetInputs[category.label]) : ''}
                        onChangeText={(text) => handleCategoryBudgetChange(category.label, text)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.paper },
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 112 },
  header: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 14,
    alignItems: 'flex-start',
  },
  monthCenter: { alignItems: 'flex-start' },
  monthLabel: { fontSize: 17, fontWeight: '900', color: theme.colors.ink },
  monthHint: { fontSize: 12, color: theme.colors.muted, fontWeight: '700', marginTop: 2 },
  summaryCard: { marginTop: 14 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 12, color: theme.colors.muted, marginBottom: 5, fontWeight: '800' },
  summaryValue: { fontSize: 15, fontWeight: '900', color: theme.colors.ink },
  income: { color: theme.colors.green },
  over: { color: theme.colors.red },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: theme.colors.ink },
  sectionHint: { fontSize: 12, fontWeight: '800', color: theme.colors.muted },
  emptyText: { color: theme.colors.muted, textAlign: 'center', paddingVertical: 16, fontSize: 14, fontWeight: '700' },
  rankingCard: { paddingVertical: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: theme.colors.line },
  catIconWrap: { width: 42, height: 42, borderRadius: 15, backgroundColor: theme.colors.amberSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  catIcon: { fontSize: 23 },
  catInfo: { flex: 1 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catLabel: { fontSize: 14, color: theme.colors.ink, fontWeight: '900' },
  catAmount: { fontSize: 14, color: theme.colors.ink, fontWeight: '900' },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLabel: { fontSize: 15, color: theme.colors.ink, fontWeight: '900' },
  budgetDesc: { fontSize: 12, color: theme.colors.muted, fontWeight: '600', marginTop: 4 },
  budgetFields: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.line, gap: 16 },
  derivedBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.redSoft,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  derivedBudgetLabel: { fontSize: 13, color: theme.colors.red, fontWeight: '900' },
  derivedBudgetValue: { fontSize: 18, color: theme.colors.red, fontWeight: '900' },
  categoryBudgetList: { gap: 10 },
  categoryBudgetTitle: { fontSize: 13, color: theme.colors.muted, fontWeight: '900' },
  categoryBudgetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryBudgetLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBudgetIcon: { fontSize: 19 },
  categoryBudgetLabel: { fontSize: 14, color: theme.colors.ink, fontWeight: '800' },
  categoryBudgetInputWrap: {
    width: 118,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.key,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
  },
  categoryBudgetPrefix: { fontSize: 14, color: theme.colors.muted, fontWeight: '900', marginRight: 4 },
  categoryBudgetInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.ink,
    textAlign: 'right',
  },
});
