import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { useTheme, shadows, typography, spacing } from '../theme';
import { getCourseById, COURSE_TYPE_LABELS } from '../data/courses';
import { RATING_CATEGORIES, getCourseRanking, reviewOverall } from '../services/rankings';
import { deleteReview, saveReview } from '../services/reviews';
import {
  MAX_PLAYERS_PER_SLOT,
  bookableDates,
  bookTeeTime,
  formatDateLabel,
  getTeeSheet,
  todayKey,
} from '../services/teeTimes';
import { StarDisplay, StarInput } from './StarRating';

const emptyRatings = () =>
  RATING_CATEGORIES.reduce((acc, { key }) => ({ ...acc, [key]: 0 }), {});

export default function CourseDetail({ courseId, onBack }) {
  const t = useTheme();
  const user = useAppStore((state) => state.user);
  const reviews = useAppStore((state) => state.reviews);
  const bookings = useAppStore((state) => state.bookings);
  const upsertReview = useAppStore((state) => state.upsertReview);
  const removeReview = useAppStore((state) => state.removeReview);
  const addBooking = useAppStore((state) => state.addBooking);

  const [dateKey, setDateKey] = useState(todayKey());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [players, setPlayers] = useState(2);
  const [wantsCart, setWantsCart] = useState(false);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);

  const [rateVisible, setRateVisible] = useState(false);
  const [ratings, setRatings] = useState(emptyRatings());
  const [comment, setComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const course = getCourseById(courseId);
  const dates = useMemo(() => bookableDates(), []);
  const ranking = useMemo(() => getCourseRanking(courseId, reviews), [courseId, reviews]);
  const courseReviews = useMemo(
    () => reviews.filter((review) => review.courseId === courseId),
    [reviews, courseId]
  );
  // The private db only holds this golfer's reviews, so their review for this
  // course is simply the first (and only) one.
  const myReview = courseReviews[0] || null;
  const teeSheet = useMemo(
    () => getTeeSheet(courseId, dateKey, bookings),
    [courseId, dateKey, bookings]
  );

  if (!course || !ranking) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: t.background }]}>
        <Text style={[styles.emptyText, { color: t.textSecondary }]}>Course not found.</Text>
        <TouchableOpacity onPress={onBack} style={[styles.button, { backgroundColor: t.primary }]}>
          <Text style={styles.buttonText}>Back to rankings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { stats } = ranking;
  const openBooking = (slot) => {
    setSelectedSlot(slot);
    setPlayers(Math.min(2, slot.spotsAvailable));
    setWantsCart(false);
    setNotes('');
  };

  const bookingTotal = selectedSlot
    ? selectedSlot.pricePerPlayer * players + (wantsCart ? selectedSlot.cartFee * players : 0)
    : 0;

  const confirmBooking = async () => {
    if (!selectedSlot || booking) return;
    setBooking(true);
    try {
      const saved = await bookTeeTime({
        slot: selectedSlot,
        players,
        cart: wantsCart,
        notes,
        userId: user?.id,
      });
      addBooking(saved);
      setSelectedSlot(null);
      Alert.alert(
        'Tee time booked',
        `${course.name}\n${formatDateLabel(saved.date)} at ${saved.teeTime}\n` +
          `${saved.players} ${saved.players === 1 ? 'player' : 'players'} • $${saved.total}\n\n` +
          `Confirmation ${saved.confirmationCode}`
      );
    } catch (error) {
      Alert.alert('Could not book', error.message);
    } finally {
      setBooking(false);
    }
  };

  const openRating = () => {
    setRatings(myReview ? { ...emptyRatings(), ...myReview.ratings } : emptyRatings());
    setComment(myReview?.comment || '');
    setRateVisible(true);
  };

  const confirmRemoveReview = () => {
    if (!myReview) return;
    Alert.alert('Remove rating', `Delete your rating for ${course.name}?`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReview(myReview.id, user?.id);
            removeReview(myReview.id);
            setRateVisible(false);
          } catch (error) {
            Alert.alert('Could not remove rating', error.message);
          }
        },
      },
    ]);
  };

  const submitReview = async () => {
    if (savingReview) return;
    setSavingReview(true);
    try {
      const saved = await saveReview({
        courseId,
        ratings,
        comment,
        playedOn: todayKey(),
        userId: user?.id,
      });
      upsertReview(saved);
      setRateVisible(false);
    } catch (error) {
      Alert.alert('Could not save rating', error.message);
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.navBar, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={t.primary} />
          <Text style={[styles.backText, { color: t.primary }]}>Rankings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.rankPill, { backgroundColor: t.primaryLight }]}>
            <Text style={[styles.rankPillText, { color: t.primary }]}>
              #{ranking.rank} of {ranking.total}
            </Text>
          </View>
          <Text style={[styles.title, { color: t.text }]}>{course.name}</Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            {course.city}, {course.state} • {COURSE_TYPE_LABELS[course.type]} • {course.designer},{' '}
            {course.yearOpened}
          </Text>
          <View style={styles.headerRating}>
            <StarDisplay value={stats.userAverage ?? stats.rankedScore} size={16} />
            <Text style={[styles.headerRatingText, { color: t.textSecondary }]}>
              {stats.reviewCount > 0
                ? `${(stats.userAverage ?? 0).toFixed(1)} from ${stats.reviewCount} ${
                    stats.reviewCount === 1 ? 'review' : 'reviews'
                  }`
                : 'Not rated yet'}
            </Text>
          </View>
          <Text style={[styles.blurb, { color: t.textSecondary }]}>{course.blurb}</Text>
          <View style={styles.tagRow}>
            {course.highlights.map((highlight) => (
              <View key={highlight} style={[styles.tag, { backgroundColor: t.surfaceAlt }]}>
                <Text style={[styles.tagText, { color: t.textSecondary }]}>{highlight}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Scorecard */}
        <Section title="Scorecard" theme={t}>
          <View style={styles.scorecard}>
            <ScoreStat label="Holes" value={course.holes} theme={t} />
            <ScoreStat label="Par" value={course.par} theme={t} />
            <ScoreStat label="Yards" value={course.yardage.toLocaleString()} theme={t} />
            <ScoreStat label="Rating" value={course.courseRating.toFixed(1)} theme={t} />
            <ScoreStat label="Slope" value={course.slopeRating} theme={t} />
          </View>
          {course.walkingOnly && (
            <View style={styles.noteRow}>
              <MaterialCommunityIcons name="walk" size={16} color={t.warning} />
              <Text style={[styles.noteText, { color: t.textSecondary }]}>
                Walking only - no carts available.
              </Text>
            </View>
          )}
        </Section>

        {/* Ranking breakdown */}
        <Section
          title="How golfers rate it"
          theme={t}
          action={
            <TouchableOpacity onPress={openRating} activeOpacity={0.7}>
              <Text style={[styles.actionText, { color: t.primary }]}>
                {myReview ? 'Edit my rating' : 'Rate this course'}
              </Text>
            </TouchableOpacity>
          }
        >
          {RATING_CATEGORIES.map(({ key, label }) => {
            const value = stats.categoryAverages[key];
            return (
              <View key={key} style={styles.categoryRow}>
                <Text style={[styles.categoryLabel, { color: t.textSecondary }]}>{label}</Text>
                <View style={[styles.barTrack, { backgroundColor: t.surfaceAlt }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: value ? t.primary : 'transparent',
                        width: `${((value || 0) / 5) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.categoryValue, { color: t.text }]}>
                  {value ? value.toFixed(1) : '-'}
                </Text>
              </View>
            );
          })}
          {!stats.isEstablished && (
            <Text style={[styles.noteText, { color: t.textTertiary, marginTop: spacing.sm }]}>
              Ranking is weighted toward the editorial score until this course has three reviews.
            </Text>
          )}
        </Section>

        {/* Reviews */}
        {courseReviews.length > 0 && (
          <Section title="Reviews" theme={t}>
            {courseReviews.map((review) => (
              <View key={review.id} style={[styles.review, { borderTopColor: t.borderLight }]}>
                <View style={styles.reviewHeader}>
                  <StarDisplay value={reviewOverall(review) ?? 0} size={13} />
                  <Text style={[styles.reviewDate, { color: t.textTertiary }]}>
                    {review.playedOn ? formatDateLabel(review.playedOn) : ''}
                  </Text>
                </View>
                {!!review.comment && (
                  <Text style={[styles.reviewComment, { color: t.textSecondary }]}>
                    {review.comment}
                  </Text>
                )}
              </View>
            ))}
          </Section>
        )}

        {/* Tee sheet */}
        <Section title="Book a tee time" theme={t}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
          >
            {dates.map((date) => {
              const active = date.key === dateKey;
              return (
                <TouchableOpacity
                  key={date.key}
                  onPress={() => setDateKey(date.key)}
                  activeOpacity={0.8}
                  style={[
                    styles.dateChip,
                    {
                      backgroundColor: active ? t.primary : t.surface,
                      borderColor: active ? t.primary : t.border,
                    },
                  ]}
                >
                  <Text style={[styles.dateWeekday, { color: active ? '#fff' : t.textTertiary }]}>
                    {date.isToday ? 'Today' : date.weekday}
                  </Text>
                  <Text style={[styles.dateDay, { color: active ? '#fff' : t.text }]}>
                    {date.day}
                  </Text>
                  <Text style={[styles.dateMonth, { color: active ? '#fff' : t.textTertiary }]}>
                    {date.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.sheetHeading, { color: t.textSecondary }]}>
            {formatDateLabel(dateKey)}
          </Text>

          {teeSheet.filter((slot) => !slot.isPast).length === 0 ? (
            <Text style={[styles.noteText, { color: t.textTertiary }]}>
              No tee times left today. Try tomorrow.
            </Text>
          ) : (
            teeSheet
              .filter((slot) => !slot.isPast)
              .map((slot) => (
                <TeeTimeRow
                  key={slot.id}
                  slot={slot}
                  theme={t}
                  onPress={() => openBooking(slot)}
                />
              ))
          )}
        </Section>
      </ScrollView>

      {/* Booking modal */}
      <Modal
        visible={!!selectedSlot}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSlot(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: t.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: t.modalBackground }, shadows.large]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Confirm tee time</Text>
            {selectedSlot && (
              <>
                <Text style={[styles.modalSubtitle, { color: t.textSecondary }]}>
                  {course.name}
                  {'\n'}
                  {formatDateLabel(selectedSlot.date)} at {selectedSlot.time}
                </Text>

                <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Players</Text>
                <View style={styles.playerRow}>
                  {Array.from({ length: MAX_PLAYERS_PER_SLOT }, (_, index) => index + 1).map(
                    (count) => {
                      const disabled = count > selectedSlot.spotsAvailable;
                      const active = players === count;
                      return (
                        <TouchableOpacity
                          key={count}
                          disabled={disabled}
                          onPress={() => setPlayers(count)}
                          activeOpacity={0.8}
                          style={[
                            styles.playerChip,
                            {
                              backgroundColor: active ? t.primary : t.surface,
                              borderColor: active ? t.primary : t.border,
                              opacity: disabled ? 0.35 : 1,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.playerChipText, { color: active ? '#fff' : t.text }]}
                          >
                            {count}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                {selectedSlot.cartFee > 0 && (
                  <TouchableOpacity
                    style={[styles.cartRow, { borderColor: t.border }]}
                    onPress={() => setWantsCart((current) => !current)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={wantsCart ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={wantsCart ? t.primary : t.textTertiary}
                    />
                    <Text style={[styles.cartText, { color: t.text }]}>
                      Add cart (${selectedSlot.cartFee} per player)
                    </Text>
                  </TouchableOpacity>
                )}

                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: t.inputBorder,
                      backgroundColor: t.inputBackground,
                      color: t.inputText,
                    },
                  ]}
                  placeholder="Notes for the pro shop (optional)"
                  placeholderTextColor={t.placeholder}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />

                <View style={[styles.totalRow, { borderTopColor: t.borderLight }]}>
                  <Text style={[styles.totalLabel, { color: t.textSecondary }]}>
                    ${selectedSlot.pricePerPlayer} x {players}
                    {wantsCart ? ` + cart` : ''}
                  </Text>
                  <Text style={[styles.totalValue, { color: t.text }]}>${bookingTotal}</Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: t.cancelButton }]}
                    onPress={() => setSelectedSlot(null)}
                  >
                    <Text style={[styles.buttonText, { color: t.cancelButtonText }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: t.primary }]}
                    onPress={confirmBooking}
                    disabled={booking}
                  >
                    {booking ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Book it</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Rating modal */}
      <Modal
        visible={rateVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRateVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: t.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: t.modalBackground }, shadows.large]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Rate {course.name}</Text>
            <Text style={[styles.modalSubtitle, { color: t.textSecondary }]}>
              Your ratings stay on this device and feed the course ranking.
            </Text>

            <ScrollView style={styles.rateScroll} showsVerticalScrollIndicator={false}>
              {RATING_CATEGORIES.map(({ key, label, hint }) => (
                <View key={key} style={styles.rateRow}>
                  <View style={styles.rateLabels}>
                    <Text style={[styles.rateLabel, { color: t.text }]}>{label}</Text>
                    <Text style={[styles.rateHint, { color: t.textTertiary }]}>{hint}</Text>
                  </View>
                  <StarInput
                    value={ratings[key]}
                    onChange={(value) => setRatings((current) => ({ ...current, [key]: value }))}
                    size={24}
                  />
                </View>
              ))}

              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: t.inputBorder,
                    backgroundColor: t.inputBackground,
                    color: t.inputText,
                    minHeight: 80,
                  },
                ]}
                placeholder="What should other golfers know?"
                placeholderTextColor={t.placeholder}
                value={comment}
                onChangeText={setComment}
                multiline
              />

              {myReview && (
                <TouchableOpacity onPress={confirmRemoveReview} activeOpacity={0.7}>
                  <Text style={[styles.removeRating, { color: t.dangerText }]}>
                    Remove my rating
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: t.cancelButton }]}
                onPress={() => setRateVisible(false)}
              >
                <Text style={[styles.buttonText, { color: t.cancelButtonText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: t.primary }]}
                onPress={submitReview}
                disabled={savingReview}
              >
                {savingReview ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save rating</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TeeTimeRow({ slot, theme: t, onPress }) {
  const soldOut = slot.spotsAvailable === 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={soldOut}
      activeOpacity={0.8}
      style={[
        styles.teeRow,
        {
          backgroundColor: t.surface,
          borderColor: slot.myBooking ? t.primary : t.border,
          opacity: soldOut ? 0.5 : 1,
        },
      ]}
    >
      <View style={styles.teeTimeBlock}>
        <Text style={[styles.teeTime, { color: t.text }]}>{slot.time}</Text>
        <Text style={[styles.teeSpots, { color: soldOut ? t.error : t.textSecondary }]}>
          {soldOut
            ? 'Full'
            : `${slot.spotsAvailable} of ${slot.spotsTotal} open`}
          {slot.myBooking ? ' • booked' : ''}
        </Text>
      </View>
      <Text style={[styles.teePrice, { color: t.primary }]}>${slot.pricePerPlayer}</Text>
      {!soldOut && <Ionicons name="chevron-forward" size={18} color={t.textTertiary} />}
    </TouchableOpacity>
  );
}

function Section({ title, children, action, theme: t }) {
  return (
    <View style={[styles.section, { backgroundColor: t.card, borderColor: t.cardBorder }, shadows.small]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: t.text }]}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function ScoreStat({ label, value, theme: t }) {
  return (
    <View style={styles.scoreStat}>
      <Text style={[styles.scoreValue, { color: t.text }]}>{value}</Text>
      <Text style={[styles.scoreLabel, { color: t.textTertiary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  navBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backText: { ...typography.body, fontWeight: '600' },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { paddingHorizontal: spacing.xs, gap: spacing.xs },
  rankPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankPillText: { ...typography.caption, fontWeight: '700' },
  title: { ...typography.h3 },
  subtitle: { ...typography.bodySmall },
  headerRating: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  headerRatingText: { ...typography.caption },
  blurb: { ...typography.bodySmall, marginTop: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 12 },
  tagText: { ...typography.caption },
  section: { borderRadius: 12, borderWidth: 1, padding: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.h5 },
  actionText: { ...typography.bodySmall, fontWeight: '600' },
  scorecard: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreStat: { alignItems: 'center', flex: 1 },
  scoreValue: { ...typography.h6 },
  scoreLabel: { ...typography.caption, marginTop: 2 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  noteText: { ...typography.caption },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  categoryLabel: { ...typography.bodySmall, width: 82 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  categoryValue: { ...typography.bodySmall, fontWeight: '600', width: 28, textAlign: 'right' },
  review: { borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewDate: { ...typography.caption },
  reviewComment: { ...typography.bodySmall, marginTop: spacing.xs },
  dateStrip: { gap: spacing.sm, paddingBottom: spacing.sm },
  dateChip: {
    width: 58,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateWeekday: { ...typography.caption, fontWeight: '600' },
  dateDay: { ...typography.h5 },
  dateMonth: { ...typography.caption },
  sheetHeading: { ...typography.bodySmall, fontWeight: '600', marginBottom: spacing.sm },
  teeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  teeTimeBlock: { flex: 1 },
  teeTime: { ...typography.body, fontWeight: '600' },
  teeSpots: { ...typography.caption, marginTop: 2 },
  teePrice: { ...typography.body, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  modalContent: { borderRadius: 16, padding: spacing.lg, maxHeight: '88%' },
  modalTitle: { ...typography.h4, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.bodySmall, marginBottom: spacing.md },
  fieldLabel: { ...typography.caption, fontWeight: '600', marginBottom: spacing.xs },
  playerRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  playerChip: {
    width: 48,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerChipText: { ...typography.body, fontWeight: '700' },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cartText: { ...typography.bodySmall },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    ...typography.body,
    marginBottom: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  totalLabel: { ...typography.bodySmall },
  totalValue: { ...typography.h5 },
  modalButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  button: { flex: 1, padding: spacing.md, borderRadius: 10, alignItems: 'center' },
  buttonText: { ...typography.button, color: '#fff' },
  rateScroll: { maxHeight: 380 },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  rateLabels: { flex: 1 },
  rateLabel: { ...typography.body, fontWeight: '600' },
  rateHint: { ...typography.caption },
  removeRating: { ...typography.bodySmall, fontWeight: '600', textAlign: 'center' },
  emptyText: { ...typography.body },
});
