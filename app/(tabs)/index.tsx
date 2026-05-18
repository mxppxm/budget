import React, { useEffect, useState } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  Alert, Modal, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { useRecordStore } from '../../store/recordStore';
import { BudgetProgressBar } from '../../components/BudgetProgressBar';
import { DaySection } from '../../components/DaySection';
import { RecordItem } from '../../components/RecordItem';
import { EmptyState } from '../../components/EmptyState';
import { CategoryPicker } from '../../components/CategoryPicker';
import { CustomKeyboard } from '../../components/CustomKeyboard';
import { getMonthLabel, formatCurrency, getDateString } from '../../lib/utils';
import { getBudgetStatus } from '../../lib/utils';
import { triggerHaptic } from '../../lib/haptics';
import { theme } from '../../constants/theme';
import { EXPENSE_CATEGORIES } from '../../constants/categories';

export default function LedgerScreen() {
  const { state, loadData, addRecord, removeRecord, markWarningSeen, groupRecordsByDay } = useRecordStore();
  const [modalVisible, setModalVisible] = useState(false);

  const [recType, setRecType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [state.currentMonth]);

  useEffect(() => {
    const status = getBudgetStatus(
      state.monthlySummary.total_expense,
      state.budget?.total_budget ?? 0,
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

  const openModal = () => {
    setRecType('expense');
    setAmount('');
    setCategory('');
    setRemark('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || parsedAmount <= 0) {
      Alert.alert('请输入金额');
      return;
    }
    if (!category) {
      Alert.alert('请选择分类');
      return;
    }
    setSaving(true);
    await addRecord({
      amount: parsedAmount,
      type: recType,
      category,
      date: getDateString(),
      remark: remark.trim() || null,
    });
    const status = getBudgetStatus(
      state.monthlySummary.total_expense + (recType === 'expense' ? parsedAmount : 0),
      state.budget?.total_budget ?? 0,
      !!state.budget?.is_open
    );
    const categoryBudget = state.budget?.category_budgets?.[category] ?? 0;
    const categorySpent = state.categoryRanking.find((item) => item.category === category)?.total_amount ?? 0;
    const categoryStatus = getBudgetStatus(
      categorySpent + (recType === 'expense' ? parsedAmount : 0),
      categoryBudget,
      !!state.budget?.is_open
    );
    triggerHaptic(status === 'OVER' || categoryStatus === 'OVER' ? 'warning' : 'success');
    setSaving(false);
    setModalVisible(false);
  };

  const handleKeyPress = (key: string) => {
    if (key === '⌫') {
      setAmount((a) => a.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (!amount.includes('.')) setAmount((a) => (a ? `${a}.` : '0.'));
      return;
    }
    const newAmount = amount === '0' ? key : amount + key;
    const parts = newAmount.split('.');
    if (parts[1] && parts[1].length > 2) return;
    setAmount(newAmount);
  };

  const sections = groupRecordsByDay(state.records);
  const { total_expense, total_income } = state.monthlySummary;
  const balance = total_income - total_expense;
  const budget = state.budget;
  const activeExpenseCategoryLabels = EXPENSE_CATEGORIES.map((item) => item.label);
  const activeCategoryRanking = state.categoryRanking.filter((item) =>
    activeExpenseCategoryLabels.includes(item.category)
  );
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

      <View style={styles.budgetWrapper}>
        <BudgetProgressBar
          totalExpense={total_expense}
          totalBudget={budget?.total_budget ?? 0}
          isOpen={!!budget?.is_open}
          categoryBudgets={budget?.category_budgets ?? {}}
          categoryRanking={activeCategoryRanking}
        />
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>每日流水</Text>
        <Text style={styles.sectionCount}>{sections.reduce((sum, section) => sum + section.data.length, 0)} 笔</Text>
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
        ListEmptyComponent={<View style={styles.emptyWrap}><EmptyState /></View>}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} onPress={openModal} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.scrim} onPress={() => setModalVisible(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <SafeAreaView style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>记一笔</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving}>
                <Text style={[styles.saveText, saving && styles.disabledText]}>保存</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.segment}>
              <TouchableOpacity
                style={[styles.segmentBtn, recType === 'expense' && styles.segmentActive]}
                onPress={() => { setRecType('expense'); setCategory(''); }}
              >
                <Text style={[styles.segmentText, recType === 'expense' && styles.segmentTextActive]}>支出</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, recType === 'income' && styles.segmentActive]}
                onPress={() => { setRecType('income'); setCategory(''); }}
              >
                <Text style={[styles.segmentText, recType === 'income' && styles.segmentTextActive]}>收入</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountDisplay}>
              <Text style={styles.currencySymbol}>¥</Text>
              <Text style={styles.amountText} numberOfLines={1}>{amount || '0'}</Text>
            </View>

            <CategoryPicker type={recType} selected={category} onSelect={setCategory} />

            <View style={styles.optionalRow}>
              <TextInput
                style={styles.remarkInput}
                placeholder="备注（选填，限20字）"
                placeholderTextColor={theme.colors.faint}
                maxLength={20}
                value={remark}
                onChangeText={setRemark}
              />
            </View>

            <View style={styles.keyboardSpacer} />
            <CustomKeyboard onKeyPress={handleKeyPress} onConfirm={handleSave} />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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
  summaryItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.11)', borderRadius: 16, padding: 12 },
  summaryLabel: { color: theme.colors.amberSoft, fontSize: 11, fontWeight: '800' },
  summaryValue: { fontSize: 16, fontWeight: '900', marginTop: 4 },
  income: { color: theme.colors.greenSoft },
  expense: { color: theme.colors.amberSoft },
  budgetWrapper: { paddingHorizontal: 18, paddingTop: 14 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 2 },
  sectionTitle: { fontSize: 17, color: theme.colors.ink, fontWeight: '900' },
  sectionCount: { fontSize: 12, color: theme.colors.muted, fontWeight: '800' },
  listContent: { paddingBottom: 132 },
  emptyWrap: { minHeight: 360 },
  fab: {
    position: 'absolute',
    bottom: 98,
    right: 22,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: theme.colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.amber,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 9,
  },
  fabText: { fontSize: 34, color: theme.colors.ink, fontWeight: '300', marginTop: -3 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(36,49,46,0.28)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '92%',
    backgroundColor: theme.colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
  },
  sheetHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: theme.colors.line, alignSelf: 'center', marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 10 },
  cancelText: { fontSize: 16, color: theme.colors.muted, fontWeight: '800' },
  modalTitle: { fontSize: 17, fontWeight: '900', color: theme.colors.ink },
  saveText: { fontSize: 16, color: theme.colors.green, fontWeight: '900' },
  disabledText: { opacity: 0.5 },
  segment: { flexDirection: 'row', marginHorizontal: 18, marginTop: 4, backgroundColor: theme.colors.key, borderRadius: 18, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  segmentActive: { backgroundColor: theme.colors.card, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  segmentText: { fontSize: 15, color: theme.colors.muted, fontWeight: '800' },
  segmentTextActive: { color: theme.colors.ink },
  amountDisplay: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  currencySymbol: { fontSize: 24, color: theme.colors.muted, fontWeight: '800', marginRight: 5 },
  amountText: { fontSize: 42, fontWeight: '900', color: theme.colors.ink, maxWidth: '86%' },
  optionalRow: { paddingHorizontal: 18, marginTop: 8 },
  remarkInput: {
    height: 48,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    fontSize: 15,
    color: theme.colors.ink,
    borderWidth: 1,
    borderColor: theme.colors.line,
    fontWeight: '700',
  },
  keyboardSpacer: { flex: 1, minHeight: 8 },
});
