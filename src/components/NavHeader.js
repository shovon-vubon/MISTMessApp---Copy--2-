import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function NavHeader({ title }) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  return (
    <View style={[s.bar, { paddingTop: insets.top + (Platform.OS === 'web' ? 8 : 6) }]}>
      {/* Brand */}
      <View style={s.brand}>
        <Image source={require('../../assets/mist-logo.png')} style={s.logo} />
        <View>
          <Text style={s.appName}>Out Pass Register MIST</Text>
          {title ? <Text style={s.pageTitle}>{title}</Text> : null}
        </View>
      </View>

      {/* Right: reload + logout */}
      <View style={s.right}>
        {Platform.OS === 'web' && (
          <TouchableOpacity style={s.reloadBtn} onPress={() => window.location.reload()} activeOpacity={0.7}>
            <Text style={s.reloadText}>⟳</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Image source={require('../../assets/switch.png')} style={s.logoutIcon} />
          <Text style={s.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bg2, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 14, paddingBottom: 10 },
  brand:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo:       { width: 34, height: 34, resizeMode: 'contain' },
  appName:    { color: COLORS.gold, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  pageTitle:  { color: COLORS.text2, fontSize: 10, marginTop: 1 },
  right:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reloadBtn:  { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  reloadText: { color: COLORS.text2, fontSize: 18, fontWeight: '700' },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  logoutIcon: { width: 16, height: 16, resizeMode: 'contain' },
  logoutText: { color: COLORS.text2, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
