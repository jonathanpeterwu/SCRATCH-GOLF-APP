import { TABLES, all, upsert } from './db';
import { calculateStrokesGained } from './ghin';

// The golfer's game profile - the input every course fit and training brief is
// built from.
//
// Two sources feed it:
//   * measured: strokes gained per category from GHIN rounds, mapped onto the
//     same 0-100 scale the course traits use, so a course demand and a player
//     skill can be compared directly.
//   * declared: the categories the golfer says they are working on right now,
//     stored in the private db. Focus outranks measurement - if you are
//     rebuilding your driver, that matters even when the numbers say approach.

export const SKILLS = [
  { key: 'driving', label: 'Driving', sg: 'offTee', icon: 'golf-tee' },
  { key: 'approach', label: 'Approach', sg: 'approach', icon: 'target' },
  { key: 'aroundGreen', label: 'Around the green', sg: 'aroundGreen', icon: 'golf' },
  { key: 'putting', label: 'Putting', sg: 'putting', icon: 'circle-outline' },
];

export const SKILL_LABELS = SKILLS.reduce((acc, s) => ({ ...acc, [s.key]: s.label }), {});

const NEUTRAL = 50;

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

/**
 * Strokes gained per round -> a 0-100 skill level on the same scale as course
 * demands. Scratch (0.00 SG) sits at 50; each stroke gained or lost per round
 * moves it 20 points, which spans the realistic amateur range without pinning
 * everyone at the ends.
 */
export const sgToSkill = (strokesGained) => clamp(NEUTRAL + Number(strokesGained) * 20);

/** With no round data, spread a handicap index across every category evenly. */
const handicapToSkill = (handicapIndex) => {
  if (handicapIndex === null || handicapIndex === undefined) return NEUTRAL;
  // Scratch ~ 60, 10 handicap ~ 45, 20 handicap ~ 30.
  return clamp(60 - Number(handicapIndex) * 1.5);
};

/**
 * Build the profile.
 * @param {object} ghinData     from the store (may be null)
 * @param {object} settings     the row from the PROFILE table (may be null)
 * @param {Array}  playLog      rows from the PLAY_LOG table
 */
export const buildGameProfile = (ghinData, settings = null, playLog = []) => {
  const handicapIndex = ghinData?.handicapIndex ?? null;
  const scores = ghinData?.recentScores || [];
  const sg = scores.length > 0 ? calculateStrokesGained(scores) : null;

  const skills = {};
  SKILLS.forEach(({ key, sg: sgKey }) => {
    const measured = sg?.[sgKey];
    skills[key] =
      measured !== undefined && measured !== null
        ? sgToSkill(measured)
        : handicapToSkill(handicapIndex);
  });

  const ranked = [...SKILLS].sort((a, b) => skills[a.key] - skills[b.key]);
  const weakest = ranked[0].key;
  const strongest = ranked[ranked.length - 1].key;

  // Declared focus wins; otherwise coach the two weakest categories.
  const declaredFocus = (settings?.focus || []).filter((key) => skills[key] !== undefined);
  const focus = declaredFocus.length > 0 ? declaredFocus : [ranked[0].key, ranked[1].key];

  return {
    handicapIndex,
    roundsAnalyzed: scores.length,
    hasRoundData: scores.length > 0,
    strokesGained: sg,
    skills,
    weakest,
    strongest,
    focus,
    goal: settings?.goal || '',
    linksExperience: linksExperience(playLog),
  };
};

/**
 * How much firm-and-windy golf this golfer has actually played, 0-100. Rounds
 * logged on links and heathland courses raise it; it decides whether a trip to
 * Scotland reads as "familiar" or "you have never played this game before".
 */
export const linksExperience = (playLog = []) => {
  const linksRounds = playLog.filter((round) => round.groundGame >= 75).length;
  if (linksRounds === 0) return 0;
  // Diminishing returns: 1 round = 25, 4 = 60, 10+ = 90.
  return clamp(Math.round(100 * (1 - Math.exp(-linksRounds / 4))));
};

export const getProfileSettings = async (userId) => {
  const rows = await all(TABLES.PROFILE, userId);
  return rows[0] || null;
};

export const saveProfileSettings = async ({ focus, goal, userId }) =>
  upsert(TABLES.PROFILE, () => true, { focus, goal }, userId);

export const getPlayLog = async (userId) => all(TABLES.PLAY_LOG, userId);

/** A short human summary of where the game stands, used in briefs and headers. */
export const describeProfile = (profile) => {
  if (!profile.hasRoundData) {
    return profile.handicapIndex !== null
      ? `${profile.handicapIndex.toFixed(1)} index, no round data yet`
      : 'No handicap or round data yet';
  }
  const focusLabels = profile.focus.map((key) => SKILL_LABELS[key]).join(' and ');
  return `${profile.handicapIndex?.toFixed(1) ?? '--'} index over ${profile.roundsAnalyzed} rounds, working on ${focusLabels.toLowerCase()}`;
};
