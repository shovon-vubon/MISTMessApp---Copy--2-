import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants/theme';
import { format } from 'date-fns';

const todayStr = () => new Date().toISOString().slice(0, 10);
const nowHHMM  = () => format(new Date(), 'HH:mm');

function isOverdue(req) {
  if (req.status !== 'approved' || req.actualReturn || req.arrivalSent) return false;
  if (req.date < todayStr()) return true;
  if (req.date === todayStr() && req.expectedReturn < nowHHMM()) return true;
  return false;
}

function minutesOverdue(req) {
  const [rh, rm] = req.expectedReturn.split(':').map(Number);
  const now = new Date();
  const diff = (now.getHours() * 60 + now.getMinutes()) - (rh * 60 + rm);
  return req.date < todayStr() ? 999 : Math.max(0, diff);
}

export default function GSO2Overdue() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'requests'), where('dept', '==', profile.dept), where('status', '==', 'approved'), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(isOverdue);
      setRequests(docs);
      setLoading(false); setRefresh(false);
    });
  }, [profile]);

  return (
    <ScrollView
      style={s.screen} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} tintColor={COLORS.gold} />}
    >
      <Text style={s.heading}>Overdue Alerts</Text>
      <Text style={s.sub}>Dept: {profile?.dept} · {requests.length} officers overdue</Text>

      {loading && <ActivityIndicator color={COLORS.gold} style={{ marginTop: 30 }} />}

      {!loading && requests.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>✓</Text>
          <Text style={s.emptyText}>No overdue returns</Text>
        </View>
      )}

      {requests.map((r) => {
        const mins = minutesOverdue(r);
        const urgency = mins > 60 ? 'high' : mins > 30 ? 'med' : 'low';
        const urgencyColor = urgency === 'high' ? COLORS.red : urgency === 'med' ? COLORS.amber : COLORS.blue;
        return (
          <View key={r.id} style={[s.card, { borderLeftColor: urgencyColor }]}>
            <View style={s.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{r.studentName}</Text>
                <Text style={s.svc}>{r.serviceNumber} · {r.rank}</Text>
              </View>
              <View style={[s.urgencyBadge, { backgroundColor: urgencyColor + '22', borderColor: urgencyColor }]}>
                <Text style={[s.urgencyText, { color: urgencyColor }]}>
                  {mins >= 999 ? 'PREV DAY' : `${mins}m LATE`}
                </Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Date: </Text><Text style={s.infoVal}>{r.date}</Text>
              <Text style={[s.infoLabel, { marginLeft: 16 }]}>Return by: </Text><Text style={[s.infoVal, { color: urgencyColor }]}>{r.expectedReturn}</Text>
            </View>
            <Text style={s.cause} numberOfLines={1}>{r.cause}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: COLORS.bg },
  content:      { padding: 16, paddingBottom: 40 },
  heading:      { color: COLORS.gold, fontSize: 20, fontWeight: '800', marginBottom: 2 },
  sub:          { color: COLORS.text2, fontSize: 12, marginBottom: 16 },
  empty:        { alignItems: 'center', marginTop: 60 },
  emptyIcon:    { fontSize: 40, color: COLORS.green, marginBottom: 10 },
  emptyText:    { color: COLORS.text2, fontSize: 14 },
  card:         { backgroundColor: COLORS.bg2, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 4, padding: 14, marginBottom: 12 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  name:         { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  svc:          { color: COLORS.text2, fontSize: 11, marginTop: 2 },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  urgencyText:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoLabel:    { color: COLORS.text3, fontSize: 11 },
  infoVal:      { color: COLORS.text, fontSize: 11, fontWeight: '600' },
  cause:        { color: COLORS.text3, fontSize: 12 },
});
