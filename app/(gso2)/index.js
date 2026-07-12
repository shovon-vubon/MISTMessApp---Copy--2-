import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../src/context/AuthContext';
import { notify } from '../../src/utils/notify';
import StatusBadge from '../../src/components/StatusBadge';
import MetricCard from '../../src/components/MetricCard';
import { COLORS } from '../../src/constants/theme';
import { format } from 'date-fns';

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate  = d => { try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d || '—'; } };


export default function GSO2Dashboard() {
  const { profile } = useAuth();
  const [all,      setAll]     = useState([]);
  const [pending,  setPending] = useState([]);
  const [arrivals, setArrivals]= useState([]);
  const [loading,  setLoading] = useState(true);
  const [refresh,  setRefresh] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectId,    setRejectId]    = useState(null);
  const [remarks,     setRemarks]     = useState('');
  const [busy,        setBusy]        = useState(false);

  const reqsInitial     = useRef(true);
  const arrivalsInitial = useRef(true);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'requests'), where('dept', '==', profile.dept), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      if (!reqsInitial.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const d = change.doc.data();
            notify('New Out-Pass Request', `${d.studentName} (${d.serviceNumber || d.dept}) submitted a request.`);
          }
        });
      }
      reqsInitial.current = false;
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAll(docs);
      setPending(docs.filter(r => r.status === 'pending'));
      setLoading(false); setRefresh(false);
    }, (err) => {
      console.warn('Firestore error:', err.message);
      setLoading(false); setRefresh(false);
    });
    return unsub;
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'notifications'), where('toDept', '==', profile.dept), where('type', '==', 'arrival'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      if (!arrivalsInitial.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const d = change.doc.data();
            notify('Student Returned', `${d.fromName} returned to mess at ${d.arrivalTime} hrs.`);
          }
        });
      }
      arrivalsInitial.current = false;
      setArrivals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn('Firestore error:', err.message);
    });
  }, [profile]);

  async function doApprove(id) {
    setBusy(true);
    try {
      await apiPost(`/api/requests/${id}/approve`);
    } catch (e) {
      notify('Approve failed', e.message);
    }
    setBusy(false);
  }

  async function doReject() {
    setBusy(true);
    try {
      await apiPost(`/api/requests/${rejectId}/reject`, { remarks });
    } catch (e) {
      notify('Reject failed', e.message);
    }
    setRejectModal(false); setRemarks(''); setRejectId(null);
    setBusy(false);
  }

  const todayReqs = all.filter(r => r.date === todayStr());
  const unreadArrivals = arrivals.filter(a => !a.read && a.date === todayStr());

  return (
    <ScrollView
      style={s.screen} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} tintColor={COLORS.gold} />}
    >
      {/* Header */}
      <Text style={s.heading}>GSO-2 Dashboard</Text>
      <Text style={s.sub}>{profile?.name} · Dept: {profile?.dept}</Text>

      {/* New arrival notifications */}
      {unreadArrivals.length > 0 && (
        <View style={s.arrivalBanner}>
          <Text style={s.bannerIcon}>🏠</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>{unreadArrivals.length} student(s) returned</Text>
            {unreadArrivals.slice(0, 3).map(a => (
              <Text key={a.id} style={s.bannerItem}>• {a.fromName} at {a.arrivalTime} hrs</Text>
            ))}
          </View>
        </View>
      )}
      {unreadArrivals.length === 0 && (
        <Text style={s.empty}>No students returned today upto now </Text>
      )}

      {/* Pending banner */}
      {pending.length > 0 && (
        <View style={s.pendingBanner}>
          <View style={s.notifDot} />
          <Text style={s.bannerText}>{pending.length} pending request(s) awaiting your approval</Text>
        </View>
      )}

      {/* Metrics */}
      <View style={s.metrics}>
        <MetricCard value={pending.length}                              label="Pending"  color={COLORS.amber} />
        <MetricCard value={todayReqs.length}                            label="Today"    color={COLORS.blue}  />
        <MetricCard value={all.length}                                  label="Total"    color={COLORS.text}  />
        <MetricCard value={all.filter(r=>r.status==='approved').length} label="Approved" color={COLORS.green} />
      </View>

      {/* Pending Approvals inline */}
      {pending.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>⧖ Pending Approvals ({pending.length})</Text>
          {loading && <ActivityIndicator color={COLORS.gold} />}
          {pending.map(r => (
            <View key={r.id} style={s.pendingCard}>
              <View style={s.pendingHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.pendingName}>{r.studentName}</Text>
                  <Text style={s.pendingMeta}>{r.serviceNumber} · {fmtDate(r.date)} · Out: {r.outTime} · Return: {r.expectedReturn}</Text>
                  <Text style={s.pendingCause}>{r.cause}</Text>
                </View>
              </View>
              <View style={s.pendingActions}>
                <TouchableOpacity style={s.approveBtn} onPress={() => doApprove(r.id)} disabled={busy}>
                  <Text style={s.approveBtnText}>✓ APPROVE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rejectBtn} onPress={() => { setRejectId(r.id); setRejectModal(true); }}>
                  <Text style={s.rejectBtnText}>✕ REJECT</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Today's Events */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Today's Events — {todayStr()}</Text>
        {todayReqs.length === 0
          ? <Text style={s.empty}>No events today</Text>
          : todayReqs.map(r => (
            <View key={r.id} style={s.todayRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.todayName}>{r.studentName}</Text>
                <Text style={s.todayMeta}>Out: {r.outTime} · Return by: {r.expectedReturn}</Text>
              </View>
              <StatusBadge status={r.status} />
            </View>
          ))
        }
      </View>
    </ScrollView>
  );
}

// Reject modal
function RejectModal({ visible, onClose, onConfirm, remarks, setRemarks, busy }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.modal}>
          <Text style={s.modalTitle}>Reject Request</Text>
          <Text style={s.modalSub}>Optionally add remarks for the student.</Text>
          <TextInput
            style={s.remarksInput} placeholderTextColor={COLORS.text3}
            placeholder="e.g. Insufficient cause" value={remarks} onChangeText={setRemarks}
            multiline numberOfLines={3}
          />
          <View style={s.modalBtns}>
            <TouchableOpacity style={s.modalCancel} onPress={onClose}><Text style={s.modalCancelText}>CANCEL</Text></TouchableOpacity>
            <TouchableOpacity style={s.modalConfirm} onPress={onConfirm} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.modalConfirmText}>CONFIRM REJECT</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: COLORS.bg },
  content:         { padding: 16, paddingBottom: 40 },
  heading:         { color: COLORS.gold, fontSize: 20, fontWeight: '800', marginBottom: 2 },
  sub:             { color: COLORS.text2, fontSize: 12, marginBottom: 16 },
  arrivalBanner:   { backgroundColor: COLORS.greenBg, borderWidth: 1, borderColor: COLORS.green, borderRadius: 10, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  bannerIcon:      { fontSize: 22 },
  bannerTitle:     { color: COLORS.green, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  bannerItem:      { color: COLORS.green, fontSize: 12 },
  pendingBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.amberBg, borderWidth: 1, borderColor: COLORS.amber, borderRadius: 8, padding: 12, marginBottom: 14 },
  notifDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.amber },
  bannerText:      { color: COLORS.amber, fontSize: 13, fontWeight: '600' },
  metrics:         { flexDirection: 'row', gap: 8, marginBottom: 14 },
  navRow:          { flexDirection: 'row', gap: 8, marginBottom: 14 },
  navBtn:          { flex: 1, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  navBtnText:      { color: COLORS.text2, fontSize: 11, fontWeight: '600' },
  card:            { backgroundColor: COLORS.bg2, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14 },
  cardTitle:       { color: COLORS.gold, fontSize: 13, fontWeight: '700', marginBottom: 12, letterSpacing: 0.3 },
  pendingCard:     { borderWidth: 1, borderColor: COLORS.amberBg, backgroundColor: 'rgba(210,153,34,0.04)', borderRadius: 8, padding: 12, marginBottom: 10 },
  pendingHeader:   { flexDirection: 'row', marginBottom: 10 },
  pendingName:     { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  pendingMeta:     { color: COLORS.text2, fontSize: 11, marginTop: 2 },
  pendingCause:    { color: COLORS.text3, fontSize: 12, marginTop: 4 },
  pendingActions:  { flexDirection: 'row', gap: 8 },
  approveBtn:      { flex: 1, backgroundColor: COLORS.greenBg, borderWidth: 1, borderColor: COLORS.green, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  approveBtnText:  { color: COLORS.green, fontWeight: '700', fontSize: 11 },
  rejectBtn:       { flex: 1, backgroundColor: COLORS.redBg, borderWidth: 1, borderColor: COLORS.red, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  rejectBtnText:   { color: COLORS.red, fontWeight: '700', fontSize: 11 },
  todayRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  todayName:       { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  todayMeta:       { color: COLORS.text3, fontSize: 11, marginTop: 2 },
  empty:           { color: COLORS.text3, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modal:           { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle:      { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  modalSub:        { color: COLORS.text2, fontSize: 12, marginBottom: 14 },
  remarksInput:    { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, color: COLORS.text, padding: 12, fontSize: 13, marginBottom: 16, height: 80, textAlignVertical: 'top' },
  modalBtns:       { flexDirection: 'row', gap: 10 },
  modalCancel:     { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { color: COLORS.text2, fontWeight: '700', fontSize: 12 },
  modalConfirm:    { flex: 1, backgroundColor: COLORS.red, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalConfirmText:{ color: '#fff', fontWeight: '800', fontSize: 12 },
});
