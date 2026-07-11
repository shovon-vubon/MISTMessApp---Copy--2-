import React, { useState } from 'react';
import {  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../firebase';
import { COLORS } from '../src/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);
  const [busy,       setBusy]       = useState(false);

  async function handleSubmit() {
    const val = identifier.trim();
    if (!val) { setError('Enter your service number or email.'); return; }
    setBusy(true); setError('');
    try {
      let email = val.toLowerCase();

      const svcMatch = val.toUpperCase().match(/^(BA|BD|BN)-?(.+)$/);
      if (svcMatch) {
        const normalised = `${svcMatch[1]}-${svcMatch[2]}`;
        const snSnap = await getDoc(doc(db, 'serviceNumbers', normalised));
        if (!snSnap.exists()) { setError('Service number not found.'); setBusy(false); return; }
        email = snSnap.data().email;
      }

      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with that service number or email.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
    setBusy(false);
  }

  if (success) {
    return (
      <View style={s.screen}>
        <View style={s.card}>
          <Text style={s.successIcon}>✓</Text>
          <Text style={s.successTitle}>Check Your Email</Text>
          <Text style={s.successText}>
            A password reset link has been sent to your registered email. Follow the link to set a new password.
          </Text>
          <Text style ={s.highlightText}>If you don't see the email, check your spam folder.</Text>
          <TouchableOpacity style={s.btn} onPress={() => router.replace('/')}>
            <Text style={s.btnText}>BACK TO LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.header}>
            <View style={s.ring}><Text style={s.ringText}>MIST</Text></View>
            <Text style={s.title}>Password Recovery</Text>
            <Text style={s.subtitle}>We'll email you a link to reset your password</Text>
          </View>

          <Text style={s.label}>Service Number or Email</Text>
          <TextInput
            style={s.input} placeholderTextColor={COLORS.text3}
            placeholder="e.g. BA-01234 or name@gmail.com"
            value={identifier} onChangeText={setIdentifier}
            autoCapitalize="none" onSubmitEditing={handleSubmit}
          />

          {!!error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={busy}>
            {busy ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>SEND RESET LINK</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.backLink} onPress={() => router.replace('/')}>
            <Text style={s.backLinkText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card:         { backgroundColor: COLORS.bg2, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 24, borderTopWidth: 3, borderTopColor: COLORS.gold },
  header:       { alignItems: 'center', marginBottom: 24 },
  ring:         { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg3, marginBottom: 10 },
  ringText:     { color: COLORS.gold, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title:        { color: COLORS.gold, fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  subtitle:     { color: COLORS.text3, fontSize: 11, marginTop: 4, textAlign: 'center' },
  label:        { color: COLORS.text2, fontSize: 12, marginBottom: 6, letterSpacing: 0.3 },
  input:        { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, color: COLORS.text, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginBottom: 12 },
  error:        { color: COLORS.red, fontSize: 12, marginBottom: 10 },
  btn:          { backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText:      { color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  backLink:     { marginTop: 18, alignItems: 'center' },
  backLinkText: { color: COLORS.text3, fontSize: 13 },
  successIcon:  { color: COLORS.green, fontSize: 52, textAlign: 'center', marginBottom: 8 },
  successTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  successText:  { color: COLORS.text2, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  highlightText: { color: COLORS.gold, fontSize: 13, textAlign: 'center', fontWeight: '800' },
});
