import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp, MedicalRecord, Patient } from '@/context/AppContext';
import { router } from 'expo-router';
import {
  Users,
  UserCheck,
  UserX,
  Archive,
  FileText,
  Sparkles,
  LogOut,
  ArrowRight,
  Settings,
  ChevronRight,
} from 'lucide-react-native';
import { formatarNome } from '@/utils/nome';
import { ActionTile, StatCard, StatSummary } from '@/components';
import { colors, radius, shadowCard, spacing, typography } from '@/theme/tokens';

function saudacaoDoDia(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function dataPorExtenso(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export default function PsychologistDashboard() {
  const { db, currentUser, logout, getPatientsByStatus } = useApp();
  const insets = useSafeAreaInsets();

  const activePatients = getPatientsByStatus('Ativo');
  const inactivePatients = getPatientsByStatus('Inativo');
  const archivedPatients = getPatientsByStatus('Arquivado');
  const totalPatients = db.patients.length;

  const totalRecords = db.medicalRecords.length;
  const activeRecords = db.medicalRecords.filter((r): r is MedicalRecord => r.status === 'Ativo').length;
  const archivedRecords = db.medicalRecords.filter((r): r is MedicalRecord => r.status === 'Arquivado').length;

  const pct = (value: number) => (totalPatients > 0 ? `${Math.round((value / totalPatients) * 100)}%` : '0%');

  const openPatients = () => router.push('/patients');
  const openProfile = () => router.push('/profile');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerIdentity}>
            <View style={styles.avatarBadge}>
              <Sparkles size={16} color={colors.brand} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.greeting} numberOfLines={1}>
                {formatarNome(currentUser?.name)}
              </Text>
              <Text style={styles.roleSubtext} numberOfLines={1}>
                {saudacaoDoDia()} • {dataPorExtenso()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={logout}
            activeOpacity={0.8}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Sair do consultório"
          >
            <LogOut size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Visão geral — grade 2×2 (BoardUI Stat Cards) */}
        <Text style={styles.sectionTitle}>Visão geral</Text>

        <View style={styles.gridRow}>
          <StatCard
            label="Total de Pacientes"
            value={totalPatients}
            tone="brand"
            icon={<Users size={20} color={colors.brand} />}
            chip="Total"
            chipTone="brand"
          />
          <StatCard
            label="Ativos"
            value={activePatients.length}
            tone="success"
            icon={<UserCheck size={20} color={colors.success} />}
            chip={pct(activePatients.length)}
            chipTone="positive"
          />
        </View>

        <View style={styles.gridRow}>
          <StatCard
            label="Inativos"
            value={inactivePatients.length}
            tone="warning"
            icon={<UserX size={20} color={colors.warning} />}
            chip={pct(inactivePatients.length)}
          />
          <StatCard
            label="Arquivados"
            value={archivedPatients.length}
            tone="muted"
            icon={<Archive size={20} color={colors.muted} />}
            chip={pct(archivedPatients.length)}
          />
        </View>

        {/* Prontuários — card único com barra de proporção */}
        <Text style={styles.sectionTitle}>Prontuários</Text>

        <StatSummary
          title="Prontuários do paciente"
          total={totalRecords}
          segments={[
            { label: 'Prontuários ativos', count: activeRecords, color: colors.brand },
            { label: 'Prontuários arquivados', count: archivedRecords, color: colors.muted },
          ]}
        />

        {/* Ações rápidas */}
        <Text style={styles.sectionTitle}>Ações rápidas</Text>

        <View style={styles.gridRow}>
          <ActionTile
            title="Gerenciar Pacientes"
            description="Cadastrar, editar e arquivar"
            icon={<Users size={20} color={colors.brand} />}
            trailingIcon={<ChevronRight size={16} color={colors.textTertiary} />}
            onPress={openPatients}
            accessibilityLabel="Gerenciar Pacientes"
            accessibilityHint="Abre a lista de pacientes para cadastrar, editar e arquivar"
          />
          <ActionTile
            title="Perfil & Configurações"
            description="Dados, exportação e sair"
            icon={<Settings size={20} color={colors.brand} />}
            trailingIcon={<ChevronRight size={16} color={colors.textTertiary} />}
            onPress={openProfile}
            accessibilityLabel="Perfil e Configurações"
            accessibilityHint="Abre os dados do psicólogo, a exportação de dados e a saída"
          />
        </View>

        {/* Pacientes ativos (resumo) */}
        <Text style={styles.sectionTitle}>Pacientes ativos</Text>

        {activePatients.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <FileText size={22} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum paciente ativo</Text>
            <Text style={styles.emptySub}>
              Cadastre o primeiro paciente para começar o prontuário.
            </Text>
            <TouchableOpacity style={styles.emptyAction} onPress={openPatients} activeOpacity={0.85}>
              <Text style={styles.emptyActionText}>Cadastrar paciente</Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.patientList}>
            {activePatients.slice(0, 4).map((p: Patient) => (
              <View key={p.id} style={styles.patientRow}>
                <View style={styles.avatarCircleSmall}>
                  <Users size={18} color={colors.brand} />
                </View>
                <View style={styles.patientRowInfo}>
                  <Text style={styles.patientRowName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.patientRowMeta} numberOfLines={1}>
                    {p.email}
                  </Text>
                </View>
                <View style={styles.statusBadgeActive}>
                  <Text style={styles.statusText}>Ativo</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activePatients.length > 4 && (
          <TouchableOpacity style={styles.viewAll} onPress={openPatients} activeOpacity={0.8}>
            <Text style={styles.viewAllText}>Ver todos os pacientes ({totalPatients}) →</Text>
          </TouchableOpacity>
        )}

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>PsiApp — Consultório Pessoal do Psicólogo</Text>
          <Text style={styles.footerTextSmall}>Dados salvos localmente no dispositivo.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
    ...shadowCard,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  headerText: { flexShrink: 1 },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { ...typography.title2, color: colors.textPrimary },
  roleSubtext: { ...typography.caption, color: colors.brand, marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },

  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },

  gridRow: { flexDirection: 'row', gap: spacing.lg },

  patientList: { gap: spacing.md },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowCard,
  },
  avatarCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientRowInfo: { flex: 1, marginHorizontal: spacing.lg, gap: 2 },
  patientRowName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  patientRowMeta: { ...typography.bodyRegular, color: colors.textSecondary },
  statusBadgeActive: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  statusText: { ...typography.caption, color: colors.success },

  emptyCard: {
    backgroundColor: colors.card,
    padding: spacing.xxl,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadowCard,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary },
  emptySub: {
    ...typography.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    minHeight: 44,
  },
  emptyActionText: { ...typography.label, color: '#FFFFFF' },

  viewAll: { alignItems: 'center', paddingVertical: spacing.sm },
  viewAllText: { ...typography.label, color: colors.brand },

  footer: { marginTop: spacing.lg, alignItems: 'center', gap: spacing.xs },
  footerText: { ...typography.label, color: colors.textPrimary },
  footerTextSmall: { ...typography.caption, color: colors.textTertiary },
});
