import { Stack } from 'expo-router';
import { RecordStoreProvider } from '../store/recordStore';
import { theme } from '../constants/theme';

export default function RootLayout() {
  return (
    <RecordStoreProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            headerTitle: '设置',
            headerBackTitle: '返回',
            headerTintColor: theme.colors.ink,
            headerStyle: { backgroundColor: theme.colors.paper },
          }}
        />
      </Stack>
    </RecordStoreProvider>
  );
}
