import aiChat from './aiChat';
import { COURSE_PREVIEW_SYSTEM_PROMPT, buildCoursePreviewPrompt } from './prompts';
import { TABLES, findOne, upsert } from './db';
import { evaluateFit, explainFit } from './courseFit';
import { SKILL_LABELS } from './gameProfile';

// The course training agent.
//
// Every brief is computed locally first: the demands, the gaps, the expected
// score, the drills, and the bag notes all come out of the course traits and the
// golfer's own numbers. That version is always available, with no API key and no
// network.
//
// When an AI provider IS configured, the same computed numbers are handed to it
// as context and it writes the prose version. The model interprets; it never
// invents the figures.

export const PREVIEW_SOURCES = { LOCAL: 'local', AI: 'ai' };

// --- expected score ---------------------------------------------------------

/**
 * WHS course handicap: index x (slope / 113) + (course rating - par).
 * The expected score band widens and shifts up when the course is a poor fit -
 * a golfer plays to their handicap far less often on a course that exposes them.
 */
export const expectedScore = (course, profile, fit) => {
  const index = profile.handicapIndex;
  if (index === null || index === undefined) return null;

  const courseHandicap = Math.round(
    index * (course.slopeRating / 113) + (course.courseRating - course.par)
  );
  // Amateurs beat their course handicap in roughly 1 round in 5; centre the band
  // a few shots above it, then let fit move the ends.
  const discomfort = (100 - fit.comfort) / 100;
  const centre = course.par + courseHandicap + 2 + Math.round(discomfort * 4);
  const spread = 3 + Math.round(discomfort * 3);

  return {
    courseHandicap,
    low: centre - spread,
    high: centre + spread,
  };
};

// --- drills -----------------------------------------------------------------

const DRILLS = {
  driving: [
    {
      title: 'Fairway-width gate',
      detail:
        'Set two alignment sticks 30 yards apart at 220 yards on the range. 20 drivers, count how many finish inside. Repeat until you hit 14/20 twice.',
    },
    {
      title: 'Tee-shot club ladder',
      detail:
        'Alternate driver, 3-wood, and your longest iron at the same target for 15 shots. Learn which one you trust when the fairway narrows.',
    },
  ],
  approach: [
    {
      title: 'Distance-control ladder',
      detail:
        '10 shots each at 100, 125, and 150 yards. Note the carry of every one. Success is a spread under 8 yards per station.',
    },
    {
      title: 'Front-edge discipline',
      detail:
        'Play 20 approaches aiming at the front third of the green rather than the flag. Count how many finish pin-high or short - you want 15+.',
    },
  ],
  aroundGreen: [
    {
      title: 'Three-club up-and-down',
      detail:
        'From 15 yards, play the same shot with a lob wedge, a pitching wedge, and an 8-iron. 10 balls each, track which gets closest. Learn the running option.',
    },
    {
      title: 'Bunker depth drill',
      detail:
        'Draw a line in the sand, enter two inches behind it, 15 reps. Success is 12 that finish on the green.',
    },
  ],
  putting: [
    {
      title: 'Lag ladder',
      detail:
        '6 putts each from 30, 40, and 50 feet. Success is every ball finishing inside a 3-foot circle. This is the one that saves a links round.',
    },
    {
      title: 'Six-foot gate',
      detail:
        '20 putts from 6 feet through a gate barely wider than the ball. Do not leave until you make 15.',
    },
  ],
};

const CONDITION_DRILLS = {
  wind: {
    title: 'Knockdown flight control',
    detail:
      '20 knockdown 7-irons: ball two inches back, 70% swing, finish low and short. Success is a flight under half your normal height with under 10 yards of spread.',
  },
  groundGame: {
    title: 'Putt from off the green',
    detail:
      'From 20-30 yards off the green, putt 15 balls through the fringe. On firm links turf this is the highest-percentage shot you own, and it feels wrong until you have done it.',
  },
  penalty: {
    title: 'Sideways recovery',
    detail:
      'Drop 10 balls in the deepest rough or a fairway bunker lip you can find. The only goal is back in play in one. Count how often you try to be a hero and fail.',
  },
};

