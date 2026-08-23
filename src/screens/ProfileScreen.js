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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { signOut } from '../services/auth';
import { syncToCloud, clearAllStorage } from '../services/storage';
import { clearUserData, closeDb } from '../services/db';
import { isUpcoming } from '../services/teeTimes';
import { useTheme, shadows, typography, spacing } from '../theme';

export default function ProfileScreen() {
  const { user, golfBag, ghinData, isDarkMode, toggleTheme, reviews, bookings,
    setUser, setGolfBag, setGhinData, clearChat, clearCourseData } = useAppStore();
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
          try {
            await signOut();
            // Course ratings and bookings stay on disk for the next sign in;
            // just drop them out of memory.
            closeDb();
            clearCourseData();
            setUser(null);
          }
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
            // Wipe the private course database first so its in-memory cache goes
            // with it, then everything else.
            if (user?.id) await clearUserData(user.id);
            closeDb();
            await clearAllStorage();
            setUser(null);
            setGolfBag({ driver: null, woods: [], hybrids: [], irons: [], wedges: [], putter: null });
            setGhinData(null);
            clearChat();
            clearCourseData();
            Alert.alert('Success', 'All data cleared');
          } catch (error) { Alert.alert('Error', 'Failed to clear data.'); }
        },
      },
    ]);
  };

  const upcomingTeeTimes = (bookings || []).filter(isUpcoming).length;

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
          <MaterialCommunityIcons name="golf" size={40} color="#fff" />
        </View>
        <Text style={[styles.name, { color: t.text }]}>
          {user?.fullName?.givenName || 'Golfer'} {user?.fullName?.familyName || ''}
        </Text>
        {user?.email && <Text style={[styles.email, { color: t.textSecondary }]}>{user.email}</Text>}
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <StatCard
          IconComponent={MaterialCommunityIcons}
          iconName="golf"
          value={getClubCount()}
          label="Clubs in Bag"
          theme={t}
        />
        <StatCard
          IconComponent={Ionicons}
          iconName="stats-chart"
          value={ghinData?.handicapIndex?.toFixed(1) || '--'}
          label="Handicap Index"
          theme={t}
        />
        <StatCard
          IconComponent={MaterialCommunityIcons}
          iconName="golf-tee"
          value={ghinData?.recentScores?.length || 0}
          label="Rounds Tracked"
          theme={t}
        />
      </View>

      {/* Courses */}
      <View style={styles.statsContainer}>
        <StatCard
          IconComponent={Ionicons}
          iconName="star"
          value={reviews?.length || 0}
          label="Courses Rated"
          theme={t}
        />
        <StatCard
          IconComponent={Ionicons}
          iconName="calendar"
          value={upcomingTeeTimes}
          label="Tee Times Booked"
          theme={t}
        />
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Appearance</Text>
        <View style={[styles.themeToggle, { backgroundColor: t.card, borderColor: t.cardBorder }, shadows.small]}>
          <View style={styles.themeToggleLeft}>
            <View style={[styles.themeIconCircle, { backgroundColor: t.primaryLight }]}>
              <Ionicons
                name={isDarkMode ? 'moon' : 'sunny'}
                size={24}
                color={t.primary}
              />
            </View>
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
        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: t.primary }, shadows.medium]}
          onPress={handleSync}
          disabled={isSyncing}
          activeOpacity={0.8}
        >
          {isSyncing ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
              <Text style={styles.syncButtonText}>Sync to iCloud Now</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={styles.syncInfoContainer}>
          <Ionicons name="checkmark-circle" size={16} color={t.success} />
          <Text style={[styles.syncInfo, { color: t.textSecondary }]}>
            Automatic sync enabled{'\n'}
            Your golf bag, chat history, and stats are backed up to iCloud
          </Text>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Settings</Text>
        <SettingItem
          IconComponent={MaterialCommunityIcons}
          iconName="golf"
          title="Golf Bag"
          subtitle={`${getClubCount()} clubs`}
          theme={t}
          onPress={() => {}}
        />
        <SettingItem
          IconComponent={Ionicons}
          iconName="stats-chart-outline"
          title="GHIN Stats"
          subtitle={ghinData ? `Index: ${ghinData.handicapIndex}` : 'Not connected'}
          theme={t}
          onPress={() => {}}
        />
        <SettingItem
          IconComponent={Ionicons}
          iconName="chatbubbles-outline"
          title="Chat History"
          subtitle="Saved conversations with your coach"
          theme={t}
          onPress={() => {}}
        />
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>About</Text>
        <View style={[styles.aboutCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadows.small]}>
          <View style={[styles.aboutIconCircle, { backgroundColor: t.primaryLight }]}>
            <MaterialCommunityIcons name="golf" size={32} color={t.primary} />
          </View>
          <Text style={[styles.appName, { color: t.text }]}>Golf Coach</Text>
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

function StatCard({ IconComponent, iconName, value, label, theme: t }) {
  return (
    <View style={[styles.statCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadows.small]}>
      <View style={[styles.statIconCircle, { backgroundColor: t.primaryLight }]}>
        <IconComponent name={iconName} size={24} color={t.primary} />
      </View>
      <Text style={[styles.statValue, { color: t.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textSecondary }]}>{label}</Text>
    </View>
  );
}

function SettingItem({ IconComponent, iconName, title, subtitle, onPress, theme: t }) {
  return (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: t.card, borderColor: t.cardBorder }, shadows.small]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIconCircle, { backgroundColor: t.primaryLight }]}>
        <IconComponent name={iconName} size={20} color={t.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: t.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: t.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={t.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1 },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.bodySmall,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  section: { padding: spacing.md },
  sectionTitle: {
    ...typography.h5,
    marginBottom: spacing.md,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeToggleLeft: { flexDirection: 'row', alignItems: 'center' },
  themeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  themeLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeSubtitle: {
    ...typography.bodySmall,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  syncButtonText: {
    color: '#fff',
    ...typography.button,
  },
  syncInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  syncInfo: {
    ...typography.bodySmall,
    lineHeight: 20,
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  settingIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingInfo: { flex: 1 },
  settingTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    ...typography.bodySmall,
  },
  aboutCard: {
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  aboutIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.h5,
    marginBottom: spacing.xs,
  },
  version: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  aboutText: {
    ...typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },
  dangerButton: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
  },
  dangerButtonText: {
    ...typography.button,
  },
  signOutButton: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    ...typography.button,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
  },
});
