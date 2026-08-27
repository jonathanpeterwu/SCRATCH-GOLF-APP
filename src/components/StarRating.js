import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography } from '../theme';

const STARS = [1, 2, 3, 4, 5];

/**
 * Read-only star display. Renders half stars, so 4.3 shows as 4 filled and a half.
 */
export function StarDisplay({ value, size = 14, showValue = false, color }) {
  const t = useTheme();
  const tint = color || t.accent;
  const rating = typeof value === 'number' ? value : 0;

  return (
    <View style={styles.row}>
      {STARS.map((star) => {
        const name =
          rating >= star ? 'star' : rating >= star - 0.5 ? 'star-half' : 'star-outline';
        return (
          <Ionicons
            key={star}
            name={name}
            size={size}
            color={rating > 0 ? tint : t.textTertiary}
            style={styles.star}
          />
        );
      })}
      {showValue && (
        <Text style={[styles.value, { color: t.textSecondary, fontSize: size - 1 }]}>
          {typeof value === 'number' ? value.toFixed(1) : 'Not rated'}
        </Text>
      )}
    </View>
  );
}

/** Tappable stars. Tapping the star that is already selected clears the rating. */
export function StarInput({ value = 0, onChange, size = 28 }) {
  const t = useTheme();

  return (
    <View style={styles.row}>
      {STARS.map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(value === star ? 0 : star)}
          activeOpacity={0.7}
          style={styles.tapTarget}
          accessibilityRole="button"
          accessibilityLabel={`${star} ${star === 1 ? 'star' : 'stars'}`}
        >
          <Ionicons
            name={value >= star ? 'star' : 'star-outline'}
            size={size}
            color={value >= star ? t.accent : t.textTertiary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { marginRight: 1 },
  tapTarget: { paddingHorizontal: 3, paddingVertical: 2 },
  value: { ...typography.caption, marginLeft: 6, fontWeight: '600' },
});
