import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL = {
  student:  'Student Officer',
  gso2:     'GSO-2',
  depthead: 'Dept Head',
  admin:    'Admin',
};

export default function NavHeader({ title }) {
  const insets = useSafeAreaInsets();
  const { profile, logout } = useAuth();
  const router = useRouter();

  return (
    <View style={[s.bar, { paddingTop: insets.top + (Platform.OS === 'web' ? 8 : 6) }]}>
      {/* Brand */}
      <View style={s.brand}>
        <View style={s.ring}><Text style={s.ringText}>MIST</Text></View>
        <View>
          <Text style={s.appName}>Officers' Mess</Text>
          {title ? <Text style={s.pageTitle}>{title}</Text> : null}
        </View>
      </View>

      {/* Right: user info + logout */}
      <View style={s.right}>
        {profile && (
          <View style={s.userChip}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(profile.name)}</Text>
            </View>
            <View style={s.userMeta}>
              <Text style={s.userName} numberOfLines={1}>{profile.name}</Text>
              <Text style={s.userRole}>{ROLE_LABEL[profile.role] || profile.role}</Text>
            </View>
          </View>
        )}
        {Platform.OS === 'web' && (
          <TouchableOpacity style={s.reloadBtn} onPress={() => window.location.reload()} activeOpacity={0.7}>
            <Text style={s.reloadText}>⟳</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Text style={s.logoutIcon}>↩</Text>
          <Text style={s.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const s = StyleSheet.create({
  bar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bg2, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 14, paddingBottom: 10 },
  brand:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ring:       { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg3 },
  ringText:   { color: COLORS.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  appName:    { color: COLORS.gold, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  pageTitle:  { color: COLORS.text2, fontSize: 10, marginTop: 1 },
  right:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userChip:   { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: COLORS.bg3, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  avatar:     { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.goldDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#000', fontSize: 9, fontWeight: '800' },
  userMeta:   { display: Platform.OS === 'web' ? 'flex' : 'none' },
  userName:   { color: COLORS.text, fontSize: 11, fontWeight: '600', maxWidth: 100 },
  userRole:   { color: COLORS.text3, fontSize: 9 },
  reloadBtn:  { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  reloadText: { color: COLORS.text2, fontSize: 14, fontWeight: '700' },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  logoutIcon: { color: COLORS.red, fontSize: 13, fontWeight: '700' },
  logoutText: { color: COLORS.text2, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
