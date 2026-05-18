import { Slot } from 'expo-router';
import { RecordStoreProvider } from '../store/recordStore';

export default function RootLayout() {
  return (
    <RecordStoreProvider>
      <Slot />
    </RecordStoreProvider>
  );
}
