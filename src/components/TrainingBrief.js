import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, typography, spacing } from '../theme';
import { PREVIEW_SOURCES } from '../services/coursePreview';

/**
 * Renders a course training brief.
 *
 * Every brief carries the locally computed sections. When an AI provider is
 * configured it also carries `prose` - the written version of the same numbers -
 * which is shown above them rather than instead of them, so the golfer can always
 * see what the advice was derived from.
 */
export default function TrainingBrief({ brief, showHeadline = true }) {
  const t = useTheme();
  if (!brief) return null;

  return (
    <View style={styles.container}>
      {/* Skipped when the caller already shows the verdict directly above. */}
      {showHeadline && <Text style={[styles.headline, { color: t.text }]}>{brief.headline}</Text>}

      <View style={styles.scoreRow}>
        <ScorePill label="Training value" value={brief.training} color={t.primary} theme={t} />
        <ScorePill label="Fits my game" value={brief.comfort} color={t.info} theme={t} />
        {brief.expectedScore && (
          <ScorePill
            label="Likely score"
            value={`${brief.expectedScore.low}-${brief.expectedScore.high}`}
            color={t.warning}
            theme={t}
          />
        )}
      </View>

      {brief.source === PREVIEW_SOURCES.AI && brief.prose ? (
        <View style={[styles.prose, { backgroundColor: t.surfaceAlt }]}>
          <Text style={[styles.proseText, { color: t.text }]}>{brief.prose.trim()}</Text>
        </View>
      ) : null}

      <Block title="What it will ask of you" icon="clipboard-outline" theme={t}>
        {brief.asks.map((line) => (
          <Bullet key={line} text={line} theme={t} />
        ))}
      </Block>

      <Block title="Where your game is exposed" icon="alert-circle-outline" theme={t}>
        {brief.whereExposed.map((line) => (
          <Bullet key={line} text={line} theme={t} />
        ))}
      </Block>

      {brief.prepPlan.length > 0 && (
        <Block title="Prep plan" icon="barbell-outline" theme={t}>
          {brief.prepPlan.map((drill) => (
            <View key={drill.title} style={styles.drill}>
              <Text style={[styles.drillTitle, { color: t.text }]}>
                {drill.title}
                <Text style={[styles.drillSkill, { color: t.textTertiary }]}> · {drill.skill}</Text>
              </Text>
              <Text style={[styles.drillDetail, { color: t.textSecondary }]}>{drill.detail}</Text>
            </View>
          ))}
        </Block>
      )}

      <Block title="On the day" icon="flag-outline" theme={t}>
        {brief.onCourse.map((line) => (
          <Bullet key={line} text={line} theme={t} />
        ))}
      </Block>

      {brief.bagNotes.length > 0 && (
        <Block title="Bag notes" icon="briefcase-outline" theme={t}>
          {brief.bagNotes.map((line) => (
            <Bullet key={line} text={line} theme={t} />
          ))}
        </Block>
      )}

      <View style={styles.sourceRow}>
        <MaterialCommunityIcons
          name={brief.source === PREVIEW_SOURCES.AI ? 'robot-outline' : 'calculator-variant-outline'}
          size={13}
          color={t.textTertiary}
        />
        <Text style={[styles.sourceText, { color: t.textTertiary }]}>
          {brief.source === PREVIEW_SOURCES.AI
            ? 'Written by the coaching model from your measured gaps'
            : 'Computed from your strokes gained and this course’s demands. Add an AI key in aiChat.js for the written version.'}
        </Text>
      </View>
    </View>
  );
}

function ScorePill({ label, value, color, theme: t }) {
  return (
    <View style={[styles.pill, { borderColor: color, backgroundColor: t.surface }]}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={[styles.pillLabel, { color: t.textTertiary }]}>{label}</Text>
    </View>
  );
}

function Block({ title, icon, children, theme: t }) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHeader}>
        <Ionicons name={icon} size={15} color={t.primary} />
        <Text style={[styles.blockTitle, { color: t.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Bullet({ text, theme: t }) {
  return (
    <View style={styles.bullet}>
      <Text style={[styles.bulletDot, { color: t.primary }]}>•</Text>
      <Text style={[styles.bulletText, { color: t.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  headline: { ...typography.body, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  pillValue: { ...typography.h5 },
  pillLabel: { ...typography.caption, marginTop: 2, textAlign: 'center' },
  prose: { borderRadius: 10, padding: spacing.md },
  proseText: { ...typography.bodySmall, lineHeight: 21 },
  block: { gap: spacing.xs },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  blockTitle: { ...typography.bodySmall, fontWeight: '700' },
  bullet: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.sm },
  bulletDot: { ...typography.bodySmall, fontWeight: '700' },
  bulletText: { ...typography.bodySmall, flex: 1, lineHeight: 20 },
  drill: { marginBottom: spacing.sm },
  drillTitle: { ...typography.bodySmall, fontWeight: '600' },
  drillSkill: { ...typography.caption, fontWeight: '400' },
  drillDetail: { ...typography.bodySmall, marginTop: 2, lineHeight: 20 },
  sourceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  sourceText: { ...typography.caption, flex: 1, lineHeight: 16 },
});
