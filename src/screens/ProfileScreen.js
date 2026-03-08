import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { signOut } from '../services/auth';
import { syncToCloud, clearAllStorage } from '../services/storage';
import { useTheme } from '../theme';

export default function ProfileScreen() {
  const { user, golfBag, ghinData, isDarkMode, toggleTheme,
    setUser, setGolfBag, setGhinData, clearChat } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const t = useTheme();

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncToCloud();
      Alert.alert('Success', 'All data synced to iCloud');
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync to iCloud. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out? Your data is saved in iCloud.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try { await signOut(); setUser(null); }
          catch (error) { Alert.alert('Error', 'Failed to sign out.'); }
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert('Clear All Data', 'This will delete all local and iCloud data. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Data', style: 'destructive',
        onPress: async () => {
          try {
            await clearAllStorage();
            setUser(null);
            setGolfBag({ driver: null, woods: [], hybrids: [], irons: [], wedges: [], putter: null });
            setGhinData(null);
            clearChat();
            Alert.alert('Success', 'All data cleared');
          } catch (error) { Alert.alert('Error', 'Failed to clear data.'); }
        },
      },
    ]);
  };

  const getClubCount = () => {
    if (!golfBag) return 0;
    let count = 0;
    if (golfBag.driver) count++;
    if (golfBag.putter) count++;
    count += (golfBag.woods?.length || 0);
    count += (golfBag.hybrids?.length || 0);
    count += (golfBag.irons?.length || 0);
    count += (golfBag.wedges?.length || 0);
    return count;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.background }]}>
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <View style={[styles.avatarContainer, { backgroundColor: t.primary }]}>
          <Text style={styles.avatar}>🏌️</Text>
        </View>
        <Text style={[styles.name, { color: t.text }]}>
          {user?.fullName?.givenName || 'Golfer'} {user?.fullName?.familyName || ''}
        </Text>
        {user?.email && <Text style={[styles.email, { color: t.textSecondary }]}>{user.email}</Text>}
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <StatCard icon="⛳" value={getClubCount()} label="Clubs in Bag" theme={t} />
        <StatCard icon="📊" value={ghinData?.handicapIndex?.toFixed(1) || '--'} label="Handicap Index" theme={t} />
        <StatCard icon="🏌️" value={ghinData?.recentScores?.length || 0} label="Rounds Tracked" theme={t} />
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Appearance</Text>
        <View style={[styles.themeToggle, { backgroundColor: t.card }]}>
          <View style={styles.themeToggleLeft}>
            <Text style={styles.themeIcon}>{isDarkMode ? '🌙' : '☀️'}</Text>
            <View>
              <Text style={[styles.themeLabel, { color: t.text }]}>Dark Mode</Text>
              <Text style={[styles.themeSubtitle, { color: t.textSecondary }]}>
                {isDarkMode ? 'Dark theme active' : 'Light theme active'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#e0e0e0', true: t.primary + '80' }}
            thumbColor={isDarkMode ? t.primary : '#f4f4f4'}
          />
        </View>
      </View>

      {/* iCloud Sync */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>iCloud Sync</Text>
        <TouchableOpacity style={[styles.syncButton, { backgroundColor: t.primary }]}
          onPress={handleSync} disabled={isSyncing}>
          {isSyncing ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.syncIcon}>☁️</Text>
              <Text style={styles.syncButtonText}>Sync to iCloud Now</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={[styles.syncInfo, { color: t.textSecondary }]}>
          ✓ Automatic sync enabled{'\n'}
          Your golf bag, chat history, and stats are backed up to iCloud
        </Text>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Settings</Text>
        <SettingItem icon="🏌️" title="Golf Bag" subtitle={`${getClubCount()} clubs`} theme={t} onPress={() => {}} />
        <SettingItem icon="📊" title="GHIN Stats"
          subtitle={ghinData ? `Index: ${ghinData.handicapIndex}` : 'Not connected'} theme={t} onPress={() => {}} />
        <SettingItem icon="💬" title="Chat History"
          subtitle="Saved conversations with your coach" theme={t} onPress={() => {}} />
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>About</Text>
        <View style={[styles.aboutCard, { backgroundColor: t.card }]}>
          <Text style={styles.appIcon}>⛳</Text>
          <Text style={[styles.appName, { color: t.primary }]}>Golf Coach</Text>
          <Text style={[styles.version, { color: t.textTertiary }]}>Version 1.0.0</Text>
          <Text style={[styles.aboutText, { color: t.textSecondary }]}>
            Your AI-powered golf assistant with personalized coaching,
            practice plans, and performance analytics.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: t.dangerButton, borderColor: t.dangerBorder }]}
          onPress={handleClearData}>
          <Text style={[styles.dangerButtonText, { color: t.dangerText }]}>Clear All Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: t.signOutButton }]}
          onPress={handleSignOut}>
          <Text style={[styles.signOutButtonText, { color: t.signOutText }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: t.textTertiary }]}>Made with ❤️ for golfers</Text>
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, value, label, theme: t }) {
  return (
    <View style={[styles.statCard, { backgroundColor: t.card }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: t.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textSecondary }]}>{label}</Text>
    </View>
  );
}

function SettingItem({ icon, title, subtitle, onPress, theme: t }) {
  return (
    <TouchableOpacity style={[styles.settingItem, { backgroundColor: t.card }]} onPress={onPress}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: t.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: t.textSecondary }]}>{subtitle}</Text>
      </View>
      <Text style={[styles.settingChevron, { color: t.textTertiary }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: 32, borderBottomWidth: 1 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatar: { fontSize: 40 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14 },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statIcon: { fontSize: 32, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  themeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12 },
  themeToggleLeft: { flexDirection: 'row', alignItems: 'center' },
  themeIcon: { fontSize: 28, marginRight: 12 },
  themeLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  themeSubtitle: { fontSize: 13 },
  syncButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 12 },
  syncIcon: { fontSize: 20, marginRight: 8 },
  syncButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  syncInfo: { fontSize: 13, lineHeight: 20 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  settingIcon: { fontSize: 24, marginRight: 12 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  settingSubtitle: { fontSize: 13 },
  settingChevron: { fontSize: 32 },
  aboutCard: { padding: 24, borderRadius: 12, alignItems: 'center' },
  appIcon: { fontSize: 48, marginBottom: 12 },
  appName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  version: { fontSize: 14, marginBottom: 16 },
  aboutText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  dangerButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12, borderWidth: 2 },
  dangerButtonText: { fontSize: 16, fontWeight: 'bold' },
  signOutButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
  signOutButtonText: { fontSize: 16, fontWeight: 'bold' },
  footer: { padding: 32, alignItems: 'center' },
  footerText: { fontSize: 12 },
});
