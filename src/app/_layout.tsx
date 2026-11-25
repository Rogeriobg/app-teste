import React from 'react';
import { Stack } from 'expo-router';
import { AppProvider } from '@/context/AppContext';

/**
 * Layout raiz do Expo Router.
 *
 * O `AppProvider` fica ACIMA do `<Stack>` para que todas as telas
 * (incluindo as que o Expo Router monta internamente) tenham acesso ao
 * contexto global.
 *
 * Nota: o ponto de entrada do app é `expo-router/entry` (campo `main` do
 * package.json). Ele monta o `ExpoRoot`, que é responsável pelos providers
 * internos do router (LinkPreviewContext, RoutingQueue e SafeAreaProvider).
 * Registrar a própria rota como root quebraria esses providers.
 */
export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="patients" />
        <Stack.Screen name="patients/[patientId]/reports" />
        <Stack.Screen name="patients/[patientId]/details" />
        <Stack.Screen name="patients/[patientId]/export-pdf" />
        <Stack.Screen name="profile" />
      </Stack>
    </AppProvider>
  );
}
