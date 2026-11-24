import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { Mail, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react-native';

export default function LoginScreen() {
  const { login } = useApp();
  const [email, setEmail] = useState('psicologo@psicowave.com');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Digite seu e-mail de acesso');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ok = await login(email.trim());
      if (!ok) {
        setError('E-mail não cadastrado. Use psicologo@psicowave.com');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <Sparkles size={16} color="#0D9488" />
            <Text style={styles.badgeText}>PsiApp • Consultório Pessoal</Text>
          </View>
          <ShieldCheck size={32} color="#0D9488" style={styles.heroIcon} />
          <Text style={styles.title}>Consultório Psicológico</Text>
          <Text style={styles.subtitle}>Cadastro, prontuário e relatórios dos seus pacientes.</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Acesso ao Consultório</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputWrapper}>
            <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail do psicólogo"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.loadingButton]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.primaryButtonText}>Acessando...</Text>
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Entrar no Consultório</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4FBF7' },
  scroll: { padding: 20, paddingTop: 40, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#E6F4ED',
    borderRadius: 28,
    padding: 30,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D1EFE2',
    alignItems: 'center',
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  badgeText: { color: '#0F766E', fontWeight: '700', fontSize: 13 },
  heroIcon: { marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#133E2B', marginBottom: 8, letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#4A6B5D', lineHeight: 20, textAlign: 'center' },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: '#133E2B', marginBottom: 16 },
  errorText: { color: '#EF4444', marginBottom: 12, fontSize: 13, fontWeight: '500' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1E293B' },

  primaryButton: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingButton: { opacity: 0.7 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});
