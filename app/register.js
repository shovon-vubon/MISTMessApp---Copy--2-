import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COLORS } from '../src/constants/theme';
import { DEPARTMENTS, RANKS_BY_PREFIX, SERVICE_PREFIXES } from '../src/constants/config';

export default function RegisterScreen() {
  const router = useRouter();
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState('');
  const [isError, setIsError] = useState(false);

  const [prefix, setPrefix]   = useState('BA');
  const [svcNum, setSvcNum]   = useState('');
  const [rank, setRank]       = useState(RANKS_BY_PREFIX['BA'][0]);

  function handlePrefixChange(val) {
    setPrefix(val);
    setRank(RANKS_BY_PREFIX[val][0]);
  }
  const [name, setName]       = useState('');
  const [dept, setDept]       = useState('CSE');
  const [batch, setBatch]     = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [pw, setPw]           = useState('');
  const [cpw, setCpw]         = useState('');

  async function handleRegister() {
    if (!svcNum || !name || !email || !pw) { showMsg('Fill all required fields.', true); return; }
    if (pw !== cpw)                         { showMsg('Passwords do not match.',   true); return; }
    if (pw.length < 6)                      { showMsg('Password must be at least 6 characters.', true); return; }

    setBusy(true);
    try {
      const serviceNumber = `${prefix}-${svcNum.trim().toUpperCase()}`;
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid:           credential.user.uid,
        serviceNumber,
        servicePrefix: prefix,
        rank,
        name:          `${rank} ${name.trim()}`,
        dept,
        batch:         batch.trim(),
        email:         email.trim(),
        phone:         phone.trim(),
        role:          'student',
        regStatus:     'pending',
        fcmToken:      null,
        createdAt:     serverTimestamp(),
      });
      // Write public lookup so login can resolve service number → email without auth
      await setDoc(doc(db, 'serviceNumbers', serviceNumber), { email: email.trim() });
      await signOut(auth);
      showMsg('Registration submitted! Awaiting admin approval before you can log in.', false);
      setTimeout(() => router.replace('/'), 3000);
    } catch (e) {
      showMsg(e.code === 'auth/email-already-in-use' ? 'Email already registered.' : 'Registration failed. Try again.', true);
    }
    setBusy(false);
  }

  function showMsg(text, err) { setMsg(text); setIsError(err); }

  const Picker = ({ label, options, value, onChange }) => (
    <View style={s.pickerWrap}>
      <Text style={s.label}>{label}</Text>
      <View style={s.pickerRow}>
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const lbl = typeof o === 'string' ? o : o.label;
          return (
            <TouchableOpacity key={val} style={[s.option, value === val && s.optionActive]} onPress={() => onChange(val)}>
              <Text style={[s.optionText, value === val && s.optionTextActive]}>{lbl}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.emblem}>
            <View style={s.ring}><Text style={s.ringText}>MIST</Text></View>
            <Text style={s.title}>Officers' Mess</Text>
            <Text style={s.subtitle}>STUDENT OFFICER REGISTRATION</Text>
          </View>

          <View style={s.tabs}>
            <TouchableOpacity style={s.tab} onPress={() => router.replace('/')}>
              <Text style={s.tabText}>SIGN IN</Text>
            </TouchableOpacity>
            <View style={[s.tab, s.tabActive]}><Text style={s.tabTextActive}>REGISTER</Text></View>
          </View>

          {/* Service Number */}
          <Text style={s.label}>Service Number *</Text>
          <View style={s.svcRow}>
            <View style={s.prefixRow}>
              {SERVICE_PREFIXES.map(p => (
                <TouchableOpacity key={p.value} style={[s.option, prefix === p.value && s.optionActive]} onPress={() => handlePrefixChange(p.value)}>
                  <Text style={[s.optionText, prefix === p.value && s.optionTextActive]}>{p.value}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="e.g. 01234" placeholderTextColor={COLORS.text3}
              value={svcNum} onChangeText={setSvcNum}
              autoCapitalize="characters"
            />
          </View>
          <Text style={s.hint}>Service Number: {prefix}-{svcNum.toUpperCase() || 'XXXXX'}</Text>

          <Picker label="Rank *" options={RANKS_BY_PREFIX[prefix]} value={rank} onChange={setRank} />

          <Text style={s.label}>Full Name (without rank) *</Text>
          <TextInput style={s.input} placeholderTextColor={COLORS.text3} placeholder="e.g. Tanvir Ahmed" value={name} onChangeText={setName} />

          <Picker label="Department *" options={DEPARTMENTS} value={dept} onChange={setDept} />

          <Text style={s.label}>Batch Year</Text>
          <TextInput style={s.input} placeholderTextColor={COLORS.text3} placeholder="e.g. 2022" value={batch} onChangeText={setBatch} keyboardType="numeric" />

          <Text style={s.label}>Email *</Text>
          <TextInput style={s.input} placeholderTextColor={COLORS.text3} placeholder="name@mist.ac.bd" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

          <Text style={s.label}>Phone</Text>
          <TextInput style={s.input} placeholderTextColor={COLORS.text3} placeholder="017XXXXXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={s.label}>Password *</Text>
          <TextInput style={s.input} placeholderTextColor={COLORS.text3} placeholder="Min 6 characters" secureTextEntry value={pw} onChangeText={setPw} />

          <Text style={s.label}>Confirm Password *</Text>
          <TextInput style={s.input} placeholderTextColor={COLORS.text3} placeholder="Re-enter password" secureTextEntry value={cpw} onChangeText={setCpw} />

          {!!msg && (
            <View style={[s.msgBox, { backgroundColor: isError ? COLORS.redBg : COLORS.greenBg, borderColor: isError ? COLORS.red : COLORS.green }]}>
              <Text style={{ color: isError ? COLORS.red : COLORS.green, fontSize: 13 }}>{msg}</Text>
            </View>
          )}

          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={busy}>
            {busy ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>REGISTER AS STUDENT OFFICER</Text>}
          </TouchableOpacity>

          <View style={s.infoBox}>
            <Text style={s.infoText}>
              After registration, your account will be reviewed by the Admin. You will be able to log in once your account is approved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: COLORS.bg },
  scroll:        { flexGrow: 1, padding: 20 },
  card:          { backgroundColor: COLORS.bg2, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 24, borderTopWidth: 3, borderTopColor: COLORS.gold },
  emblem:        { alignItems: 'center', marginBottom: 20 },
  ring:          { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg3, marginBottom: 8 },
  ringText:      { color: COLORS.gold, fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  title:         { color: COLORS.gold, fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  subtitle:      { color: COLORS.text3, fontSize: 10, marginTop: 3, letterSpacing: 0.5 },
  tabs:          { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 18 },
  tab:           { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive:     { backgroundColor: COLORS.gold },
  tabText:       { color: COLORS.text2, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  tabTextActive: { color: '#000', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  label:         { color: COLORS.text2, fontSize: 12, marginBottom: 6, letterSpacing: 0.3 },
  input:         { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, color: COLORS.text, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginBottom: 12 },
  svcRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  prefixRow:     { flexDirection: 'row', gap: 4 },
  pickerWrap:    { marginBottom: 12 },
  pickerRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  option:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg3 },
  optionActive:  { borderColor: COLORS.gold, backgroundColor: COLORS.goldDim },
  optionText:    { color: COLORS.text2, fontSize: 12, fontWeight: '600' },
  optionTextActive:{ color: '#000', fontWeight: '700' },
  hint:          { color: COLORS.text3, fontSize: 11, marginBottom: 12, marginTop: -4 },
  msgBox:        { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
  btn:           { backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText:       { color: '#000', fontWeight: '800', fontSize: 12, letterSpacing: 0.8 },
  infoBox:       { marginTop: 12, backgroundColor: COLORS.bg3, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  infoText:      { color: COLORS.text3, fontSize: 11, lineHeight: 17 },
});
