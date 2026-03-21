import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { saveToStorage } from '../services/storage';
import {
  fetchGhinData,
  getMockGhinData,
  calculateVarianceAnalysis,
  calculateStrokesGained,
} from '../services/ghin';
import { useTheme, shadows, typography, spacing } from '../theme';

export default function StatsScreen() {
  const { ghinData, setGhinData } = useAppStore();
  const [ghinNumber, setGhinNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(20);
  const t = useTheme();

  const handleFetchGhin = async () => {
    if (!ghinNumber || ghinNumber.length < 6) {
      Alert.alert('Invalid GHIN', 'Please enter a valid GHIN number');
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchGhinData(ghinNumber);
      setGhinData(data);
      await saveToStorage('GHIN_DATA', data);
    } catch (error) {
      Alert.alert('Demo Mode', 'Using demo data for testing. To use real GHIN data, add your API key in ghin.js', [{
        text: 'OK',
        onPress: async () => {
          const mockData = getMockGhinData();
          setGhinData(mockData);
          await saveToStorage('GHIN_DATA', mockData);
        },
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVarianceTable = () => {
    if (!ghinData || !ghinData.recentScores) return null;
    const counts = [5, 10, 15, 20];

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Variance Analysis</Text>
        <Text style={[styles.sectionSubtitle, { color: t.textSecondary }]}>
          Score consistency over recent rounds
        </Text>

        {counts.map(count => {
          const analysis = calculateVarianceAnalysis(ghinData.recentScores, count);
          if (!analysis) return null;

          return (
            <TouchableOpacity key={count}
              style={[styles.varianceCard, { backgroundColor: t.card, borderColor: t.border },
                selectedCount === count && { borderColor: t.primary, backgroundColor: t.cardSelected }]}
              onPress={() => setSelectedCount(count)}>
              <View style={styles.varianceHeader}>
                <Text style={[styles.varianceTitle, { color: t.text }]}>Last {count} Rounds</Text>
                {selectedCount === count && <Text style={[styles.selectedBadge, { color: t.primary }]}>✓</Text>}
              </View>
              <View style={styles.varianceStats}>
                <StatItem label="Average" value={analysis.average} theme={t} />
                <StatItem label="Range" value={analysis.range} theme={t} />
                <StatItem label="Std Dev" value={analysis.standardDeviation} theme={t} />
              </View>
              <Text style={[styles.varianceDetail, { color: t.textTertiary }]}>
                Min: {analysis.min} | Max: {analysis.max}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderStrokesGained = () => {
    if (!ghinData || !ghinData.recentScores) return null;
    const sg = calculateStrokesGained(ghinData.recentScores);
    if (!sg) return null;

    const categories = [
      { key: 'offTee', label: 'Off-the-Tee', icon: 'golf-tee', iconColor: '#E53935' },
      { key: 'approach', label: 'Approach', icon: 'target', iconColor: '#2196F3' },
      { key: 'aroundGreen', label: 'Around Green', icon: 'golf', iconColor: '#4CAF50' },
      { key: 'putting', label: 'Putting', icon: 'golf', iconColor: '#9C27B0' },
      { key: 'teeToGreen', label: 'Tee-to-Green', icon: 'golf-tee', iconColor: '#FF9800' },
    ];

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>Strokes Gained</Text>
        <Text style={[styles.sectionSubtitle, { color: t.textSecondary }]}>
          Performance vs. scratch golfer (per round)
        </Text>

        {categories.map(({ key, label, icon, iconColor }) => {
          const value = parseFloat(sg[key]);
          const isPositive = value > 0;
          const isNeutral = value >= -0.3 && value <= 0.3;
          const color = isPositive ? t.success : isNeutral ? t.warning : t.error;

          return (
            <View key={key} style={[styles.sgCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadows.small]}>
              <View style={styles.sgHeader}>
                <View style={[styles.sgIconCircle, { backgroundColor: iconColor + '20' }]}>
                  <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
                </View>
                <Text style={[styles.sgLabel, { color: t.text }]}>{label}</Text>
              </View>
              <View style={styles.sgValueContainer}>
                <Text style={[styles.sgValue, { color }]}>
                  {value >= 0 ? '+' : ''}{value.toFixed(2)}
                </Text>
                <View style={[styles.sgIndicatorCircle, { backgroundColor: color + '30' }]}>
                  <View style={[styles.sgIndicatorDot, { backgroundColor: color }]} />
                </View>
              </View>
              <Text style={[styles.sgDescription, { color: t.textSecondary }]}>
                {getSGDescription(key, value)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const getSGDescription = (category, value) => {
    if (category === 'offTee') {
      if (value > 0.5) return 'Excellent driving - a major strength';
      if (value > 0) return 'Solid driving performance';
      if (value > -0.5) return 'Driving is neutral, minor improvements possible';
      return 'Focus on driving accuracy and distance';
    }
    if (category === 'approach') {
      if (value > 0.5) return 'Elite iron play';
      if (value > 0) return 'Good GIR performance';
      if (value > -0.5) return 'Improve distance control and accuracy';
      return 'Major scoring opportunity - prioritize iron practice';
    }
    if (category === 'aroundGreen') {
      if (value > 0.5) return 'Outstanding short game';
      if (value > 0) return 'Strong scrambling ability';
      if (value > -0.5) return 'Short game needs minor refinement';
      return 'Work on chipping and bunker play';
    }
    if (category === 'putting') {
      if (value > 0.5) return 'Exceptional putting';
      if (value > 0) return 'Solid putting performance';
      if (value > -0.5) return 'Putting is average, room for improvement';
      return 'Focus on lag putting and short putts';
    }
    if (value > 1) return 'Excellent ball-striking';
    if (value > 0) return 'Good overall play';
    if (value > -1) return 'Some areas need work';
    return 'Multiple areas for improvement';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <Text style={[styles.title, { color: t.primary }]}>Golf Stats</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          Connect GHIN to analyze your performance
        </Text>
      </View>

      {!ghinData ? (
        <View style={[styles.connectSection, { backgroundColor: t.card }]}>
          <Text style={[styles.connectTitle, { color: t.text }]}>Connect Your GHIN</Text>
          <TextInput
            style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBackground, color: t.inputText }]}
            placeholder="Enter GHIN number" placeholderTextColor={t.placeholder}
            value={ghinNumber} onChangeText={setGhinNumber}
            keyboardType="number-pad" maxLength={8} />
          <TouchableOpacity style={[styles.connectButton, { backgroundColor: t.primary }]}
            onPress={handleFetchGhin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> :
              <Text style={styles.connectButtonText}>Connect GHIN</Text>}
          </TouchableOpacity>
          <Text style={[styles.helpText, { color: t.textTertiary }]}>
            Your GHIN number can be found on the GHIN app or website
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.profileCard, { backgroundColor: t.card }]}>
            <View style={styles.profileHeader}>
              <View>
                <Text style={[styles.profileName, { color: t.text }]}>{ghinData.name}</Text>
                <Text style={[styles.profileGhin, { color: t.textSecondary }]}>GHIN: {ghinData.ghinNumber}</Text>
              </View>
              <View style={[styles.handicapBadge, { backgroundColor: t.primary }]}>
                <Text style={styles.handicapValue}>{ghinData.handicapIndex}</Text>
                <Text style={styles.handicapLabel}>Index</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.refreshButton, { backgroundColor: t.surfaceAlt }]}
              onPress={handleFetchGhin}>
              <Text style={[styles.refreshButtonText, { color: t.textSecondary }]}>🔄 Refresh Data</Text>
            </TouchableOpacity>
          </View>

          {renderVarianceTable()}
          {renderStrokesGained()}

          {ghinData.recentScores && ghinData.recentScores.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: t.text }]}>Recent Rounds</Text>
              {ghinData.recentScores.slice(0, 10).map((score, index) => (
                <View key={index} style={[styles.roundCard, { backgroundColor: t.card }]}>
                  <View style={styles.roundHeader}>
                    <Text style={[styles.roundDate, { color: t.text }]}>{score.date}</Text>
                    <Text style={[styles.roundScore, { color: t.primary }]}>{score.score}</Text>
                  </View>
                  <Text style={[styles.roundDetails, { color: t.textSecondary }]}>
                    CR: {score.courseRating} | Slope: {score.slopeRating} | Diff: {score.differential}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function StatItem({ label, value, theme: t }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: t.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  connectSection: { margin: 20, padding: 24, borderRadius: 12 },
  connectTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16 },
  connectButton: { padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  connectButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  helpText: { fontSize: 12, textAlign: 'center' },
  profileCard: { margin: 20, marginBottom: 0, padding: 20, borderRadius: 12 },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  profileName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  profileGhin: { fontSize: 14 },
  handicapBadge: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  handicapValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  handicapLabel: { fontSize: 12, color: '#fff', opacity: 0.9 },
  refreshButton: { padding: 12, borderRadius: 6, alignItems: 'center' },
  refreshButtonText: { fontSize: 14, fontWeight: '600' },
  section: { margin: 20, marginBottom: 0 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, marginBottom: 16 },
  varianceCard: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 2 },
  varianceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  varianceTitle: { fontSize: 16, fontWeight: 'bold' },
  selectedBadge: { fontSize: 16 },
  varianceStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  varianceDetail: { fontSize: 12, textAlign: 'center' },
  sgCard: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  sgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sgIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  sgLabel: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  sgValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sgValue: {
    ...typography.h2,
    marginRight: spacing.sm,
  },
  sgIndicatorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sgIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sgDescription: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
  roundCard: { padding: 16, borderRadius: 8, marginBottom: 8 },
  roundHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roundDate: { fontSize: 14, fontWeight: '600' },
  roundScore: { fontSize: 24, fontWeight: 'bold' },
  roundDetails: { fontSize: 12 },
});
