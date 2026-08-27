import { SKILLS, SKILL_LABELS } from './gameProfile';

// Course fit: match what a course demands against what the golfer brings.
//
// Both sides use the same 0-100 scale - a course's `traits.approach` is how hard
// it leans on approach play, a profile's `skills.approach` is how well the golfer
// plays it. The gap between them is the whole model.
//
// Two numbers come out of it, and they are deliberately in tension:
//
//   comfort  - how well the course suits the game you have today. High comfort
//              means your strengths are what it asks for. This is the number for
//              "where will I score on this trip?"
//   training - how hard the course leans on the parts of your game you are
//              working on. High training value means it will expose your focus
//              areas repeatedly, which is what you want when the point of the
//              trip is to get better.
//
// A course can be high on both (it demands what you're working on and you're
// already decent at it) or low on both (it tests nothing you care about).

// A focus category counts this much more than the rest. High enough that a
// course testing exactly what you're working on beats one that is merely hard
// everywhere.
const FOCUS_WEIGHT = 4;

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

/**
 * Per-skill breakdown of a course against a profile.
 * `gap` > 0 means the course asks for more than the golfer currently brings.
 */
export const skillGaps = (course, profile) =>
  SKILLS.map(({ key, label }) => {
    const demand = course.traits?.[key] ?? 50;
    const skill = profile.skills?.[key] ?? 50;
    return {
      key,
      label,
      demand,
      skill,
      gap: demand - skill,
      isFocus: profile.focus?.includes(key) || false,
    };
  });

/**
 * How exposed the golfer is to the conditions, as opposed to the shots. Wind and
 * ground game are learned by playing in them, not by strokes gained.
 */
export const conditionExposure = (course, profile) => {
  const wind = course.traits?.wind ?? 40;
  const ground = course.traits?.groundGame ?? 40;
  const experience = profile.linksExperience ?? 0;
  const demand = (wind + ground) / 2;
  return {
    wind,
    groundGame: ground,
    experience,
    // 0 = you have played plenty of this; 100 = completely new to you.
    unfamiliarity: clamp(demand - experience),
  };
};

/** 0-100: how well the course suits the game the golfer has today. */
export const comfortScore = (course, profile) => {
  const gaps = skillGaps(course, profile);
  // Only shortfalls hurt - being better than a course demands is not a penalty -
  // and each one is weighted by how much the course actually leans on that skill.
  // A weak driver suffers at a driving course; a weak chipper barely notices it.
  const weightedShortfall = gaps.reduce((sum, g) => sum + g.demand * Math.max(0, g.gap), 0);
  const totalDemand = gaps.reduce((sum, g) => sum + g.demand, 0) || 1;
  const shortfall = weightedShortfall / totalDemand;
  const { unfamiliarity } = conditionExposure(course, profile);
  const penalty = course.traits?.penalty ?? 50;
  // Penal courses magnify a shortfall; forgiving ones absorb it.
  const severity = 0.6 + (penalty / 100) * 0.8;
  return clamp(Math.round(100 - shortfall * severity - unfamiliarity * 0.25));
};

/** 0-100: how much this course will work the parts of the game you care about. */
export const trainingScore = (course, profile) => {
  const gaps = skillGaps(course, profile);
  let weighted = 0;
  let weight = 0;
  gaps.forEach((g) => {
    const w = g.isFocus ? FOCUS_WEIGHT : 1;
    // Value comes from demand meeting deficiency: a course that hammers a skill
    // you already own teaches you little.
    const deficiency = clamp(50 + g.gap, 0, 100);
    weighted += w * ((g.demand / 100) * deficiency);
    weight += w;
  });
  const base = weighted / (weight || 1);
  // Unfamiliar conditions are themselves worth training on, but only somewhat -
  // you cannot practise wind at the range.
  const { unfamiliarity } = conditionExposure(course, profile);
  return clamp(Math.round(base * 0.85 + unfamiliarity * 0.15));
};

/** Everything a screen needs about one course and one golfer. */
export const evaluateFit = (course, profile) => {
  const gaps = skillGaps(course, profile);
  const comfort = comfortScore(course, profile);
  const training = trainingScore(course, profile);
  const exposure = conditionExposure(course, profile);

  const toughest = [...gaps].sort((a, b) => b.gap - a.gap)[0];
  const easiest = [...gaps].sort((a, b) => a.gap - b.gap)[0];
  const focusTested = gaps
    .filter((g) => g.isFocus && g.demand >= 70)
    .map((g) => g.key);

  return {
    comfort,
    training,
    gaps,
    exposure,
    toughest,
    easiest,
    focusTested,
    verdict: verdictFor({ comfort, training, focusTested }),
  };
};

const verdictFor = ({ comfort, training, focusTested }) => {
  if (training >= 65 && focusTested.length > 0) {
    return comfort >= 55
      ? { key: 'sharpen', label: 'Sharpens your focus', tone: 'good' }
      : { key: 'proving', label: 'Proving ground', tone: 'warn' };
  }
  if (comfort >= 65) return { key: 'scoring', label: 'Scoring chance', tone: 'good' };
  if (comfort < 40) return { key: 'survival', label: 'Survival test', tone: 'warn' };
  return { key: 'neutral', label: 'Fair test', tone: 'neutral' };
};

/** One-line explanation of the fit, for cards and briefs. */
export const explainFit = (course, profile, fit = null) => {
  const evaluated = fit || evaluateFit(course, profile);
  const { toughest, focusTested, exposure } = evaluated;

  if (focusTested.length > 0) {
    const names = focusTested.map((key) => SKILL_LABELS[key].toLowerCase()).join(' and ');
    return `Leans hard on ${names} - exactly what you're working on.`;
  }
  if (toughest.gap > 20) {
    return `Asks more of your ${toughest.label.toLowerCase()} than you're giving right now.`;
  }
  if (exposure.unfamiliarity > 55) {
    return 'Wind and firm ground will decide this one, and you have little of it logged.';
  }
  return `Sets up for your ${SKILL_LABELS[profile.strongest].toLowerCase()}.`;
};
