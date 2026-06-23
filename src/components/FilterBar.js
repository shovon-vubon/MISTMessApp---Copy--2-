import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform, Modal, ScrollView } from 'react-native';
import { COLORS } from '../constants/theme';

export default function FilterBar({ onFilter }) {
  const [search, setSearch]     = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [status, setStatus]     = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker]     = useState(false);

  // Custom Date Picker Modal
  const DateModal = ({ visible, value, onSelect, onClose, title }) => {
    const years = Array.from({ length: 10 }, (_, i) => String(2024 + i));
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const initialDate = value ? new Date(value) : new Date();
    const [selY, setSelY] = useState(String(initialDate.getFullYear()));
    const [selM, setSelM] = useState(months[initialDate.getMonth()]);
    const [selD, setSelD] = useState(String(initialDate.getDate()).padStart(2, '0'));

    const daysInMonth = (year, monthIdx) => new Date(year, monthIdx + 1, 0).getDate();
    const monthIdx = months.indexOf(selM);
    const days = Array.from({ length: daysInMonth(parseInt(selY), monthIdx) }, (_, i) => String(i + 1).padStart(2, '0'));

    const handleSet = () => {
      const mIdx = String(months.indexOf(selM) + 1).padStart(2, '0');
      onSelect(`${selY}-${mIdx}-${selD}`);
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={styles.pickerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={{ height: 120 }} nestedScrollEnabled>
                  {years.map(y => (
                    <TouchableOpacity key={y} onPress={() => setSelY(y)} style={[styles.timeItem, selY === y && styles.timeItemSel]}>
                      <Text style={[styles.timeItemText, selY === y && styles.timeItemTextSel]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={{ height: 120 }} nestedScrollEnabled>
                  {months.map(m => (
                    <TouchableOpacity key={m} onPress={() => setSelM(m)} style={[styles.timeItem, selM === m && styles.timeItemSel]}>
                      <Text style={[styles.timeItemText, selM === m && styles.timeItemTextSel]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={{ height: 120 }} nestedScrollEnabled>
                  {days.map(d => (
                    <TouchableOpacity key={d} onPress={() => setSelD(d)} style={[styles.timeItem, selD === d && styles.timeItemSel]}>
                      <Text style={[styles.timeItemText, selD === d && styles.timeItemTextSel]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnGhost2} onPress={onClose}><Text style={styles.btnGhostText}>CANCEL</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnGold2} onPress={handleSet}><Text style={styles.btnGoldText}>SET DATE</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  function apply() {
    onFilter({ search: search.trim(), dateFrom, dateTo, status });
  }
  function handleStatusChange(s) {
    setStatus(s);
    onFilter({ search: search.trim(), dateFrom, dateTo, status: s });
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
        <TouchableOpacity style={[styles.input, styles.half]} onPress={() => setShowFromPicker(true)}>
          <Text style={{ color: dateFrom ? COLORS.text : COLORS.text3, fontSize: 13 }}>
            {dateFrom || 'From Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.input, styles.half]} onPress={() => setShowToPicker(true)}>
          <Text style={{ color: dateTo ? COLORS.text : COLORS.text3, fontSize: 13 }}>
            {dateTo || 'To Date'}
          </Text>
        </TouchableOpacity>
      </View>

      <DateModal
        visible={showFromPicker}
        title="From Date"
        value={dateFrom}
        onSelect={(d) => { setDateFrom(d); setShowFromPicker(false); }}
        onClose={() => setShowFromPicker(false)}
      />

      <DateModal
        visible={showToPicker}
        title="To Date"
        value={dateTo}
        onSelect={(d) => { setDateTo(d); setShowToPicker(false); }}
        onClose={() => setShowToPicker(false)}
      />


      <View style={styles.row}>
        <TouchableOpacity style={styles.btnApply} onPress={apply}>
          <Text style={styles.btnApplyText}>APPLY FILTER</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnReset} onPress={reset}>
          <Text style={styles.btnResetText}>RESET</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, status === s && styles.chipActive]}
            onPress={() => handleStatusChange(s)}
          >
            <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
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

  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modal:       { backgroundColor: COLORS.bg2, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 20 },
  modalTitle:  { color: COLORS.gold, fontSize: 16, fontWeight: '800', marginBottom: 15, textAlign: 'center' },
  pickerRow:   { flexDirection: 'row', gap: 10, marginBottom: 20 },
  pickerLabel: { color: COLORS.text3, fontSize: 10, textAlign: 'center', marginBottom: 5, textTransform: 'uppercase' },
  timeItem:    { paddingVertical: 8, alignItems: 'center', borderRadius: 6, marginBottom: 4 },
  timeItemSel: { backgroundColor: COLORS.gold + '33', borderWidth: 1, borderColor: COLORS.gold },
  timeItemText: { color: COLORS.text2, fontSize: 14 },
  timeItemTextSel: { color: COLORS.gold, fontWeight: '700' },
  modalBtns:   { flexDirection: 'row', gap: 10 },
  btnGhost2:   { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, alignItems: 'center' },
  btnGold2:    { flex: 1, backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnGoldText: { color: '#000', fontWeight: '800', fontSize: 12 },
});
