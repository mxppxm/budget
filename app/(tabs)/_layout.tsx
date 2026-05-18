import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{icon}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.ink,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '明细',
          tabBarIcon: ({ focused }) => <TabIcon icon="⌘" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '统计与设置',
          tabBarIcon: ({ focused }) => <TabIcon icon="▥" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 82,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 18,
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
    borderRadius: 18,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
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
});
