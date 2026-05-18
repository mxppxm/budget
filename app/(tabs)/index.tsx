import React, { useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRecordStore } from '../../store/recordStore';
import { DaySection } from '../../components/DaySection';
import { RecordItem } from '../../components/RecordItem';
import { EmptyState } from '../../components/EmptyState';
import { getMonthLabel, formatCurrency, getBudgetStatus } from '../../lib/utils';
import { triggerHaptic } from '../../lib/haptics';
import { theme } from '../../constants/theme';
import { EXPENSE_CATEGORIES } from '../../constants/categories';

export default function LedgerScreen() {
  const { state, loadData, removeRecord, markWarningSeen, groupRecordsByDay } = useRecordStore();

  useEffect(() => {
    loadData();
  }, [state.currentMonth]);

  useEffect(() => {
    const totalBudget = Object.values(state.budget?.category_budgets ?? {}).reduce(
      (sum, val) => sum + val,
      0
    );
    const status = getBudgetStatus(
      state.monthlySummary.total_expense,
      totalBudget,
      !!state.budget?.is_open
    );
    if (status === 'WARNING' && !state.hasSeenWarning) {
      Alert.alert('预算预警', '本月预算已消耗超过 80%，请注意控制贷款和日常支出哦~', [
        { text: '好的', onPress: markWarningSeen },
      ]);
    }
  }, [state.monthlySummary, state.budget, state.hasSeenWarning, markWarningSeen]);

  const handleDeleteRecord = (id: string) => {
    Alert.alert('删除账目', '确定要删除这条记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          triggerHaptic('warning');
          await removeRecord(id);
        },
      },
    ]);
  };

  const sections = groupRecordsByDay(state.records);
  const { total_expense, total_income } = state.monthlySummary;
  const balance = total_income - total_expense;
  const activeExpenseCategoryLabels = EXPENSE_CATEGORIES.map((item) => item.label);
  const listHeader = (
    <>
      <View style={styles.hero}>
        <View style={styles.monthRow}>
          <View style={styles.monthCenter}>
            <Text style={styles.monthLabel}>{getMonthLabel(state.currentMonth)}</Text>
            <Text style={styles.monthHint}>今天记账，本月自动汇总</Text>
          </View>
        </View>
        <Text style={styles.balanceLabel}>结余</Text>
        <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>收入</Text>
            <Text style={[styles.summaryValue, styles.income]}>{formatCurrency(total_income)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>支出</Text>
            <Text style={[styles.summaryValue, styles.expense]}>{formatCurrency(total_expense)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>每日流水</Text>
        <Text style={styles.sectionCount}>
          {sections.reduce((sum, section) => sum + section.data.length, 0)} 笔
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordItem record={item} onDelete={handleDeleteRecord} />
        )}
        renderSectionHeader={({ section }) => <DaySection section={section} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState />
          </View>
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.paper },
  hero: {
    marginHorizontal: 18,
    marginTop: 8,
    padding: 18,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.deepGreen,
    shadowColor: theme.colors.deepGreen,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 5,
  },
  monthRow: { alignItems: 'flex-start', marginBottom: 18 },
  monthCenter: { alignItems: 'flex-start' },
  monthLabel: { fontSize: 18, fontWeight: '900', color: theme.colors.paper },
  monthHint: { fontSize: 11, fontWeight: '700', color: theme.colors.amberSoft, marginTop: 2 },
  balanceLabel: { color: theme.colors.amberSoft, fontSize: 12, fontWeight: '800' },
  balanceValue: { color: theme.colors.card, fontSize: 34, fontWeight: '900', marginTop: 2 },
  summary: { flexDirection: 'row', gap: 10, marginTop: 16 },
  summaryItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderRadius: 16,
    padding: 12,
  },
  summaryLabel: { color: theme.colors.amberSoft, fontSize: 11, fontWeight: '800' },
  summaryValue: { fontSize: 16, fontWeight: '900', marginTop: 4 },
  income: { color: theme.colors.greenSoft },
  expense: { color: theme.colors.amberSoft },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  sectionTitle: { fontSize: 17, color: theme.colors.ink, fontWeight: '900' },
  sectionCount: { fontSize: 12, color: theme.colors.muted, fontWeight: '800' },
  listContent: { paddingBottom: 132 },
  emptyWrap: { minHeight: 360 },
});
