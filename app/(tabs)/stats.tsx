import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRecordStore } from '../../store/recordStore';
import { Card } from '../../components/ui/Card';
import { getMonthLabel, formatCurrency } from '../../lib/utils';
import { theme } from '../../constants/theme';

export default function StatsScreen() {
  const { state, loadData, loadAllMonthlyHistory } = useRecordStore();
  const router = useRouter();

  useEffect(() => {
    loadData();
    loadAllMonthlyHistory();
  }, []);

  const { total_expense, total_income } = state.monthlySummary;
  const balance = total_income - total_expense;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.monthCenter}>
            <Text style={styles.monthLabel}>{getMonthLabel(state.currentMonth)}</Text>
            <Text style={styles.monthHint}>统计</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')} activeOpacity={0.7}>
            <Text style={styles.settingsBtnText}>设置</Text>
          </TouchableOpacity>
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

        <Text style={styles.historyTitle}>月历史记录</Text>

        {state.allMonthlyHistory.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>暂无历史记录</Text>
          </Card>
        ) : (
          state.allMonthlyHistory.map((item) => {
            const monthBalance = item.total_income - item.total_expense;
            return (
              <Card key={item.month} style={styles.monthCard}>
                <Text style={styles.monthCardLabel}>{getMonthLabel(item.month)}</Text>
                <View style={styles.monthCardStats}>
                  <View style={styles.monthCardStat}>
                    <Text style={styles.monthCardStatLabel}>收入</Text>
                    <Text style={[styles.monthCardStatValue, styles.income]}>
                      {formatCurrency(item.total_income)}
                    </Text>
                  </View>
                  <View style={styles.monthCardStat}>
                    <Text style={styles.monthCardStatLabel}>支出</Text>
                    <Text style={styles.monthCardStatValue}>
                      {formatCurrency(item.total_expense)}
                    </Text>
                  </View>
                  <View style={styles.monthCardStat}>
                    <Text style={styles.monthCardStatLabel}>结余</Text>
                    <Text
                      style={[
                        styles.monthCardStatValue,
                        monthBalance >= 0 ? styles.income : styles.over,
                      ]}
                    >
                      {formatCurrency(monthBalance)}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthCenter: { alignItems: 'flex-start' },
  monthLabel: { fontSize: 17, fontWeight: '900', color: theme.colors.ink },
  monthHint: { fontSize: 12, color: theme.colors.muted, fontWeight: '700', marginTop: 2 },
  settingsBtn: {
    backgroundColor: theme.colors.deepGreen,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
  },
  settingsBtnText: { color: theme.colors.paper, fontSize: 13, fontWeight: '900' },
  summaryCard: { marginTop: 14 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 12, color: theme.colors.muted, marginBottom: 5, fontWeight: '800' },
  summaryValue: { fontSize: 15, fontWeight: '900', color: theme.colors.ink },
  income: { color: theme.colors.green },
  over: { color: theme.colors.red },
  historyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.ink,
    marginTop: 28,
    marginBottom: 12,
  },
  monthCard: { marginBottom: 12, paddingVertical: 14, paddingHorizontal: 18 },
  emptyCard: { marginBottom: 12, paddingVertical: 32, paddingHorizontal: 18, alignItems: 'center' },
  emptyText: { fontSize: 14, color: theme.colors.muted, fontWeight: '600' },
  monthCardLabel: { fontSize: 16, fontWeight: '900', color: theme.colors.ink, marginBottom: 10 },
  monthCardStats: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  monthCardStat: { alignItems: 'center' },
  monthCardStatLabel: { fontSize: 11, color: theme.colors.muted, fontWeight: '800', marginBottom: 2 },
  monthCardStatValue: { fontSize: 14, fontWeight: '900', color: theme.colors.ink },
});
