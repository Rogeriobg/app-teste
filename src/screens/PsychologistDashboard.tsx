import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { Users, Calendar as CalendarIcon, FileText, Sparkles, LogOut, ArrowRight } from 'lucide-react-native';

export default function PsychologistDashboard() {
  const { db, currentUser, logout, setActiveScreen, getPatientsByStatus } = useApp();

  const activePatients = getPatientsByStatus('Ativo');
  const inactivePatients = getPatientsByStatus('Inativo');
  const archivedPatients = getPatientsByStatus('Arquivado');
  const totalRecords = db.medicalRecords.length;
  const activeRecords = db.medicalRecords.filter(r => r.status === 'Ativo').length;
  const archivedRecords = db.medicalRecords.filter(r => r.status === 'Arquivado').length;

  const openPatients = () => setActiveScreen('patients');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarBadge}>
            <Sparkles size={16} color="#0D9488" />
          </View>
          <View>
            <Text style={styles.welcomeText}>Dr(a). {currentUser?.name}</Text>
            <Text style={styles.roleSubtext}>Consultório Psicológico • PsiApp</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Bento Stats */}
        <View style={styles.bentoRow}>
          <View style={[styles.bentoBox, styles.bentoTeal]}>
            <View style={styles.bentoHeaderRow}>
              <Users size={20} color="#0D9488" />
              <Text style={styles.bentoNum}>{db.patients.length}</Text>
            </View>
            <Text style={styles.bentoLabel}>Total de Pacientes</Text>
          </View>
          <View style={[styles.bentoBox, styles.bentoGreen]}>
            <View style={styles.bentoHeaderRow}>
              <Users size={20} color="#0D9488" />
              <Text style={styles.bentoNum}>{activePatients.length}</Text>
            </View>
            <Text style={styles.bentoLabel}>Ativos</Text>
          </View>
          <View style={[styles.bentoBox, styles.bentoOrange]}>
            <View style={styles.bentoHeaderRow}>
              <CalendarIcon size={20} color="#F59E0B" />
              <Text style={styles.bentoNum}>{inactivePatients.length}</Text>
            </View>
            <Text style={styles.bentoLabel}>Inativos</Text>
          </View>
          <View style={[styles.bentoBox, styles.bentoGray]}>
            <View style={styles.bentoHeaderRow}>
              <FileText size={20} color="#94A3B8" />
              <Text style={styles.bentoNum}>{archivedPatients.length}</Text>
            </View>
            <Text style={styles.bentoLabel}>Arquivados</Text>
          </View>
        </View>

        <View style={styles.bentoRow}>
          <View style={[styles.bentoBox, styles.bentoBlue]}>
            <View style={styles.bentoHeaderRow}>
              <FileText size={20} color="#2563EB" />
              <Text style={styles.bentoNum}>{totalRecords}</Text>
            </View>
            <Text style={styles.bentoLabel}>Relatórios Totais</Text>
          </View>
          <View style={[styles.bentoBox, styles.bentoTeal]}>
            <View style={styles.bentoHeaderRow}>
              <FileText size={20} color="#0D9488" />
              <Text style={styles.bentoNum}>{activeRecords}</Text>
            </View>
            <Text style={styles.bentoLabel}>Relatórios Ativos</Text>
          </View>
          <View style={[styles.bentoBox, styles.bentoGray]}>
            <View style={styles.bentoHeaderRow}>
              <FileText size={20} color="#94A3B8" />
              <Text style={styles.bentoNum}>{archivedRecords}</Text>
            </View>
            <Text style={styles.bentoLabel}>Relatórios Arquivados</Text>
          </View>
        </View>

        {/* Ações Rápidas */}
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={openPatients} activeOpacity={0.85}>
            <View style={styles.actionIcon}>
              <Users size={24} color="#0D9488" />
            </View>
            <Text style={styles.actionTitle}>Gerenciar Pacientes</Text>
            <Text style={styles.actionSub}>Cadastrar, editar, ativar/desativar e arquivar</Text>
            <ArrowRight size={16} color="#0D9488" style={styles.actionArrow} />
          </TouchableOpacity>
        </View>

        {/* Pacientes Ativos (resumo) */}
        <Text style={styles.sectionTitle}>Pacientes Ativos</Text>
        {activePatients.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum paciente ativo no momento.</Text>
          </View>
        ) : (
          activePatients.slice(0, 4).map(p => (
            <View key={p.id} style={styles.patientRow}>
              <View style={styles.avatarCircleSmall}>
                <Users size={18} color="#0D9488" />
              </View>
              <View style={styles.patientRowInfo}>
                <Text style={styles.patientRowName}>{p.name}</Text>
                <Text style={styles.patientRowMeta}>{p.email}</Text>
              </View>
              <TouchableOpacity style={styles.statusBadgeActive} activeOpacity={0.8}>
                <Text style={styles.statusText}>Ativo</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        {activePatients.length > 4 && (
          <TouchableOpacity style={styles.viewAll} onPress={openPatients} activeOpacity={0.8}>
            <Text style={styles.viewAllText}>Ver todos os pacientes ({db.patients.length}) →</Text>
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
  container: { flex: 1, backgroundColor: '#F4FBF7' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E6F4ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1EFE2',
  },
  welcomeText: { fontSize: 17, fontWeight: 'bold', color: '#133E2B' },
  roleSubtext: { fontSize: 11, color: '#0D9488', fontWeight: '600' },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 12 },

  scroll: { padding: 16, paddingBottom: 40 },
  bentoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, gap: 10 },
  bentoBox: { flex: 1, borderRadius: 18, padding: 16, justifyContent: 'center' },
  bentoTeal: { backgroundColor: '#E6F4ED', borderWidth: 1, borderColor: '#D1EFE2' },
  bentoGreen: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#BBF7D0' },
  bentoOrange: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D' },
  bentoGray: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  bentoBlue: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' },
  bentoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bentoNum: { fontSize: 24, fontWeight: '800', color: '#133E2B' },
  bentoLabel: { fontSize: 11, color: '#4A6B5D', fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#133E2B', marginVertical: 14, marginLeft: 4 },

  actionsGrid: { gap: 12, marginBottom: 20 },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E6F4ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#133E2B', marginBottom: 2 },
  actionSub: { fontSize: 12, color: '#64748B' },
  actionArrow: { marginLeft: 8 },

  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientRowInfo: { flex: 1, marginHorizontal: 12 },
  patientRowName: { fontSize: 14, fontWeight: 'bold', color: '#133E2B', marginBottom: 2 },
  patientRowMeta: { fontSize: 12, color: '#64748B' },
  statusBadgeActive: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700', color: '#0D9488' },
  viewAll: { marginTop: 8, alignItems: 'center' },
  viewAllText: { fontSize: 13, color: '#0D9488', fontWeight: '600' },

  footer: { marginTop: 20, paddingHorizontal: 16, alignItems: 'center' },
  footerText: { fontSize: 13, fontWeight: '600', color: '#133E2B', marginBottom: 4 },
  footerTextSmall: { fontSize: 11, color: '#94A3B8' },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  emptyText: { color: '#94A3B8', fontSize: 14, fontStyle: 'italic' },
});
