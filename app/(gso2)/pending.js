import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, RefreshControl } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants/theme';
import { format } from 'date-fns';

const fmtDate = d => { try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d || '—'; } };

export default function GSO2Pending() {
  const { profile } = useAuth();
  const [pending,  setPending] = useState([]);
  const [loading,  setLoading] = useState(true);
  const [refresh,  setRefresh] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [remarks,  setRemarks] = useState('');
  const [busy,     setBusy]    = useState(false);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'requests'), where('dept', '==', profile.dept), where('status', '==', 'pending'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setPending(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false); setRefresh(false);
    });
  }, [profile]);

  async function approve(id) {
    setBusy(true);
    await updateDoc(doc(db, 'requests', id), { status: 'approved', approvedBy: profile.uid, approvedByName: profile.name, approvedAt: serverTimestamp() });
    setBusy(false);
  }

  async function reject() {
    setBusy(true);
    await updateDoc(doc(db, 'requests', rejectId), { status: 'rejected', approvedBy: profile.uid, approvedByName: profile.name, remarks, approvedAt: serverTimestamp() });
    setRejectId(null); setRemarks(''); setBusy(false);
  }

  return (
    <ScrollView
      style={s.screen} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} tintColor={COLORS.gold} />}
    >
      <Text style={s.heading}>Pending Requests</Text>
      <Text style={s.sub}>Dept: {profile?.dept} · {pending.length} awaiting approval</Text>

      {loading && <ActivityIndicator color={COLORS.gold} style={{ marginTop: 30 }} />}

      {!loading && pending.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>✓</Text>
          <Text style={s.emptyText}>All clear — no pending requests</Text>
        </View>
      )}

      {pending.map((r) => (
        <View key={r.id} style={s.card}>
          <View style={s.cardTop}>
            <View style={s.nameBadge}>
              <View style={s.avatar}><Text style={s.avatarText}>{r.studentName?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}</Text></View>
              <View>
                <Text style={s.name}>{r.studentName}</Text>
                <Text style={s.svc}>{r.serviceNumber} · {r.rank}</Text>
              </View>
            </View>
          </View>
          <View style={s.infoGrid}>
            {[['Date', fmtDate(r.date)], ['Departure', r.outTime + ' hrs'], ['Return By', r.expectedReturn + ' hrs'], ['Submitted', r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd MMM, HH:mm') : '—']].map(([k,v]) => (
              <View key={k} style={s.infoItem}>
                <Text style={s.infoKey}>{k}</Text>
                <Text style={s.infoVal}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={s.causeBox}>
            <Text style={s.causeLabel}>REASON</Text>
            <Text style={s.causeText}>{r.cause}</Text>
          </View>
          <View style={s.actions}>
            <TouchableOpacity style={s.approveBtn} onPress={() => approve(r.id)} disabled={busy}>
              <Text style={s.approveBtnText}>✓  APPROVE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.rejectBtn} onPress={() => setRejectId(r.id)} disabled={busy}>
              <Text style={s.rejectBtnText}>✕  REJECT</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Reject modal */}
      <Modal visible={!!rejectId} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Reject Request</Text>
            <Text style={s.modalSub}>Optionally add remarks for the student officer.</Text>
            <TextInput
              style={s.textArea} placeholderTextColor={COLORS.text3}
              placeholder="e.g. Insufficient cause provided"
              value={remarks} onChangeText={setRemarks} multiline numberOfLines={3}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnCancel} onPress={() => { setRejectId(null); setRemarks(''); }}>
                <Text style={s.btnCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnConfirmReject} onPress={reject} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnConfirmRejectText}>CONFIRM REJECTION</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:             { flex: 1, backgroundColor: COLORS.bg },
  content:            { padding: 16, paddingBottom: 40 },
  heading:            { color: COLORS.gold, fontSize: 20, fontWeight: '800', marginBottom: 2 },
  sub:                { color: COLORS.text2, fontSize: 12, marginBottom: 20 },
  empty:              { alignItems: 'center', marginTop: 60 },
  emptyIcon:          { fontSize: 40, color: COLORS.green, marginBottom: 10 },
  emptyText:          { color: COLORS.text2, fontSize: 14 },
  card:               { backgroundColor: COLORS.bg2, borderRadius: 12, borderWidth: 1, borderColor: COLORS.amberBg, padding: 16, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: COLORS.amber },
  cardTop:            { marginBottom: 12 },
  nameBadge:          { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:             { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.goldDim, alignItems: 'center', justifyContent: 'center' },
  avatarText:         { color: '#000', fontWeight: '800', fontSize: 14 },
  name:               { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  svc:                { color: COLORS.text2, fontSize: 11, marginTop: 2 },
  infoGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  infoItem:           { width: '48%', backgroundColor: COLORS.bg3, borderRadius: 6, padding: 8 },
  infoKey:            { color: COLORS.text3, fontSize: 10, marginBottom: 2, letterSpacing: 0.5 },
  infoVal:            { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  causeBox:           { backgroundColor: COLORS.bg3, borderRadius: 8, padding: 12, marginBottom: 12 },
  causeLabel:         { color: COLORS.text3, fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  causeText:          { color: COLORS.text, fontSize: 13, lineHeight: 18 },
  actions:            { flexDirection: 'row', gap: 10 },
  approveBtn:         { flex: 1, backgroundColor: COLORS.greenBg, borderWidth: 1, borderColor: COLORS.green, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  approveBtnText:     { color: COLORS.green, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  rejectBtn:          { flex: 1, backgroundColor: COLORS.redBg, borderWidth: 1, borderColor: COLORS.red, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  rejectBtnText:      { color: COLORS.red, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modal:              { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle:         { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  modalSub:           { color: COLORS.text2, fontSize: 12, marginBottom: 14 },
  textArea:           { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, color: COLORS.text, padding: 12, fontSize: 13, marginBottom: 16, minHeight: 70, textAlignVertical: 'top' },
  modalBtns:          { flexDirection: 'row', gap: 10 },
  btnCancel:          { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, alignItems: 'center' },
  btnCancelText:      { color: COLORS.text2, fontWeight: '700', fontSize: 12 },
  btnConfirmReject:   { flex: 1, backgroundColor: COLORS.red, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnConfirmRejectText:{ color: '#fff', fontWeight: '800', fontSize: 12 },
});
