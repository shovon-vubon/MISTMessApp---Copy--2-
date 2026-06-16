import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, serverTimestamp, query, collection, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants/theme';
import { format } from 'date-fns';

export default function StudentArrival() {
  const { reqId }   = useLocalSearchParams();
  const { profile } = useAuth();
  const router      = useRouter();
  const [request, setRequest] = useState(null);
  const [loading,  setLoading] = useState(true);
  const [sending,  setSending] = useState(false);
  const [done,     setDone]    = useState(false);
  const [error,    setError]   = useState('');

  useEffect(() => {
    if (!reqId) return;
    getDoc(doc(db, 'requests', reqId)).then((snap) => {
      if (snap.exists()) setRequest({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [reqId]);

  async function sendArrival() {
    setSending(true);
    try {
      const now     = new Date();
      const timeStr = format(now, 'HH:mm');

      await updateDoc(doc(db, 'requests', reqId), {
        arrivalSent: true,
        arrivalTime: timeStr,
        actualReturn: timeStr,
        arrivalSentAt: serverTimestamp(),
      });

      // Look up GSO-2 for this dept
      const gso2Snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'gso2'), where('dept', '==', profile.dept)));

      // Create notification record (Cloud Function will push to FCM)
      await addDoc(collection(db, 'notifications'), {
        type:        'arrival',
        fromUid:     profile.uid,
        fromName:    profile.name,
        serviceNumber: profile.serviceNumber,
        dept:        profile.dept,
        reqId,
        arrivalTime: timeStr,
        message:     `${profile.name} (${profile.serviceNumber}) has returned to mess at ${timeStr} hrs.`,
        toRole:      'gso2',
        toDept:      profile.dept,
        read:        false,
        createdAt:   serverTimestamp(),
      });

      setDone(true);
    } catch (e) {
      setError('Failed to send arrival. Please try again.');
    }
    setSending(false);
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.gold} size="large" /></View>;

  if (!request) return (
    <View style={s.center}>
      <Text style={s.errorText}>Request not found.</Text>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  if (done) return (
    <View style={s.center}>
      <Text style={s.doneIcon}>✓</Text>
      <Text style={s.doneTitle}>Arrival Sent!</Text>
      <Text style={s.doneSub}>Your GSO-2 for {profile?.dept} has been notified of your return.</Text>
      <TouchableOpacity style={s.btnGold} onPress={() => router.replace('/(student)/')}>
        <Text style={s.btnGoldText}>BACK TO DASHBOARD</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.card}>
        <Text style={s.cardTitle}>Return to Mess — Notify GSO-2</Text>
        <Text style={s.cardSub}>Tap the button below to notify your GSO-2 that you have returned safely.</Text>

        {/* Request summary */}
        <View style={s.reqSummary}>
          <Text style={s.summaryTitle}>Approved Request Details</Text>
          {[['Date', request.date], ['Departure', request.outTime + ' hrs'], ['Return By', request.expectedReturn + ' hrs'], ['Reason', request.cause]].map(([k, v]) => (
            <View key={k} style={s.summaryRow}>
              <Text style={s.summaryKey}>{k}</Text>
              <Text style={s.summaryVal}>{v}</Text>
            </View>
          ))}
        </View>

        {!!error && <Text style={s.error}>{error}</Text>}

        <TouchableOpacity style={s.arrivalBtn} onPress={sendArrival} disabled={sending}>
          {sending ? <ActivityIndicator color="#000" /> : (
            <>
              <Text style={s.arrivalBtnIcon}>🏠</Text>
              <Text style={s.arrivalBtnText}>I HAVE RETURNED TO MESS</Text>
              <Text style={s.arrivalBtnSub}>Notifies GSO-2 with current time</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelBtnText}>Cancel — Not yet returned</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: COLORS.bg },
  content:        { padding: 16, paddingBottom: 40 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, padding: 24 },
  doneIcon:       { fontSize: 60, color: COLORS.green, marginBottom: 16 },
  doneTitle:      { color: COLORS.green, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  doneSub:        { color: COLORS.text2, fontSize: 13, textAlign: 'center', marginBottom: 24 },
  errorText:      { color: COLORS.red, fontSize: 14, marginBottom: 16 },
  backBtn:        { padding: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8 },
  backBtnText:    { color: COLORS.text2, fontSize: 13 },
  card:           { backgroundColor: COLORS.bg2, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 20 },
  cardTitle:      { color: COLORS.gold, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  cardSub:        { color: COLORS.text2, fontSize: 12, marginBottom: 20, lineHeight: 18 },
  reqSummary:     { backgroundColor: COLORS.bg3, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  summaryTitle:   { color: COLORS.text, fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 },
  summaryRow:     { flexDirection: 'row', marginBottom: 6 },
  summaryKey:     { color: COLORS.text2, fontSize: 12, width: 90 },
  summaryVal:     { color: COLORS.text, fontSize: 12, flex: 1 },
  error:          { color: COLORS.red, fontSize: 12, marginBottom: 12, textAlign: 'center' },
  arrivalBtn:     { backgroundColor: COLORS.green, borderRadius: 12, paddingVertical: 20, alignItems: 'center', marginBottom: 12 },
  arrivalBtnIcon: { fontSize: 32, marginBottom: 6 },
  arrivalBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  arrivalBtnSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
  cancelBtn:      { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText:  { color: COLORS.text3, fontSize: 13 },
  btnGold:        { backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', marginTop: 8 },
  btnGoldText:    { color: '#000', fontWeight: '800', fontSize: 13 },
});
