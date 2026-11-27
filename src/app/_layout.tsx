import React from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/theme/context';

/**
 * D1 / Etapa 6: segura a splash até o tema salvo carregar.
 *
 * A doc do SDK 58 manda chamar isso em **escopo global** (não dentro de
 * componente/hook), senão pode ser tarde demais. O `ThemeProvider` chama
 * `SplashScreen.hideAsync()` no `finally` do carregamento.
 */
SplashScreen.preventAutoHideAsync();

/**
 * Layout raiz do Expo Router.
 *
 * `ThemeProvider` fica ACIMA de `AppProvider` e do `<Stack>` para que
 * todas as telas tenham acesso ao tema — inclusive as que o Expo Router
 * monta internamente.
 *
 * Nota: o ponto de entrada do app é `expo-router/entry` (campo `main` do
 * package.json). Ele monta o `ExpoRoot`, que é responsável pelos providers
 * internos do router (LinkPreviewContext, RoutingQueue e SafeAreaProvider).
 * Registrar a própria rota como root quebraria esses providers.
 */
export default function RootLayout() {
  return (
    <ThemeProvider>
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
          <Stack.Screen name="appearance" />
        </Stack>
      </AppProvider>
    </ThemeProvider>
  );
}
