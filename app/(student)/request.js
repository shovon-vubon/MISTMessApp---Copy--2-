import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants/theme';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function StudentRequest() {
  const { profile } = useAuth();
  const router = useRouter();
  const [date, setDate]           = useState(todayStr());
  const [outTime, setOutTime]     = useState('');
  const [returnTime, setReturn]   = useState('');
  const [cause, setCause]         = useState('');
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');
  const [showConfirm, setConfirm] = useState(false);
  const [success, setSuccess]     = useState(false);

  useFocusEffect(useCallback(() => {
    setDate(todayStr());
    setOutTime('');
    setReturn('');
    setCause('');
    setError('');
    setSuccess(false);
    setBusy(false);
    setConfirm(false);
  }, []));

  const isCurfew = () => {
    if (!returnTime) return false;
    const [h, m] = returnTime.split(':').map(Number);
    return h > 22 || (h === 22 && m > 0);
  };

  function openConfirm() {
    if (!date || !outTime || !returnTime || !cause.trim()) {
      setError('All fields are required.'); return;
    }
    setError(''); setConfirm(true);
  }

  async function doSubmit() {
    setBusy(true); setConfirm(false);
    try {
      // Notify GSO-2 by looking up their fcmToken
      const gso2Query = query(collection(db, 'users'), where('role', '==', 'gso2'), where('dept', '==', profile.dept));
      const gso2Snap  = await getDocs(gso2Query);
      const gso2Tokens = gso2Snap.docs.map(d => d.data().fcmToken).filter(Boolean);

      await addDoc(collection(db, 'requests'), {
        studentId:      profile.uid,
        studentName:    profile.name,
        serviceNumber:  profile.serviceNumber,
        rank:           profile.rank,
        dept:           profile.dept,
        date,
        outTime,
        expectedReturn: returnTime,
        actualReturn:   null,
        cause:          cause.trim(),
        status:         'pending',
        approvedBy:     null,
        approvedByName: null,
        remarks:        null,
        arrivalSent:    false,
        arrivalTime:    null,
        notifyTokens:   gso2Tokens,
        createdAt:      serverTimestamp(),
      });

      // Firestore trigger (Cloud Function) will send push to GSO-2
      setSuccess(true);
      setTimeout(() => router.replace('/(student)/history'), 1500);
    } catch (e) {
      setError('Failed to submit. Please try again.');
    }
    setBusy(false);
  }

  if (success) {
    return (
      <View style={s.center}>
        <Text style={s.successIcon}>✓</Text>
        <Text style={s.successText}>Request submitted!</Text>
        <Text style={s.successSub}>Your GSO-2 has been notified.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.cardTitle}>⊕ New Out-of-Mess Request</Text>
          <Text style={s.cardSub}>Returns after 2200 hrs require GSO-2 approval.</Text>

          <Text style={s.label}>Date *</Text>
          <TextInput style={s.input} placeholderTextColor={COLORS.text3} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />

          <Text style={s.label}>Departure Time (HH:MM) *</Text>
          <TextInput style={s.input} placeholderTextColor={COLORS.text3} placeholder="e.g. 20:00" value={outTime} onChangeText={setOutTime} />

          <Text style={s.label}>Expected Return Time (HH:MM) *</Text>
          <TextInput style={s.input} placeholderTextColor={COLORS.text3} placeholder="e.g. 23:00" value={returnTime} onChangeText={setReturn} />
          {isCurfew() && (
            <View style={s.warnBox}>
              <Text style={s.warnText}>⚠ Return after 2200 hrs — GSO-2 approval required.</Text>
            </View>
          )}

          <Text style={s.label}>Reason / Cause *</Text>
          <TextInput
            style={[s.input, s.textarea]} placeholderTextColor={COLORS.text3}
            placeholder="State clearly: medical, family emergency, official duty, personal…"
            value={cause} onChangeText={setCause} multiline numberOfLines={4}
          />

          {!!error && <Text style={s.error}>{error}</Text>}

          <View style={s.btnRow}>
            <TouchableOpacity style={s.btnGold} onPress={openConfirm} disabled={busy}>
              <Text style={s.btnGoldText}>REVIEW & SUBMIT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnGhost} onPress={() => router.back()}>
              <Text style={s.btnGhostText}>CANCEL</Text>
            </TouchableOpacity>
          </View>

          <View style={s.infoBox}>
            <Text style={s.infoText}>
              Your GSO-2 for <Text style={{ color: COLORS.gold }}>{profile?.dept}</Text> will receive an instant notification upon submission.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Modal */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Confirm Request</Text>
            <Text style={s.modalSub}>Review before submitting. GSO-2 will be notified immediately.</Text>
            <View style={s.confirmRows}>
              {[['Officer', `${profile?.name} (${profile?.serviceNumber})`], ['Department', profile?.dept], ['Date', date], ['Departure', outTime + ' hrs'], ['Return by', returnTime + ' hrs'], ['Reason', cause]].map(([k, v]) => (
                <View key={k} style={s.confirmRow}>
                  <Text style={s.confirmKey}>{k}</Text>
                  <Text style={s.confirmVal}>{v}</Text>
                </View>
              ))}
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnGhost2} onPress={() => setConfirm(false)}>
                <Text style={s.btnGhostText}>GO BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnGold2} onPress={doSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#000" /> : <Text style={s.btnGoldText}>CONFIRM & SUBMIT</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: COLORS.bg },
  content:     { padding: 16, paddingBottom: 40 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  successIcon: { fontSize: 48, color: COLORS.green, marginBottom: 12 },
  successText: { color: COLORS.green, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  successSub:  { color: COLORS.text2, fontSize: 13 },
  card:        { backgroundColor: COLORS.bg2, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 20 },
  cardTitle:   { color: COLORS.gold, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardSub:     { color: COLORS.text3, fontSize: 12, marginBottom: 18 },
  label:       { color: COLORS.text2, fontSize: 12, marginBottom: 6 },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, color: COLORS.text, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginBottom: 12 },
  textarea:    { height: 90, textAlignVertical: 'top' },
  warnBox:     { backgroundColor: COLORS.amberBg, borderRadius: 6, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: COLORS.amber },
  warnText:    { color: COLORS.amber, fontSize: 12 },
  error:       { color: COLORS.red, fontSize: 12, marginBottom: 10 },
  btnRow:      { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnGold:     { flex: 1, backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  btnGoldText: { color: '#000', fontWeight: '800', fontSize: 12 },
  btnGhost:    { paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, alignItems: 'center' },
  btnGhostText:{ color: COLORS.text2, fontWeight: '700', fontSize: 12 },
  infoBox:     { marginTop: 16, backgroundColor: COLORS.bg3, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  infoText:    { color: COLORS.text3, fontSize: 11, lineHeight: 17 },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modal:       { backgroundColor: COLORS.bg2, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 24 },
  modalTitle:  { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  modalSub:    { color: COLORS.text2, fontSize: 12, marginBottom: 16 },
  confirmRows: { gap: 8, marginBottom: 20 },
  confirmRow:  { flexDirection: 'row', gap: 12 },
  confirmKey:  { color: COLORS.text2, fontSize: 12, fontWeight: '600', width: 90 },
  confirmVal:  { color: COLORS.text, fontSize: 12, flex: 1 },
  modalBtns:   { flexDirection: 'row', gap: 10 },
  btnGhost2:   { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, alignItems: 'center' },
  btnGold2:    { flex: 1, backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
});
