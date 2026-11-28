import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles } from '@/theme/hooks';
import { useTheme } from '@/theme/context';
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
import { mixColors } from '@/theme/contrast';
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
  const css = useThemeStyles();
  const { theme } = useTheme();
  const c = theme.colors;

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
    <View style={[styles.container, css.page]}>
      {/* Header */}
      <View style={[styles.header, css.surface, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerIdentity}>
            <View style={styles.avatarBadge}>
              <Sparkles size={16} color={c.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.greeting, css.text, css.fontTitle2]} numberOfLines={1}>
                {formatarNome(currentUser?.name)}
              </Text>
              <Text style={[styles.roleSubtext, css.primary]} numberOfLines={1}>
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

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Visão geral — grade 2×2 (BoardUI Stat Cards) */}
        <Text style={[styles.sectionTitle, css.text, css.fontHeadline]}>Visão geral</Text>

        <View style={styles.gridRow}>
          <StatCard
            label="Total de Pacientes"
            value={totalPatients}
            tone="brand"
            icon={<Users size={20} color={c.primary} />}
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
        <Text style={[styles.sectionTitle, css.text, css.fontHeadline]}>Prontuários</Text>

        <StatSummary
          title="Prontuários do paciente"
          total={totalRecords}
          segments={[
            { label: 'Prontuários ativos', count: activeRecords, color: c.primary },
            { label: 'Prontuários arquivados', count: archivedRecords, color: mixColors(c.surface, c.primary, 0.3) },
          ]}
        />

        {/* Ações rápidas */}
        <Text style={[styles.sectionTitle, css.text, css.fontHeadline]}>Ações rápidas</Text>

        <View style={styles.gridRow}>
          <ActionTile
            title="Gerenciar Pacientes"
            description="Cadastrar, editar e arquivar"
            icon={<Users size={20} color={c.primary} />}
            trailingIcon={<ChevronRight size={16} color={colors.textMuted} />}
            onPress={openPatients}
            accessibilityLabel="Gerenciar Pacientes"
            accessibilityHint="Abre a lista de pacientes para cadastrar, editar e arquivar"
          />
          <ActionTile
            title="Perfil & Configurações"
            description="Dados, exportação e sair"
            icon={<Settings size={20} color={c.primary} />}
            trailingIcon={<ChevronRight size={16} color={colors.textMuted} />}
            onPress={openProfile}
            accessibilityLabel="Perfil e Configurações"
            accessibilityHint="Abre os dados do psicólogo, a exportação de dados e a saída"
          />
        </View>

        {/* Pacientes ativos (resumo) */}
        <Text style={[styles.sectionTitle, css.text, css.fontHeadline]}>Pacientes ativos</Text>

        {activePatients.length === 0 ? (
          <View style={[styles.emptyCard, css.cardTint, css.cardBorder]}>
            <View style={styles.emptyIcon}>
              <FileText size={22} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, css.text]}>Nenhum paciente ativo</Text>
            <Text style={[styles.emptySub, css.textSecondary]}>
              Cadastre o primeiro paciente para começar o prontuário.
            </Text>
            <TouchableOpacity
              style={[styles.emptyAction, css.primaryBg]}
              onPress={openPatients}
              activeOpacity={0.85}
            >
              <Text style={[styles.emptyActionText, css.onPrimary]} numberOfLines={1}>
                Cadastrar paciente
              </Text>
              <ArrowRight size={14} color={c.onPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.patientList}>
            {activePatients.slice(0, 4).map((p: Patient) => (
              <View key={p.id} style={[styles.patientRow, css.cardTint, css.cardBorder]}>
                <View style={styles.avatarCircleSmall}>
                  <Users size={18} color={c.primary} />
                </View>
                <View style={styles.patientRowInfo}>
                  <Text style={styles.patientRowName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.patientRowMeta} numberOfLines={1}>
                    {p.email}
                  </Text>
                </View>
                <View style={[styles.statusBadgeActive, css.primarySoft]}>
                  <Text style={[styles.statusText, css.primary]}>Ativo</Text>
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
  headerText: { flexShrink: 1, minWidth: 0 },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  greeting: { ...typography.title2, color: colors.textPrimary },
  roleSubtext: { ...typography.caption, color: colors.brandText, marginTop: 2 },
  /**
   * Botão de sair: alvo de toque de 44x44 px (era 40x40).
   * A ação é destrutiva — não pode ser pequena nem fácil de errar.
   */
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  scroll: { padding: spacing.xl, gap: spacing.lg },

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
    flexShrink: 0,
  },
  patientRowInfo: { flex: 1, minWidth: 0, marginHorizontal: spacing.lg, gap: 2 },
  patientRowName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  patientRowMeta: { ...typography.bodyRegular, color: colors.textSecondary },
  statusBadgeActive: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    flexShrink: 0,
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
    maxWidth: '100%',
  },
  emptyActionText: { ...typography.label, color: colors.textOnBrand, flexShrink: 1, minWidth: 0 },

  // link "Ver todos" também é alvo de toque: mínimo 44px de altura
  viewAll: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, minHeight: 44, minWidth: 44, paddingHorizontal: spacing.lg },
  viewAllText: { ...typography.label, color: colors.brandText },

  footer: { marginTop: spacing.lg, alignItems: 'center', gap: spacing.xs },
  footerText: { ...typography.label, color: colors.textPrimary },
  footerTextSmall: { ...typography.caption, color: colors.textMuted },
});
