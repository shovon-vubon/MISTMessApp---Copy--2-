import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function AppHeader({ title, showBack = false, right }) {
  const router  = useRouter();
  const { profile, logout } = useAuth();

  const roleLabel = {
    student:  'Student Officer',
    gso2:     'GSO-2',
    depthead: 'Dept Head',
    admin:    'Admin',
  }[profile?.role] || '';

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.brand}>
          <View style={styles.ring}><Text style={styles.ringText}>MIST</Text></View>
          <View>
            <Text style={styles.brandName}>Out Pass Register MIST</Text>
            {title && <Text style={styles.pageTitle}>{title}</Text>}
          </View>
        </View>
      </View>
      <View style={styles.right}>
        {right}
        {profile && (
          <View style={styles.userChip}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(profile.name || '')}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{profile.name}</Text>
              <Text style={styles.userRole}>{roleLabel}</Text>
            </View>
          </View>
        )}
        {Platform.OS === 'web' && (
          <TouchableOpacity onPress={() => window.location.reload()} style={styles.reloadBtn}>
            <Text style={styles.reloadText}>⟳</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  bar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bg2, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 10, paddingTop: Platform.OS === 'ios' ? 50 : Platform.OS === 'android' ? 34 : 12 },
  left:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  right:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ring:       { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg3 },
  ringText:   { color: COLORS.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  brandName:  { color: COLORS.gold, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  pageTitle:  { color: COLORS.text2, fontSize: 10, letterSpacing: 0.5, marginTop: 1 },
  backBtn:    { padding: 6 },
  backIcon:   { color: COLORS.gold, fontSize: 18 },
  userChip:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar:     { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.goldDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#000', fontSize: 11, fontWeight: '800' },
  userInfo:   { display: 'none' },
  userName:   { color: COLORS.text, fontSize: 12 },
  userRole:   { color: COLORS.text2, fontSize: 10 },
  reloadBtn:  { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  reloadText: { color: COLORS.text2, fontSize: 14, fontWeight: '700' },
  logoutBtn:  { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  logoutText: { color: COLORS.text2, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
