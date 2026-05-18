import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { theme } from '../constants/theme';
import { triggerHaptic } from '../lib/haptics';

interface CategoryPickerProps {
  type: 'expense' | 'income';
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryPicker({ type, selected, onSelect }: CategoryPickerProps) {
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <View style={styles.container}>
      {categories.map((cat) => {
        const isSelected = selected === cat.label;
        return (
          <TouchableOpacity
            key={cat.label}
            onPress={() => {
              triggerHaptic('light');
              onSelect(cat.label);
            }}
            style={[
              styles.item,
              isSelected && styles.itemSelected,
            ]}
          >
            <Text style={styles.icon}>{cat.icon}</Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  item: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  itemSelected: { backgroundColor: theme.colors.deepGreen, borderColor: theme.colors.deepGreen },
  icon: { fontSize: 28, marginBottom: 4 },
  label: { fontSize: 11, color: theme.colors.text, fontWeight: '800' },
  labelSelected: { color: theme.colors.paper },
});
