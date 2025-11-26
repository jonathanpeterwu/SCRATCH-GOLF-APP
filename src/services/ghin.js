import axios from 'axios';

// GHIN API Configuration
// NOTE: You'll need to get an API key from GHIN
// Visit: https://www.ghin.com/api for access
const GHIN_API_BASE = 'https://api.ghin.com/api/v1';
const GHIN_API_KEY = 'YOUR_GHIN_API_KEY'; // Replace with your actual key

export const fetchGhinData = async (ghinNumber) => {
  try {
    // Fetch golfer profile
    const profileResponse = await axios.get(
      `${GHIN_API_BASE}/golfers/${ghinNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${GHIN_API_KEY}`,
        },
      }
    );

    const profile = profileResponse.data;

    // Fetch recent scores
    const scoresResponse = await axios.get(
      `${GHIN_API_BASE}/golfers/${ghinNumber}/scores`,
      {
        headers: {
          'Authorization': `Bearer ${GHIN_API_KEY}`,
        },
      }
    );

    const scores = scoresResponse.data.scores || [];

    return {
      ghinNumber,
      handicapIndex: profile.handicapIndex,
      name: profile.name,
      recentScores: scores,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching GHIN data:', error);
    throw error;
  }
};

export const calculateVarianceAnalysis = (scores, count) => {
  if (!scores || scores.length === 0) {
    return null;
  }

  const recentScores = scores.slice(0, count);
  const differentials = recentScores.map(s => s.differential || 0);

  // Calculate statistics
  const avg = differentials.reduce((sum, val) => sum + val, 0) / differentials.length;
  const min = Math.min(...differentials);
  const max = Math.max(...differentials);
  const range = max - min;

  // Standard deviation
  const squaredDiffs = differentials.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / differentials.length;
  const stdDev = Math.sqrt(variance);

  // Confidence interval (95%)
  const confidenceInterval = 1.96 * stdDev;

  return {
    count: differentials.length,
    average: avg.toFixed(2),
    min: min.toFixed(2),
    max: max.toFixed(2),
    range: range.toFixed(2),
    standardDeviation: stdDev.toFixed(2),
    confidenceInterval: confidenceInterval.toFixed(2),
  };
};

export const calculateStrokesGained = (scores) => {
  if (!scores || scores.length === 0) {
    return null;
  }

  // Calculate average strokes gained for different categories
  const categories = ['offTee', 'approach', 'aroundGreen', 'putting', 'teeToGreen'];
  const sg = {};

  categories.forEach(category => {
    const values = scores
      .map(s => s.strokesGained?.[category])
      .filter(v => v !== undefined && v !== null);

    if (values.length > 0) {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      sg[category] = avg.toFixed(2);
    } else {
      sg[category] = '0.00';
    }
  });

  return sg;
};

// Mock data for testing without GHIN API
export const getMockGhinData = () => {
  return {
    ghinNumber: '1234567',
    handicapIndex: 12.4,
    name: 'Test Golfer',
    recentScores: [
      {
        date: '2024-01-15',
        courseRating: 72.1,
        slopeRating: 131,
        score: 88,
        differential: 12.3,
        strokesGained: {
          offTee: -0.5,
          approach: -1.2,
          aroundGreen: 0.3,
          putting: -0.4,
          teeToGreen: -1.4,
        }
      },
      {
        date: '2024-01-10',
        courseRating: 71.5,
        slopeRating: 128,
        score: 85,
        differential: 11.2,
        strokesGained: {
          offTee: -0.3,
          approach: -1.5,
          aroundGreen: 0.5,
          putting: -0.2,
          teeToGreen: -1.3,
        }
      },
      // ... add more rounds as needed
    ],
    lastUpdate: new Date().toISOString(),
  };
};
