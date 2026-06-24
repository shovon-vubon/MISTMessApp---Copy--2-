import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../src/context/AuthContext';
import FilterBar from '../../src/components/FilterBar';
import StatusBadge from '../../src/components/StatusBadge';
import { COLORS } from '../../src/constants/theme';
import { format } from 'date-fns';

const fmtDate = d => { try { return format(new Date(d), 'dd MMM yyyy'); } catch { return d || '—'; } };

export default function GSO2Records() {
  const { profile } = useAuth();
  const [all,      setAll]     = useState([]);
  const [loading,  setLoading] = useState(true);
  const [refresh,  setRefresh] = useState(false);
  const [filters,  setFilters] = useState({ search: '', dateFrom: '', dateTo: '', status: '' });

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'requests'), where('dept', '==', profile.dept), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setAll(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false); setRefresh(false);
    }, (err) => {
      console.warn('Firestore error:', err.message);
      setLoading(false); setRefresh(false);
    });
  }, [profile]);

  const filtered = useMemo(() => {
    let res = [...all];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      res = res.filter(r => r.studentName?.toLowerCase().includes(s) || r.serviceNumber?.toLowerCase().includes(s));
    }
    if (filters.status)   res = res.filter(r => r.status === filters.status);
    if (filters.dateFrom) res = res.filter(r => r.date >= filters.dateFrom);
    if (filters.dateTo)   res = res.filter(r => r.date <= filters.dateTo);
    return res;
  }, [all, filters]);

  return (
    <ScrollView
      style={s.screen} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} tintColor={COLORS.gold} />}
    >
      <Text style={s.heading}>All Records</Text>
      <Text style={s.sub}>Dept: {profile?.dept} · {filtered.length} of {all.length} records</Text>

      <FilterBar onFilter={setFilters} />

      {loading && <ActivityIndicator color={COLORS.gold} style={{ marginTop: 20 }} />}
      {!loading && filtered.length === 0 && <Text style={s.empty}>No records match your filter.</Text>}

      {filtered.map((r) => (
        <View key={r.id} style={s.card}>
          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{r.studentName}</Text>
              <Text style={s.svc}>{r.serviceNumber} · {r.rank} · {fmtDate(r.date)}</Text>
            </View>
            <StatusBadge status={r.status} />
          </View>
          <Text style={s.cause} numberOfLines={2}>{r.cause}</Text>
          <View style={s.times}>
            <View style={s.timeItem}><Text style={s.timeLabel}>OUT</Text><Text style={s.timeVal}>{r.outTime}</Text></View>
            <View style={s.timeItem}><Text style={s.timeLabel}>RETURN BY</Text><Text style={s.timeVal}>{r.expectedReturn}</Text></View>
            <View style={s.timeItem}><Text style={s.timeLabel}>ACTUAL</Text><Text style={s.timeVal}>{r.actualReturn || '—'}</Text></View>
          </View>
          {r.remarks ? <Text style={s.remarks}>Remarks: {r.remarks}</Text> : null}
          {r.arrivalSent && <Text style={s.arrival}>✓ Arrived at {r.arrivalTime} hrs</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: COLORS.bg },
  content:    { padding: 16, paddingBottom: 40 },
  heading:    { color: COLORS.gold, fontSize: 20, fontWeight: '800', marginBottom: 2 },
  sub:        { color: COLORS.text2, fontSize: 12, marginBottom: 16 },
  empty:      { color: COLORS.text3, fontSize: 13, textAlign: 'center', marginTop: 20 },
  card:       { backgroundColor: COLORS.bg2, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  name:       { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  svc:        { color: COLORS.text3, fontSize: 11, marginTop: 2 },
  cause:      { color: COLORS.text2, fontSize: 12, marginBottom: 10 },
  times:      { flexDirection: 'row', gap: 12 },
  timeItem:   { flex: 1 },
  timeLabel:  { color: COLORS.text3, fontSize: 9, letterSpacing: 0.8, marginBottom: 2 },
  timeVal:    { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  remarks:    { color: COLORS.amber, fontSize: 11, marginTop: 8 },
  arrival:    { color: COLORS.green, fontSize: 11, marginTop: 4 },
});
