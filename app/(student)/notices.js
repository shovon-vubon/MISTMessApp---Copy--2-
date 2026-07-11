import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../src/context/AuthContext';
import { notify } from '../../src/utils/notify';
import { COLORS } from '../../src/constants/theme';
import { format } from 'date-fns';

const fmtDateTime = (ts) => {
  try { return format(ts.toDate(), 'dd MMM yyyy, HH:mm'); } catch { return '—'; }
};

export default function StudentNotices() {
  const { profile } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const initialLoad = useRef(true);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'notices'), where('dept', '==', profile.dept || ''), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      if (!initialLoad.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const d = change.doc.data();
            notify(d.title || 'New Notice', d.body || '');
          }
        });
      }
      initialLoad.current = false;
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setRefresh(false);
    }, (err) => {
      console.warn('Firestore error:', err.message);
      setLoading(false);
      setRefresh(false);
    });
  }, [profile]);

  return (
    <ScrollView
      style={s.screen} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => setRefresh(true)} tintColor={COLORS.gold} />}
    >
      <Text style={s.heading}>Notices</Text>
      <Text style={s.sub}>Announcements from GSO-2</Text>

      {loading && <ActivityIndicator color={COLORS.gold} style={{ marginTop: 30 }} />}

      {!loading && notices.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyText}>No notices yet</Text>
        </View>
      )}

      {notices.map((n) => (
        <View key={n.id} style={s.card}>
          <Text style={s.cardTitle}>{n.title}</Text>
          <Text style={s.cardBody}>{n.body}</Text>
          <Text style={s.cardMeta}>{n.createdByName} · {n.createdAt ? fmtDateTime(n.createdAt) : 'just now'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: COLORS.bg },
  content:     { padding: 16, paddingBottom: 40 },
  heading:     { color: COLORS.gold, fontSize: 20, fontWeight: '800', marginBottom: 2 },
  sub:         { color: COLORS.text2, fontSize: 12, marginBottom: 20 },
  empty:       { alignItems: 'center', marginTop: 60 },
  emptyText:   { color: COLORS.text2, fontSize: 14 },
  card:        { backgroundColor: COLORS.bg2, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.gold },
  cardTitle:   { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  cardBody:    { color: COLORS.text2, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  cardMeta:    { color: COLORS.text3, fontSize: 11 },
});
