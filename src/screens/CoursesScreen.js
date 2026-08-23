import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { useTheme, shadows, typography, spacing } from '../theme';
import { COURSE_TYPES, COURSE_TYPE_LABELS } from '../data/courses';
import { rankCourses, SORT_OPTIONS } from '../services/rankings';
import { StarDisplay } from '../components/StarRating';
import CourseDetail from '../components/CourseDetail';

const TYPE_FILTERS = [
  COURSE_TYPES.PUBLIC,
  COURSE_TYPES.MUNICIPAL,
  COURSE_TYPES.RESORT,
  COURSE_TYPES.SEMI_PRIVATE,
];

export default function CoursesScreen() {
  const reviews = useAppStore((state) => state.reviews);
  const [query, setQuery] = useState('');
  const [types, setTypes] = useState([]);
  const [sort, setSort] = useState('rank');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const t = useTheme();

  const ranked = useMemo(
    () => rankCourses(reviews, { query, types, sort }),
    [reviews, query, types, sort]
  );

  const toggleType = (type) =>
    setTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );

  if (selectedCourseId) {
    return <CourseDetail courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.searchRow, { borderBottomColor: t.border }]}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: t.inputBackground, borderColor: t.inputBorder },
          ]}
        >
          <Ionicons name="search" size={18} color={t.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: t.inputText }]}
            placeholder="Course, city, or architect"
            placeholderTextColor={t.placeholder}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={t.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterStrip}
        contentContainerStyle={styles.filterStripContent}
      >
        {TYPE_FILTERS.map((type) => {
          const active = types.includes(type);
          return (
            <Chip
              key={type}
              label={COURSE_TYPE_LABELS[type]}
              active={active}
              onPress={() => toggleType(type)}
              theme={t}
            />
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterStrip}
        contentContainerStyle={styles.filterStripContent}
      >
        <Text style={[styles.sortLabel, { color: t.textTertiary }]}>Sort</Text>
        {SORT_OPTIONS.map((option) => (
          <Chip
            key={option.key}
            label={option.label}
            active={sort === option.key}
            onPress={() => setSort(option.key)}
            theme={t}
          />
        ))}
      </ScrollView>

      <FlatList
        data={ranked}
        keyExtractor={(item) => item.course.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.resultCount, { color: t.textSecondary }]}>
            {ranked.length} {ranked.length === 1 ? 'course' : 'courses'} you can book
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="golf-tee" size={40} color={t.textTertiary} />
            <Text style={[styles.emptyText, { color: t.textSecondary }]}>
              No courses match those filters.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <CourseCard
            entry={item}
            theme={t}
            onPress={() => setSelectedCourseId(item.course.id)}
          />
        )}
      />
    </View>
  );
}

function Chip({ label, active, onPress, theme: t }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: active ? t.primary : t.surface,
          borderColor: active ? t.primary : t.border,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? '#fff' : t.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CourseCard({ entry, theme: t, onPress }) {
  const { course, stats, rank } = entry;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, { backgroundColor: t.card, borderColor: t.cardBorder }, shadows.small]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.rankBadge, { backgroundColor: t.primaryLight }]}>
          <Text style={[styles.rankNumber, { color: t.primary }]}>#{rank}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.courseName, { color: t.text }]} numberOfLines={2}>
            {course.name}
          </Text>
          <Text style={[styles.courseLocation, { color: t.textSecondary }]}>
            {course.city}, {course.state} • {COURSE_TYPE_LABELS[course.type]}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={t.textTertiary} />
      </View>

      <View style={styles.ratingRow}>
        <StarDisplay value={stats.userAverage ?? stats.rankedScore} size={14} />
        <Text style={[styles.ratingText, { color: t.textSecondary }]}>
          {stats.reviewCount > 0
            ? `${(stats.userAverage ?? 0).toFixed(1)} • ${stats.reviewCount} ${
                stats.reviewCount === 1 ? 'review' : 'reviews'
              }`
            : 'No reviews yet'}
        </Text>
      </View>

      <View style={[styles.statRow, { borderTopColor: t.borderLight }]}>
        <Stat label="Par" value={course.par} theme={t} />
        <Stat label="Yards" value={course.yardage.toLocaleString()} theme={t} />
        <Stat label="Slope" value={course.slopeRating} theme={t} />
        <Stat label="From" value={`$${course.teeSheet.weekdayFee}`} theme={t} highlight />
      </View>
    </TouchableOpacity>
  );
}

function Stat({ label, value, theme: t, highlight }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: highlight ? t.primary : t.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textTertiary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: { flex: 1, ...typography.body, paddingVertical: 0 },
  // Horizontal strips need a fixed height, otherwise they collapse onto each
  // other on web where the scroll content does not drive the parent's height.
  filterStrip: { flexGrow: 0, flexShrink: 0, height: 48 },
  filterStripContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  sortLabel: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 2 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { ...typography.bodySmall, fontWeight: '600' },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  resultCount: { ...typography.bodySmall, marginBottom: spacing.xs },
  card: { borderRadius: 12, borderWidth: 1, padding: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  rankBadge: {
    minWidth: 40,
    paddingHorizontal: 6,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: { ...typography.bodySmall, fontWeight: '700' },
  cardHeaderText: { flex: 1 },
  courseName: { ...typography.h6, marginBottom: 2 },
  courseLocation: { ...typography.bodySmall },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ratingText: { ...typography.caption },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { ...typography.bodySmall, fontWeight: '700' },
  statLabel: { ...typography.caption, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { ...typography.bodySmall },
});
