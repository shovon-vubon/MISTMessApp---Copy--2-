import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput,
} from 'react-native';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useAuth } from '../../src/context/AuthContext';
import MetricCard from '../../src/components/MetricCard';
import StatusBadge from '../../src/components/StatusBadge';
import { COLORS } from '../../src/constants/theme';
import { DEPARTMENTS } from '../../src/constants/config';
import { format } from 'date-fns';

const fmtDate = d => { try { return format(new Date(d), 'dd MMM yyyy, HH:mm'); } catch { return d || '—'; } };

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [users,         setUsers]         = useState([]);
  const [refresh,       setRefresh]       = useState(false);

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false); setRefresh(false);
    }, (err) => {
      console.warn('Firestore error:', err.message);
      setLoading(false); setRefresh(false);
    });
    const unsub2 = onSnapshot(query(collection(db, 'requests'), orderBy('createdAt', 'desc')), (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn('Firestore error:', err.message);
    });
    const unsub3 = onSnapshot(query(collection(db, 'passwordResetRequests'), orderBy('createdAt', 'desc')), (snap) => {
      setPwdResets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn('Firestore error:', err.message);
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

    const dept=profile.dept;
    const students   = users.filter(u => u.role === 'student' && u.dept === dept);
  
  return (
    <ScrollView
      style={s.screen} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} tintColor={COLORS.gold} />}
    >
        <View>
          <Text style={s.sectionTitle}>All Students ({students.length})</Text>
          {students.map(u => (
            <View key={u.id} style={s.userCard}>
              <View style={s.userInfo}>
                <Text style={s.userName}>{u.name}</Text>
                <Text style={s.userMeta}>{u.serviceNumber} · {u.dept}</Text>
                <Text style={s.userEmail}>{u.email}</Text>
              </View>
              <View style={[s.regStatusBadge, { backgroundColor: u.regStatus === 'approved' ? COLORS.greenBg : u.regStatus === 'rejected' ? COLORS.redBg : COLORS.amberBg, borderColor: u.regStatus === 'approved' ? COLORS.green : u.regStatus === 'rejected' ? COLORS.red : COLORS.amber }]}>
                <Text style={{ color: u.regStatus === 'approved' ? COLORS.green : u.regStatus === 'rejected' ? COLORS.red : COLORS.amber, fontSize: 10, fontWeight: '700' }}>{u.regStatus?.toUpperCase() || 'PENDING'}</Text>
              </View>
            </View>
          ))}
        </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: COLORS.bg },
  content:          { padding: 16, paddingBottom: 60 },
  heading:          { color: COLORS.gold, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  sub:              { color: COLORS.text2, fontSize: 12, marginBottom: 16 },
  alertBanner:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.amberBg, borderRadius: 10, borderWidth: 1, borderColor: COLORS.amber, padding: 14, marginBottom: 16 },
  notifDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.amber },
  alertText:        { color: COLORS.amber, fontWeight: '600', fontSize: 13, flex: 1 },
  alertArrow:       { color: COLORS.amber, fontSize: 16, fontWeight: '700' },
  metricsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tabBar:           { marginBottom: 16 },
  tab:              { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.bg3 },
  tabActive:        { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabText:          { color: COLORS.text2, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  tabTextActive:    { color: '#000' },
  sectionTitle:     { color: COLORS.gold, fontSize: 14, fontWeight: '700', marginBottom: 14, letterSpacing: 0.3 },
  empty:            { color: COLORS.text3, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  deptCard:         { backgroundColor: COLORS.bg2, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.gold },
  deptName:         { color: COLORS.gold, fontSize: 15, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  deptStats:        { flexDirection: 'row', gap: 16, marginBottom: 10 },
  stat:             { alignItems: 'center' },
  statVal:          { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  statLabel:        { color: COLORS.text3, fontSize: 10, marginTop: 2 },
  deptPersonnel:    { flexDirection: 'row', marginTop: 4 },
  personnelLabel:   { color: COLORS.text2, fontSize: 12, fontWeight: '700' },
  personnelVal:     { color: COLORS.text, fontSize: 12, flex: 1 },
  deptSection:      { marginBottom: 16 },
  deptSectionTitle: { color: COLORS.text2, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  userCard:         { backgroundColor: COLORS.bg2, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  userInfo:         { flex: 1 },
  userName:         { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  userMeta:         { color: COLORS.text2, fontSize: 11, marginTop: 2 },
  userEmail:        { color: COLORS.text3, fontSize: 11, marginTop: 2 },
  userDate:         { color: COLORS.text3, fontSize: 10, marginTop: 2 },
  userActions:      { gap: 6 },
  approveBtn:       { backgroundColor: COLORS.greenBg, borderWidth: 1, borderColor: COLORS.green, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  approveBtnText:   { color: COLORS.green, fontSize: 10, fontWeight: '800' },
  rejectBtn:        { backgroundColor: COLORS.redBg, borderWidth: 1, borderColor: COLORS.red, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  rejectBtnText:    { color: COLORS.red, fontSize: 10, fontWeight: '800' },
  regStatusBadge:   { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  reqCard:          { backgroundColor: COLORS.bg2, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 8 },
  reqHeader:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  reqName:          { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  reqMeta:          { color: COLORS.text3, fontSize: 11, marginTop: 2 },
  reqCause:         { color: COLORS.text2, fontSize: 12 },
});
