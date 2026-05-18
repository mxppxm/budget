import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch, Alert, SafeAreaView,
  TouchableOpacity, TextInput,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRecordStore } from '../store/recordStore';
import { Card } from '../components/ui/Card';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import { triggerHaptic } from '../lib/haptics';
import { theme } from '../constants/theme';
import { exportAllData } from '../lib/db';
import type { CategoryBudgets } from '../types';

export default function SettingsScreen() {
  const { state, loadData, setBudget } = useRecordStore();
  const [isOpen, setIsOpen] = useState(false);
  const [categoryBudgetInputs, setCategoryBudgetInputs] = useState<CategoryBudgets>({});

  useEffect(() => {
    if (state.budget) {
      setIsOpen(!!state.budget.is_open);
      setCategoryBudgetInputs(state.budget.category_budgets ?? {});
    } else {
      setIsOpen(false);
      setCategoryBudgetInputs({});
    }
  }, [state.budget]);

  const handleToggle = async (val: boolean) => {
    setIsOpen(val);
    triggerHaptic('light');
    await setBudget({
      month: state.currentMonth,
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
      is_open: isOpen ? 1 : 0,
      category_budgets: nextBudgets,
    });
  };

  const handleExport = async () => {
    try {
      triggerHaptic('light');
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const filename = `budget_backup_${new Date().toISOString().slice(0, 10)}.json`;
      const file = new File(Paths.document, filename);
      file.create({ overwrite: true });
      file.write(json);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: '导出数据' });
      } else {
        Alert.alert('导出成功', `文件已保存至：${file.uri}`);
      }
    } catch (e) {
      Alert.alert('导出失败', String(e));
    }
  };

  const handleImport = () => {
    Alert.alert(
      '导入数据',
      '请将之前导出的 JSON 文件放到「文件」App 的「我的 iPhone」/「Expo」目录下，文件名为 budget_backup_*.json，然后重新打开应用自动导入。\n\n或者你可以手动复制 JSON 内容。',
      [{ text: '知道了' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>数据管理</Text>
        </View>
        <Card>
          <TouchableOpacity style={styles.actionRow} onPress={handleExport} activeOpacity={0.7}>
            <View>
              <Text style={styles.actionLabel}>导出数据</Text>
              <Text style={styles.actionDesc}>将所有账目和预算导出为 JSON 文件</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={handleImport} activeOpacity={0.7}>
            <View>
              <Text style={styles.actionLabel}>导入数据</Text>
              <Text style={styles.actionDesc}>从 JSON 文件恢复账目和预算</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.paper },
  scroll: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 112 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: theme.colors.ink },
  sectionHint: { fontSize: 12, fontWeight: '800', color: theme.colors.muted },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLabel: { fontSize: 15, color: theme.colors.ink, fontWeight: '900' },
  budgetDesc: { fontSize: 12, color: theme.colors.muted, fontWeight: '600', marginTop: 4 },
  budgetFields: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.line, gap: 16 },
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
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  actionLabel: { fontSize: 15, color: theme.colors.ink, fontWeight: '900' },
  actionDesc: { fontSize: 12, color: theme.colors.muted, fontWeight: '600', marginTop: 4 },
  actionArrow: { fontSize: 22, color: theme.colors.muted, fontWeight: '600' },
  divider: { height: 1, backgroundColor: theme.colors.line, marginVertical: 12 },
});
