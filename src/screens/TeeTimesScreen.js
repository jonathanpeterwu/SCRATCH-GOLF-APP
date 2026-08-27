import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { useTheme, shadows, typography, spacing } from '../theme';
import { getCourseById, formatFee } from '../data/courses';
import {
  BOOKING_STATUS,
  cancelBooking,
  formatDateLabel,
  splitBookings,
} from '../services/teeTimes';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'history', label: 'Past' },
];

export default function TeeTimesScreen() {
  const t = useTheme();
  const user = useAppStore((state) => state.user);
  const bookings = useAppStore((state) => state.bookings);
  const replaceBooking = useAppStore((state) => state.replaceBooking);
  const [tab, setTab] = useState('upcoming');

  const { upcoming, history } = useMemo(() => splitBookings(bookings), [bookings]);
  const visible = tab === 'upcoming' ? upcoming : history;

  const confirmCancel = (booking) => {
    Alert.alert(
      'Cancel tee time',
      `${booking.courseName}\n${formatDateLabel(booking.date)} at ${booking.teeTime}`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await cancelBooking(booking.id, user?.id);
              if (updated) replaceBooking(updated);
            } catch (error) {
              Alert.alert('Could not cancel', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.tabRow, { borderBottomColor: t.border }]}>
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          const count = key === 'upcoming' ? upcoming.length : history.length;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setTab(key)}
              activeOpacity={0.7}
              style={[styles.tab, active && { borderBottomColor: t.primary, borderBottomWidth: 2 }]}
            >
              <Text style={[styles.tabText, { color: active ? t.primary : t.textSecondary }]}>
                {label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="calendar-blank" size={44} color={t.textTertiary} />
            <Text style={[styles.emptyTitle, { color: t.text }]}>
              {tab === 'upcoming' ? 'No tee times booked' : 'Nothing here yet'}
            </Text>
            <Text style={[styles.emptyText, { color: t.textSecondary }]}>
              {tab === 'upcoming'
                ? 'Find a course in the Courses tab and grab a time.'
                : 'Rounds you play or cancel will show up here.'}
            </Text>
          </View>
        ) : (
          visible.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              theme={t}
              onCancel={tab === 'upcoming' ? () => confirmCancel(booking) : null}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function BookingCard({ booking, theme: t, onCancel }) {
  const course = getCourseById(booking.courseId);
  const cancelled = booking.status === BOOKING_STATUS.CANCELLED;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.card, borderColor: cancelled ? t.border : t.primary },
        shadows.small,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.courseName, { color: t.text }]} numberOfLines={2}>
            {booking.courseName}
          </Text>
          {course && (
            <Text style={[styles.location, { color: t.textSecondary }]}>
              {course.city}, {course.state}
            </Text>
          )}
        </View>
        {cancelled && (
          <View style={[styles.statusPill, { backgroundColor: t.surfaceAlt }]}>
            <Text style={[styles.statusText, { color: t.textSecondary }]}>Cancelled</Text>
          </View>
        )}
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={16} color={t.textSecondary} />
        <Text style={[styles.detailText, { color: t.textSecondary }]}>
          {formatDateLabel(booking.date)} at {booking.teeTime}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="people-outline" size={16} color={t.textSecondary} />
        <Text style={[styles.detailText, { color: t.textSecondary }]}>
          {booking.players} {booking.players === 1 ? 'player' : 'players'}
          {booking.cart ? ' • cart included' : ''} •{' '}
          {formatFee(booking.total, course?.currency)}
        </Text>
      </View>
      {!!booking.notes && (
        <View style={styles.detailRow}>
          <Ionicons name="document-text-outline" size={16} color={t.textSecondary} />
          <Text style={[styles.detailText, { color: t.textSecondary }]}>{booking.notes}</Text>
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: t.borderLight }]}>
        <View>
          <Text style={[styles.codeLabel, { color: t.textTertiary }]}>Confirmation</Text>
          <Text style={[styles.code, { color: t.text }]}>{booking.confirmationCode}</Text>
        </View>
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.7}
            style={[styles.cancelButton, { borderColor: t.dangerBorder }]}
          >
            <Text style={[styles.cancelText, { color: t.dangerText }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabText: { ...typography.bodySmall, fontWeight: '600' },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { borderRadius: 12, borderWidth: 1, padding: spacing.md, gap: spacing.xs },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardHeaderText: { flex: 1 },
  courseName: { ...typography.h6 },
  location: { ...typography.caption, marginTop: 2 },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 10 },
  statusText: { ...typography.caption, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  detailText: { ...typography.bodySmall, flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  codeLabel: { ...typography.caption },
  code: { ...typography.h6, letterSpacing: 2 },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelText: { ...typography.bodySmall, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...typography.h5 },
  emptyText: { ...typography.bodySmall, textAlign: 'center', paddingHorizontal: spacing.lg },
});
