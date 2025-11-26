import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { signOut } from '../services/auth';
import { syncToCloud, clearAllStorage } from '../services/storage';

export default function ProfileScreen() {
  const { user, golfBag, ghinData, setUser, setGolfBag, setGhinData, clearChat } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);

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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data is saved in iCloud.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              setUser(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all local and iCloud data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllStorage();
              setUser(null);
              setGolfBag({
                driver: null,
                woods: [],
                hybrids: [],
                irons: [],
                wedges: [],
                putter: null,
              });
              setGhinData(null);
              clearChat();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
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
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>🏌️</Text>
        </View>
        <Text style={styles.name}>
          {user?.fullName?.givenName || 'Golfer'} {user?.fullName?.familyName || ''}
        </Text>
        {user?.email && (
          <Text style={styles.email}>{user.email}</Text>
        )}
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="⛳"
          value={getClubCount()}
          label="Clubs in Bag"
        />
        <StatCard
          icon="📊"
          value={ghinData?.handicapIndex?.toFixed(1) || '--'}
          label="Handicap Index"
        />
        <StatCard
          icon="🏌️"
          value={ghinData?.recentScores?.length || 0}
          label="Rounds Tracked"
        />
      </View>

      {/* iCloud Sync */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>iCloud Sync</Text>

        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.syncIcon}>☁️</Text>
              <Text style={styles.syncButtonText}>Sync to iCloud Now</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.syncInfo}>
          ✓ Automatic sync enabled{'\n'}
          Your golf bag, chat history, and stats are backed up to iCloud
        </Text>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <SettingItem
          icon="🏌️"
          title="Golf Bag"
          subtitle={`${getClubCount()} clubs`}
          onPress={() => {}}
        />

        <SettingItem
          icon="📊"
          title="GHIN Stats"
          subtitle={ghinData ? `Index: ${ghinData.handicapIndex}` : 'Not connected'}
          onPress={() => {}}
        />

        <SettingItem
          icon="💬"
          title="Chat History"
          subtitle="Saved conversations with your coach"
          onPress={() => {}}
        />
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.aboutCard}>
          <Text style={styles.appIcon}>⛳</Text>
          <Text style={styles.appName}>Golf Coach</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.aboutText}>
            Your AI-powered golf assistant with personalized coaching,
            practice plans, and performance analytics.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleClearData}
        >
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ for golfers
        </Text>
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingItem({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.settingChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    fontSize: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  syncButton: {
    backgroundColor: '#2e7d32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  syncIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncInfo: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  settingChevron: {
    fontSize: 32,
    color: '#ccc',
  },
  aboutCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  appIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#d32f2f',
  },
  dangerButtonText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
