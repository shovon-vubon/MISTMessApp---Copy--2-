import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../src/context/AuthContext';
import { notify } from '../../src/utils/notify';
import StatusBadge from '../../src/components/StatusBadge';
import MetricCard from '../../src/components/MetricCard';
import { COLORS } from '../../src/constants/theme';
import { format } from 'date-fns';

// ── helpers (defined before component so no naming conflicts) ────────────────
function dotColor(status) {
  if (status === 'approved') return COLORS.green;
  if (status === 'pending')  return COLORS.amber;
  return COLORS.red;
}
function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(d) {
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d || '—'; }
}
// ────────────────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { profile } = useAuth();
  const router   = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);
  const initialLoad = useRef(true);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'requests'),
      where('studentId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    return onSnapshot(q, (snap) => {
      if (!initialLoad.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'modified') {
            const d = change.doc.data();
            if (d.status === 'approved') {
              notify('Request Approved', 'Your out-pass request has been approved!');
            } else if (d.status === 'rejected') {
              notify('Request Rejected', d.remarks ? `Rejected: ${d.remarks}` : 'Your out-pass request was rejected.');
            }
          }
        });
      }
      initialLoad.current = false;
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setRefresh(false);
    }, (err) => {
      console.warn('Firestore error:', err.message);
      setLoading(false);
      setRefresh(false);
    });
  }, [profile]);

  if (!profile) return null;

  const totalPending  = requests.filter(r => r.status === 'pending').length;
  const totalApproved = requests.filter(r => r.status === 'approved').length;
  const totalToday    = requests.filter(r => r.date === todayStr()).length;

  const pendingArrival = requests.find(
    r => r.status === 'approved' && !r.arrivalSent && r.date <= todayStr()
  );

  const last = requests[0];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} tintColor={COLORS.gold} />
      }
    >
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(profile.name)}</Text>
          </View>
          <View style={styles.goldRing} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileSvc}>{profile.serviceNumber}</Text>
          <View style={styles.profileTags}>
            <View style={styles.tag}><Text style={styles.tagText}>{profile.dept}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{profile.rank}</Text></View>
            {profile.batch
              ? <View style={styles.tag}><Text style={styles.tagText}>Batch {profile.batch}</Text></View>
              : null}
          </View>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          {profile.phone ? <Text style={styles.profileEmail}>{profile.phone}</Text> : null}
        </View>
      </View>

      {/* Arrival Banner */}
      {pendingArrival && (
        <TouchableOpacity
          style={styles.arrivalBanner}
          onPress={() => router.push('/(student)/arrival?reqId=' + pendingArrival.id)}
        >
          <Text style={styles.arrivalIcon}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.arrivalTitle}>You have a pending arrival</Text>
            <Text style={styles.arrivalSub}>Tap to notify GSO-2 you have returned to mess</Text>
          </View>
          <Text style={styles.arrivalArrow}>{'→'}</Text>
        </TouchableOpacity>
      )}

      {/* Metrics */}
      <View style={styles.metrics}>
        <MetricCard value={requests.length} label="Total"    color={COLORS.text}  />
        <MetricCard value={totalPending}    label="Pending"  color={COLORS.amber} />
        <MetricCard value={totalApproved}   label="Approved" color={COLORS.green} />
        <MetricCard value={totalToday}      label="Today"    color={COLORS.blue}  />
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnGold} onPress={() => router.push('/(student)/request')}>
          <Text style={styles.btnGoldText}>+ NEW REQUEST</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={() => router.push('/(student)/history')}>
          <Text style={styles.btnGhostText}>VIEW HISTORY</Text>
        </TouchableOpacity>
      </View>

      {/* Last Request */}
      {last && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{'⊙'} Last Request</Text>
          <Text style={styles.cardDate}>{fmtDate(last.date)}</Text>
          <StatusBadge status={last.status} />
          <Text style={styles.cardCause}>{last.cause}</Text>
          <Text style={styles.cardMeta}>Departure: {last.outTime} {'·'} Return by: {last.expectedReturn}</Text>
          {last.remarks ? <Text style={styles.cardRemarks}>Remarks: {last.remarks}</Text> : null}
        </View>
      )}

      {/* Recent Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        {loading && <ActivityIndicator color={COLORS.gold} style={{ marginTop: 12 }} />}
        {!loading && requests.length === 0 && (
          <Text style={styles.empty}>No requests yet. Tap "New Request" to get started.</Text>
        )}
        {requests.slice(0, 6).map((r, i) => {
          const isLast = i === Math.min(requests.length, 6) - 1;
          return (
            <View
              key={r.id}
              style={[styles.tlItem, isLast && { borderLeftColor: 'transparent' }]}
            >
              <View style={[styles.tlDot, { backgroundColor: dotColor(r.status) }]} />
              <View style={styles.tlBody}>
                <View style={styles.tlRow}>
                  <Text style={styles.tlDate}>{fmtDate(r.date)}</Text>
                  <StatusBadge status={r.status} />
                </View>
                <Text style={styles.tlMeta}>Out: {r.outTime} {'·'} Return by: {r.expectedReturn}</Text>
                <Text style={styles.tlCause} numberOfLines={2}>{r.cause}</Text>
              </View>
            </View>
          );
        })}
        {requests.length > 6 && (
          <TouchableOpacity onPress={() => router.push('/(student)/history')} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View All Requests {'→'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: COLORS.bg },
  content:       { padding: 16, paddingBottom: 40 },
  profileCard:   { backgroundColor: COLORS.bg2, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 14, borderTopWidth: 3, borderTopColor: COLORS.gold },
  avatarWrap:    { position: 'relative', width: 66, height: 66 },
  avatar:        { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.goldDim, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 3, left: 3 },
  avatarText:    { color: '#000', fontSize: 20, fontWeight: '800' },
  goldRing:      { position: 'absolute', top: 0, left: 0, width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: COLORS.gold },
  profileInfo:   { flex: 1 },
  profileName:   { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  profileSvc:    { color: COLORS.gold, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  profileTags:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tag:           { backgroundColor: COLORS.bg3, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  tagText:       { color: COLORS.text2, fontSize: 11, fontWeight: '600' },
  profileEmail:  { color: COLORS.text3, fontSize: 11 },
  arrivalBanner: { backgroundColor: COLORS.amberBg, borderWidth: 1, borderColor: COLORS.amber, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  arrivalIcon:   { fontSize: 22 },
  arrivalTitle:  { color: COLORS.amber, fontWeight: '700', fontSize: 13 },
  arrivalSub:    { color: COLORS.text2, fontSize: 11, marginTop: 2 },
  arrivalArrow:  { color: COLORS.amber, fontSize: 18, fontWeight: '700' },
  metrics:       { flexDirection: 'row', gap: 8, marginBottom: 14 },
  actions:       { flexDirection: 'row', gap: 10, marginBottom: 14 },
  btnGold:       { flex: 1, backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnGoldText:   { color: '#000', fontWeight: '800', fontSize: 12, letterSpacing: 0.8 },
  btnGhost:      { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnGhostText:  { color: COLORS.text2, fontWeight: '700', fontSize: 12, letterSpacing: 0.8 },
  card:          { backgroundColor: COLORS.bg2, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14 },
  cardTitle:     { color: COLORS.gold, fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 },
  cardDate:      { color: COLORS.text2, fontSize: 12, marginBottom: 6 },
  cardCause:     { color: COLORS.text3, fontSize: 12, marginTop: 6 },
  cardMeta:      { color: COLORS.text3, fontSize: 11, marginTop: 4 },
  cardRemarks:   { color: COLORS.amber, fontSize: 11, marginTop: 4 },
  empty:         { color: COLORS.text3, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  tlItem:        { flexDirection: 'row', paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: COLORS.border, marginBottom: 14, paddingBottom: 6 },
  tlDot:         { width: 10, height: 10, borderRadius: 5, position: 'absolute', left: -6, top: 4 },
  tlBody:        { flex: 1, paddingLeft: 10 },
  tlRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  tlDate:        { color: COLORS.text2, fontSize: 12, fontWeight: '600' },
  tlMeta:        { color: COLORS.text3, fontSize: 11, marginBottom: 2 },
  tlCause:       { color: COLORS.text, fontSize: 12 },
  viewAllBtn:    { marginTop: 10, alignItems: 'center' },
  viewAllText:   { color: COLORS.gold, fontSize: 13, fontWeight: '600' },
});
