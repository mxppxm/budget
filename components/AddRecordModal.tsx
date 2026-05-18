import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRecordStore } from '../store/recordStore';
import { CategoryPicker } from './CategoryPicker';
import { CustomKeyboard } from './CustomKeyboard';
import { getBudgetStatus, getDateString } from '../lib/utils';
import { triggerHaptic } from '../lib/haptics';
import { theme } from '../constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AddRecordModal({ visible, onClose }: Props) {
  const { state, addRecord } = useRecordStore();
  const [recType, setRecType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('日常');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setRecType('expense');
    setAmount('');
    setCategory('日常');
    setRemark('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
    const totalBudget = Object.values(state.budget?.category_budgets ?? {}).reduce(
      (sum, val) => sum + val,
      0
    );
    const status = getBudgetStatus(
      state.monthlySummary.total_expense + (recType === 'expense' ? parsedAmount : 0),
      totalBudget,
      !!state.budget?.is_open
    );
    const categoryBudget = state.budget?.category_budgets?.[category] ?? 0;
    const categorySpent =
      state.categoryRanking.find((item) => item.category === category)?.total_amount ?? 0;
    const categoryStatus = getBudgetStatus(
      categorySpent + (recType === 'expense' ? parsedAmount : 0),
      categoryBudget,
      !!state.budget?.is_open
    );
    triggerHaptic(status === 'OVER' || categoryStatus === 'OVER' ? 'warning' : 'success');
    setSaving(false);
    handleClose();
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.scrim} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose}>
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
              onPress={() => {
                setRecType('expense');
                setCategory('日常');
              }}
            >
              <Text style={[styles.segmentText, recType === 'expense' && styles.segmentTextActive]}>
                支出
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, recType === 'income' && styles.segmentActive]}
              onPress={() => {
                setRecType('income');
                setCategory('工资');
              }}
            >
              <Text style={[styles.segmentText, recType === 'income' && styles.segmentTextActive]}>
                收入
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountDisplay}>
            <Text style={styles.currencySymbol}>¥</Text>
            <Text style={styles.amountText} numberOfLines={1}>
              {amount || '0'}
            </Text>
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
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(36,49,46,0.28)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '92%',
    backgroundColor: theme.colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.line,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
  },
  cancelText: { fontSize: 16, color: theme.colors.muted, fontWeight: '800' },
  modalTitle: { fontSize: 17, fontWeight: '900', color: theme.colors.ink },
  saveText: { fontSize: 16, color: theme.colors.green, fontWeight: '900' },
  disabledText: { opacity: 0.5 },
  segment: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 4,
    backgroundColor: theme.colors.key,
    borderRadius: 18,
    padding: 4,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  segmentActive: {
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  segmentText: { fontSize: 15, color: theme.colors.muted, fontWeight: '800' },
  segmentTextActive: { color: theme.colors.ink },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
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
