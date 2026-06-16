import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/theme';

export default function FilterBar({ onFilter }) {
  const [search, setSearch]     = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [status, setStatus]     = useState('');

  function apply() {
    onFilter({ search: search.trim(), dateFrom, dateTo, status });
  }
  function reset() {
    setSearch(''); setDateFrom(''); setDateTo(''); setStatus('');
    onFilter({ search: '', dateFrom: '', dateTo: '', status: '' });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Filter Records</Text>
      <TextInput
        style={styles.input}
        placeholder="Search by ID or name…"
        placeholderTextColor={COLORS.text3}
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.half]}
          placeholder="From date (YYYY-MM-DD)"
          placeholderTextColor={COLORS.text3}
          value={dateFrom}
          onChangeText={setDateFrom}
        />
        <TextInput
          style={[styles.input, styles.half]}
          placeholder="To date (YYYY-MM-DD)"
          placeholderTextColor={COLORS.text3}
          value={dateTo}
          onChangeText={setDateTo}
        />
      </View>
      <View style={styles.row}>
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, status === s && styles.chipActive]}
            onPress={() => setStatus(s)}
          >
            <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={styles.btnApply} onPress={apply}>
          <Text style={styles.btnApplyText}>APPLY FILTER</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnReset} onPress={reset}>
          <Text style={styles.btnResetText}>RESET</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { backgroundColor: COLORS.bg2, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12 },
  heading:      { color: COLORS.gold, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  input:        { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, color: COLORS.text, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, marginBottom: 8 },
  row:          { flexDirection: 'row', gap: 8, marginBottom: 8 },
  half:         { flex: 1, marginBottom: 0 },
  chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg3 },
  chipActive:   { borderColor: COLORS.gold, backgroundColor: COLORS.goldDim },
  chipText:     { fontSize: 11, color: COLORS.text2, fontWeight: '600' },
  chipTextActive:{ color: '#000' },
  btnApply:     { flex: 1, backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  btnApplyText: { color: '#000', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  btnReset:     { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, alignItems: 'center' },
  btnResetText: { color: COLORS.text2, fontSize: 12, fontWeight: '600' },
});
