import { Stack } from 'expo-router';
import { AppProvider } from '@/context/AppContext';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <AppProvider>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="patients" />
        <Stack.Screen name="patients/[patientId]/reports" />
        <Stack.Screen name="patients/[patientId]/details" />
        <Stack.Screen name="patients/[patientId]/export-pdf" />
      </AppProvider>
    </Stack>
  );
}