// --- bag notes --------------------------------------------------------------

const bagNotes = (course, golfBag) => {
  const notes = [];
  if (!golfBag) return notes;

  const { traits } = course;
  const wedges = golfBag.wedges?.length || 0;
  const hasRunner = (golfBag.hybrids?.length || 0) + (golfBag.woods?.length || 0) > 0;

  if (traits.groundGame >= 80 && !hasRunner) {
    notes.push(
      'No fairway wood or hybrid in the bag. On firm ground a club you can run along the deck from 200 yards is worth more than another wedge.'
    );
  }
  if (traits.aroundGreen >= 85 && wedges < 3) {
    notes.push(
      `Only ${wedges} wedge${wedges === 1 ? '' : 's'} listed. This course asks for several different short-game trajectories from tight lies.`
    );
  }
  if (traits.wind >= 80) {
    notes.push(
      'Wind is the primary defence here. A lower-spinning long iron or driving iron beats a high-launch hybrid into a two-club breeze.'
    );
  }
  if (traits.penalty >= 85) {
    notes.push(
      'Recovery matters more than distance. Know which club you can advance 120 yards from heavy rough or a steep face.'
    );
  }
  if (course.walkingOnly) {
    notes.push('Walking only - carry a light bag or book a caddie, and expect the last few holes to feel longer.');
  }
  return notes;
};

// --- the computed brief -----------------------------------------------------

/**
 * A complete training brief built entirely from local numbers. This is the
 * fallback when no AI provider is configured, and the context when one is.
 */
export const buildLocalBrief = ({ course, profile, fit, golfBag }) => {
  const score = expectedScore(course, profile, fit);
  const sortedByGap = [...fit.gaps].sort((a, b) => b.gap - a.gap);
  const exposed = sortedByGap.filter((g) => g.gap > 5).slice(0, 2);

  const asks = [];
  const demandOrder = [...fit.gaps].sort((a, b) => b.demand - a.demand);
  demandOrder.slice(0, 2).forEach((g) => {
    asks.push(`${g.label} carries this course (${g.demand}/100 demand).`);
  });
  if (course.traits.wind >= 75) {
    asks.push('Wind is a club-selection input on every shot, not an occasional nuisance.');
  }
  if (course.traits.groundGame >= 80) {
    asks.push('The ball runs. Landing spots matter more than carry numbers, into and around the greens.');
  }
  if (course.traits.penalty >= 85) {
    asks.push('Misses are expensive - the recovery is often sideways rather than forward.');
  }

  const whereExposed = exposed.map(
    (g) =>
      `${g.label}: the course asks ${g.demand}, you are at ${Math.round(g.skill)}. ` +
      `${g.isFocus ? 'This is a focus area, so the trip doubles as a test of it.' : 'Expect this to cost shots.'}`
  );
  if (whereExposed.length === 0) {
    whereExposed.push('No large gaps - your game covers what this course asks. Play it to score.');
  }
  if (fit.exposure.unfamiliarity > 55) {
    whereExposed.push(
      `Conditions are the bigger gap: wind ${fit.exposure.wind} and ground game ${fit.exposure.groundGame} against ${fit.exposure.experience}/100 logged experience of that golf.`
    );
  }

  // Drills: focus areas first, then the biggest gap, then conditions.
  const prepPlan = [];
  const drillKeys = [...new Set([...profile.focus, ...exposed.map((g) => g.key)])];
  drillKeys.slice(0, 2).forEach((key) => {
    const options = DRILLS[key];
    if (!options) return;
    // Pick the drill that suits the course: the second option is the
    // course-management one, which fits when the course is penal.
    const drill = course.traits.penalty >= 80 && options[1] ? options[1] : options[0];
    prepPlan.push({ ...drill, skill: SKILL_LABELS[key] });
  });
  if (course.traits.wind >= 80) prepPlan.push({ ...CONDITION_DRILLS.wind, skill: 'Wind' });
  else if (course.traits.groundGame >= 85) prepPlan.push({ ...CONDITION_DRILLS.groundGame, skill: 'Ground game' });
  else if (course.traits.penalty >= 88) prepPlan.push({ ...CONDITION_DRILLS.penalty, skill: 'Recovery' });

  const onCourse = [];
  if (course.traits.driving >= 85) {
    onCourse.push('Position over power off the tee - take the club that finds the short grass, even from 250.');
  }
  if (course.traits.groundGame >= 85) {
    onCourse.push('Putt from off the green whenever the ground between you and the hole is short and firm.');
  }
  if (course.traits.approach >= 85) {
    onCourse.push('Aim at the fat of the green, not the flag. Middle of the green is a good miss here.');
  }
  if (course.traits.putting >= 80) {
    onCourse.push('Lag putting decides the card - three-putts are the score killer on greens this size.');
  }
  if (course.traits.penalty >= 85) {
    onCourse.push('Take the sideways option the first time you are asked. The double comes from the second attempt at a hero shot.');
  }
  if (onCourse.length === 0) {
    onCourse.push('Play your normal game - nothing here demands a shot you do not already own.');
  }

  return {
    source: PREVIEW_SOURCES.LOCAL,
    headline: `${fit.verdict.label}: ${explainFit(course, profile, fit)}`,
    comfort: fit.comfort,
    training: fit.training,
    asks: asks.slice(0, 4),
    whereExposed,
    prepPlan: prepPlan.slice(0, 3),
    onCourse: onCourse.slice(0, 3),
    bagNotes: bagNotes(course, golfBag),
    expectedScore: score,
  };
};

