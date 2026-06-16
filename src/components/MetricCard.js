import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function MetricCard({ value, label, color }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color: color || COLORS.gold }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:  { flex: 1, backgroundColor: COLORS.bg2, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 14, alignItems: 'center', minWidth: 70 },
  value: { fontSize: 26, fontWeight: '700', marginBottom: 2 },
  label: { fontSize: 11, color: COLORS.text2, textAlign: 'center', letterSpacing: 0.4 },
});
