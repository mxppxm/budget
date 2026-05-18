import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import type { Record } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { theme } from '../constants/theme';

interface RecordItemProps {
  record: Record;
  onDelete: (id: string) => void;
}

function getCategoryIcon(category: string, type: 'expense' | 'income'): string {
  const cats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return cats.find((c) => c.label === category)?.icon ?? '📦';
}

export function RecordItem({ record, onDelete }: RecordItemProps) {
  const isExpense = record.type === 'expense';
  const icon = getCategoryIcon(record.category, record.type);
  const [showDelete, setShowDelete] = useState(false);

  const handleLongPress = () => {
    setShowDelete(true);
  };

  const handlePress = () => {
    if (showDelete) {
      setShowDelete(false);
    }
  };

  const handleDelete = () => {
    setShowDelete(false);
    onDelete(record.id);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.touchable}
        onLongPress={handleLongPress}
        onPress={handlePress}
      >
        <View style={styles.card}>
          <View style={[styles.iconWrap, isExpense ? styles.expenseIconWrap : styles.incomeIconWrap]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.category}>{record.category}</Text>
            {record.remark ? (
              <Text style={styles.remark} numberOfLines={1}>{record.remark}</Text>
            ) : (
              <Text style={styles.remark} numberOfLines={1}>{record.date}</Text>
            )}
          </View>
          <Text style={[styles.amount, isExpense ? styles.expenseAmount : styles.incomeAmount]}>
            {isExpense ? '-' : '+'}¥{record.amount.toFixed(2)}
          </Text>
        </View>
      </Pressable>
      {showDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>删除</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  touchable: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseIconWrap: { backgroundColor: theme.colors.amberSoft },
  incomeIconWrap: { backgroundColor: theme.colors.greenSoft },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  category: { fontSize: 15, color: theme.colors.ink, fontWeight: '900' },
  remark: { fontSize: 12, color: theme.colors.muted, marginTop: 3, fontWeight: '600' },
  amount: { fontSize: 15, fontWeight: '900' },
  expenseAmount: { color: theme.colors.ink },
  incomeAmount: { color: theme.colors.green },
  deleteBtn: {
    position: 'absolute',
    right: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.red,
    borderRadius: theme.radius.md,
  },
  deleteText: { color: theme.colors.card, fontSize: 14, fontWeight: '900' },
});