// --- the agent --------------------------------------------------------------

/**
 * Produce a brief for one course, cached in the private db.
 *
 * A cached brief is reused until the golfer's profile changes - the signature
 * covers handicap, skills, and focus, so a new GHIN sync or a changed focus
 * invalidates it.
 */
export const generatePreview = async ({
  course,
  profile,
  golfBag,
  userId,
  useAI = true,
  force = false,
}) => {
  const fit = evaluateFit(course, profile);
  const signature = profileSignature(profile);

  if (!force) {
    const cached = await findOne(
      TABLES.PREVIEWS,
      (row) => row.courseId === course.id && row.signature === signature,
      userId
    );
    if (cached) return cached;
  }

  const local = buildLocalBrief({ course, profile, fit, golfBag });
  let brief = local;

  if (useAI && aiChat.isConfigured()) {
    try {
      const prose = await aiChat.complete(
        COURSE_PREVIEW_SYSTEM_PROMPT,
        buildCoursePreviewPrompt({
          course,
          profile,
          fit,
          golfBag,
          expectedScore: local.expectedScore,
        })
      );
      brief = { ...local, source: PREVIEW_SOURCES.AI, prose };
    } catch (error) {
      // A provider outage should not cost the golfer their brief.
      console.warn('Course preview AI call failed, using the computed brief:', error.message);
    }
  }

  return upsert(
    TABLES.PREVIEWS,
    (row) => row.courseId === course.id,
    { courseId: course.id, signature, brief },
    userId
  );
};

/** Changes to any of these invalidate a cached brief. */
export const profileSignature = (profile) =>
  [
    profile.handicapIndex ?? 'na',
    profile.roundsAnalyzed,
    ...Object.values(profile.skills).map((v) => Math.round(v)),
    ...[...profile.focus].sort(),
    profile.linksExperience,
  ].join('|');

export const getCachedPreview = async (courseId, userId) =>
  findOne(TABLES.PREVIEWS, (row) => row.courseId === courseId, userId);
