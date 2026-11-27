import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Tela de Aparência — Etapa 6 (Ciclo 2).
 *
 * Placeholder do marco M1: a implementação completa vem no P6, depois da
 * migração (M2) — a prévia só é fidedigna quando não há mais cores fixas
 * nos componentes.
 */
export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Aparência</Text>
      <Text style={styles.subtitle}>Em breve: temas e tamanho de fonte.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 8 },
});
