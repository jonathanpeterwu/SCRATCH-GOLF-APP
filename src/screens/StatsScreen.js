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
import { useAppStore } from '../store/appStore';
import { saveToStorage } from '../services/storage';
import {
  fetchGhinData,
  getMockGhinData,
  calculateVarianceAnalysis,
  calculateStrokesGained,
} from '../services/ghin';

export default function StatsScreen() {
  const { ghinData, setGhinData } = useAppStore();
  const [ghinNumber, setGhinNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(20);

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
      // Fallback to mock data for testing
      Alert.alert(
        'Demo Mode',
        'Using demo data for testing. To use real GHIN data, add your API key in ghin.js',
        [
          {
            text: 'OK',
            onPress: async () => {
              const mockData = getMockGhinData();
              setGhinData(mockData);
              await saveToStorage('GHIN_DATA', mockData);
            },
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderVarianceTable = () => {
    if (!ghinData || !ghinData.recentScores) return null;

    const counts = [5, 10, 15, 20];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Variance Analysis</Text>
        <Text style={styles.sectionSubtitle}>
          Score consistency over recent rounds
        </Text>

        {counts.map(count => {
          const analysis = calculateVarianceAnalysis(ghinData.recentScores, count);
          if (!analysis) return null;

          return (
            <TouchableOpacity
              key={count}
              style={[
                styles.varianceCard,
                selectedCount === count && styles.varianceCardSelected,
              ]}
              onPress={() => setSelectedCount(count)}
            >
              <View style={styles.varianceHeader}>
                <Text style={styles.varianceTitle}>Last {count} Rounds</Text>
                {selectedCount === count && (
                  <Text style={styles.selectedBadge}>✓</Text>
                )}
              </View>

              <View style={styles.varianceStats}>
                <StatItem label="Average" value={analysis.average} />
                <StatItem label="Range" value={analysis.range} />
                <StatItem label="Std Dev" value={analysis.standardDeviation} />
              </View>

              <Text style={styles.varianceDetail}>
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
      { key: 'offTee', label: 'Off-the-Tee', emoji: '🏌️' },
      { key: 'approach', label: 'Approach', emoji: '🎯' },
      { key: 'aroundGreen', label: 'Around Green', emoji: '⛳' },
      { key: 'putting', label: 'Putting', emoji: '⛳' },
      { key: 'teeToGreen', label: 'Tee-to-Green', emoji: '🏌️' },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strokes Gained</Text>
        <Text style={styles.sectionSubtitle}>
          Performance vs. scratch golfer (per round)
        </Text>

        {categories.map(({ key, label, emoji }) => {
          const value = parseFloat(sg[key]);
          const isPositive = value > 0;
          const isNeutral = value >= -0.3 && value <= 0.3;
          const color = isPositive ? '#2e7d32' : isNeutral ? '#ed6c02' : '#d32f2f';
          const indicator = isPositive ? '🟢' : isNeutral ? '🟡' : '🔴';

          return (
            <View key={key} style={styles.sgCard}>
              <View style={styles.sgHeader}>
                <Text style={styles.sgEmoji}>{emoji}</Text>
                <Text style={styles.sgLabel}>{label}</Text>
              </View>

              <View style={styles.sgValueContainer}>
                <Text style={[styles.sgValue, { color }]}>
                  {value >= 0 ? '+' : ''}{value.toFixed(2)}
                </Text>
                <Text style={styles.sgIndicator}>{indicator}</Text>
              </View>

              <Text style={styles.sgDescription}>
                {getSGDescription(key, value)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const getSGDescription = (category, value) => {
    const absValue = Math.abs(value);

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

    // teeToGreen
    if (value > 1) return 'Excellent ball-striking';
    if (value > 0) return 'Good overall play';
    if (value > -1) return 'Some areas need work';
    return 'Multiple areas for improvement';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Golf Stats</Text>
        <Text style={styles.subtitle}>
          Connect GHIN to analyze your performance
        </Text>
      </View>

      {!ghinData ? (
        /* GHIN Connection */
        <View style={styles.connectSection}>
          <Text style={styles.connectTitle}>Connect Your GHIN</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter GHIN number"
            value={ghinNumber}
            onChangeText={setGhinNumber}
            keyboardType="number-pad"
            maxLength={8}
          />

          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleFetchGhin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.connectButtonText}>Connect GHIN</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Your GHIN number can be found on the GHIN app or website
          </Text>
        </View>
      ) : (
        /* Stats Display */
        <>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View>
                <Text style={styles.profileName}>{ghinData.name}</Text>
                <Text style={styles.profileGhin}>GHIN: {ghinData.ghinNumber}</Text>
              </View>
              <View style={styles.handicapBadge}>
                <Text style={styles.handicapValue}>{ghinData.handicapIndex}</Text>
                <Text style={styles.handicapLabel}>Index</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleFetchGhin}
            >
              <Text style={styles.refreshButtonText}>🔄 Refresh Data</Text>
            </TouchableOpacity>
          </View>

          {/* Variance Analysis */}
          {renderVarianceTable()}

          {/* Strokes Gained */}
          {renderStrokesGained()}

          {/* Recent Rounds */}
          {ghinData.recentScores && ghinData.recentScores.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Rounds</Text>
              {ghinData.recentScores.slice(0, 10).map((score, index) => (
                <View key={index} style={styles.roundCard}>
                  <View style={styles.roundHeader}>
                    <Text style={styles.roundDate}>{score.date}</Text>
                    <Text style={styles.roundScore}>{score.score}</Text>
                  </View>
                  <Text style={styles.roundDetails}>
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

function StatItem({ label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  connectSection: {
    margin: 20,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  connectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  profileCard: {
    margin: 20,
    marginBottom: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileGhin: {
    fontSize: 14,
    color: '#666',
  },
  handicapBadge: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  handicapValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  handicapLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  refreshButton: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  varianceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  varianceCardSelected: {
    borderColor: '#2e7d32',
    backgroundColor: '#f1f8f4',
  },
  varianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  varianceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedBadge: {
    fontSize: 16,
    color: '#2e7d32',
  },
  varianceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  varianceDetail: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  sgCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sgEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  sgLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  sgValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sgValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 8,
  },
  sgIndicator: {
    fontSize: 20,
  },
  sgDescription: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  roundCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roundDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  roundScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  roundDetails: {
    fontSize: 12,
    color: '#666',
  },
});
