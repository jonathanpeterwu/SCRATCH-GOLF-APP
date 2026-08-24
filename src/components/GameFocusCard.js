import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/appStore';
import { useTheme, shadows, typography, spacing } from '../theme';
import { SKILLS, saveProfileSettings } from '../services/gameProfile';
import { useGameProfile } from '../hooks/useGameProfile';

/**
 * What the golfer is working on right now.
 *
 * This is the single most important input to course fit: it decides which
 * courses rank as training value and what the training brief builds drills
 * around. Left alone it follows the two weakest strokes gained categories.
 */
export default function GameFocusCard() {
  const t = useTheme();
  const user = useAppStore((state) => state.user);
  const profileSettings = useAppStore((state) => state.profileSettings);
  const setProfileSettings = useAppStore((state) => state.setProfileSettings);
  const profile = useGameProfile();

  const [goal, setGoal] = useState(profileSettings?.goal || '');
  const declared = profileSettings?.focus || [];

  const persist = async (nextFocus, nextGoal) => {
    try {
      const saved = await saveProfileSettings({
        focus: nextFocus,
        goal: nextGoal,
        userId: user?.id,
      });
      setProfileSettings(saved);
    } catch (error) {
      Alert.alert('Could not save your focus', error.message);
    }
  };

  const toggleFocus = (key) => {
    const next = declared.includes(key)
      ? declared.filter((item) => item !== key)
      : [...declared, key];
    persist(next, goal);
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: t.text }]}>Game Focus</Text>
      <View style={[styles.card, { backgroundColor: t.card, borderColor: t.cardBorder }, shadows.small]}>
        <Text style={[styles.help, { color: t.textSecondary }]}>
          {declared.length > 0
            ? 'Courses are ranked by how hard they test these.'
            : `Following your numbers: ${profile.focus
                .map((key) => SKILLS.find((s) => s.key === key)?.label)
                .join(' and ')}. Tap to override.`}
        </Text>

        <View style={styles.skillGrid}>
          {SKILLS.map(({ key, label, icon }) => {
            const active = declared.includes(key);
            const suggested = declared.length === 0 && profile.focus.includes(key);
            return (
              <TouchableOpacity
                key={key}
                onPress={() => toggleFocus(key)}
                activeOpacity={0.7}
                style={[
                  styles.skillChip,
                  {
                    backgroundColor: active ? t.primary : t.surface,
                    borderColor: active || suggested ? t.primary : t.border,
                    borderStyle: suggested && !active ? 'dashed' : 'solid',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={16}
                  color={active ? '#fff' : suggested ? t.primary : t.textSecondary}
                />
                <Text
                  style={[
                    styles.skillLabel,
                    { color: active ? '#fff' : suggested ? t.primary : t.textSecondary },
                  ]}
                >
                  {label}
                </Text>
                <Text
                  style={[
                    styles.skillValue,
                    { color: active ? '#fff' : t.textTertiary },
                  ]}
                >
                  {Math.round(profile.skills[key])}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[
            styles.input,
            { borderColor: t.inputBorder, backgroundColor: t.inputBackground, color: t.inputText },
          ]}
          placeholder="What are you preparing for? (e.g. Scotland in May)"
          placeholderTextColor={t.placeholder}
          value={goal}
          onChangeText={setGoal}
          onBlur={() => persist(declared, goal)}
          returnKeyType="done"
          onSubmitEditing={() => persist(declared, goal)}
        />

        {profile.linksExperience > 0 && (
          <Text style={[styles.help, { color: t.textTertiary }]}>
            Links experience {profile.linksExperience}/100 from the rounds you have logged - the
            training brief uses this to judge how new firm, windy golf will feel.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sectionTitle: { ...typography.h5, marginBottom: spacing.sm },
  card: { borderRadius: 12, borderWidth: 1, padding: spacing.md, gap: spacing.md },
  help: { ...typography.caption, lineHeight: 16 },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skillLabel: { ...typography.bodySmall, fontWeight: '600' },
  skillValue: { ...typography.caption, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    ...typography.bodySmall,
  },
});
