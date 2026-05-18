import { Tabs } from 'expo-router';
import { Text, View, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { theme } from '../../constants/theme';
import { AddRecordModalProvider, useAddRecordModal } from '../../contexts/AddRecordModalContext';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{icon}</Text>
    </View>
  );
}

function CenterAddButton() {
  const { openAddModal } = useAddRecordModal();

  return (
    <View style={styles.addSlot}>
      <Pressable
        style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        onPress={openAddModal}
        accessibilityRole="button"
        accessibilityLabel="新增记录"
      >
        <Text style={styles.addBtnPlus}>+</Text>
        <Text style={styles.addBtnLabel}>记账</Text>
      </Pressable>
    </View>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 12);

  const pressTab = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const indexFocused = state.routes[state.index]?.name === 'index';
  const statsFocused = state.routes[state.index]?.name === 'stats';

  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPad }]}>
      <Pressable
        style={styles.tabItem}
        onPress={() => pressTab('index')}
        accessibilityRole="tab"
        accessibilityState={{ selected: indexFocused }}
      >
        <TabIcon icon="⌘" focused={indexFocused} />
        <Text style={[styles.tabLabel, indexFocused && styles.tabLabelActive]}>明细</Text>
      </Pressable>

      <CenterAddButton />

      <Pressable
        style={styles.tabItem}
        onPress={() => pressTab('stats')}
        accessibilityRole="tab"
        accessibilityState={{ selected: statsFocused }}
      >
        <TabIcon icon="▥" focused={statsFocused} />
        <Text style={[styles.tabLabel, statsFocused && styles.tabLabelActive]}>统计</Text>
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  return (
    <AddRecordModalProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: '明细' }} />
        <Tabs.Screen name="stats" options={{ title: '统计' }} />
      </Tabs>
    </AddRecordModalProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 88,
    paddingTop: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 14,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    minHeight: 52,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    color: theme.colors.muted,
  },
  tabLabelActive: {
    color: theme.colors.ink,
  },
  iconWrap: {
    width: 32,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: theme.colors.ink,
  },
  icon: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.muted,
  },
  iconActive: {
    color: theme.colors.paper,
  },
  addSlot: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  addBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32,
    borderWidth: 4,
    borderColor: theme.colors.card,
    shadowColor: theme.colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  addBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  addBtnPlus: {
    fontSize: 30,
    fontWeight: '300',
    color: theme.colors.paper,
    lineHeight: 32,
    marginTop: -4,
  },
  addBtnLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.paper,
    marginTop: -6,
    letterSpacing: 0.5,
  },
});
