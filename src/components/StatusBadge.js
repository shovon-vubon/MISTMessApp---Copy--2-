import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

const map = {
  pending:  { bg: COLORS.amberBg, color: COLORS.amber,  label: 'Pending'  },
  approved: { bg: COLORS.greenBg, color: COLORS.green,  label: 'Approved' },
  rejected: { bg: COLORS.redBg,   color: COLORS.red,    label: 'Rejected' },
};

export default function StatusBadge({ status }) {
  const s = map[status] || map.pending;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.color }]} />
      <Text style={[styles.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  dot:   { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  text:  { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
});
