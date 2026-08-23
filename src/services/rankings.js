import { COURSES, getCourseById } from '../data/courses';

// Course ranking.
//
// A raw average of user ratings ranks a course with one 5-star review above a
// course with two hundred reviews averaging 4.6, which is wrong. So the ranking
// is a Bayesian (shrunk) average: each course starts with PRIOR_WEIGHT phantom
// ratings at its editorial score, and real reviews pull it away from that
// starting point as they accumulate.
//
//   ranked = (PRIOR_WEIGHT * prior + sum(userRatings)) / (PRIOR_WEIGHT + count)

export const RATING_CATEGORIES = [
  { key: 'conditions', label: 'Conditions', icon: 'flower', hint: 'Turf, greens, bunkers' },
  { key: 'layout', label: 'Layout', icon: 'map-marker-path', hint: 'Design and shot variety' },
  { key: 'value', label: 'Value', icon: 'cash', hint: 'Worth the green fee?' },
  { key: 'pace', label: 'Pace', icon: 'clock-fast', hint: 'How long was the round?' },
  { key: 'facilities', label: 'Facilities', icon: 'home-variant', hint: 'Range, carts, clubhouse' },
];

const PRIOR_WEIGHT = 8;
const MAX_STARS = 5;

/** Editorial score (0-100) mapped onto the 1-5 star scale used by reviews. */
export const editorialToStars = (editorialScore) => {
  const clamped = Math.max(0, Math.min(100, editorialScore ?? 70));
  return 1 + (clamped / 100) * (MAX_STARS - 1);
};

/** A review's overall star rating: the mean of whichever categories were filled in. */
export const reviewOverall = (review) => {
  const values = RATING_CATEGORIES.map(({ key }) => review?.ratings?.[key]).filter(
    (value) => typeof value === 'number' && value > 0
  );
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const average = (values) =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

/**
 * Ranking stats for one course.
 * @param {object} course
 * @param {Array} reviews reviews for this course only
 */
export const scoreCourse = (course, reviews = []) => {
  const overalls = reviews.map(reviewOverall).filter((value) => value !== null);
  const prior = editorialToStars(course.editorialScore);
  const sum = overalls.reduce((total, value) => total + value, 0);
  const rankedScore = (PRIOR_WEIGHT * prior + sum) / (PRIOR_WEIGHT + overalls.length);

  const categoryAverages = {};
  RATING_CATEGORIES.forEach(({ key }) => {
    const values = reviews
      .map((review) => review?.ratings?.[key])
      .filter((value) => typeof value === 'number' && value > 0);
    categoryAverages[key] = average(values);
  });

  return {
    reviewCount: overalls.length,
    userAverage: average(overalls),
    rankedScore,
    prior,
    categoryAverages,
    // Reviews only meaningfully move the ranking once a few are in.
    isEstablished: overalls.length >= 3,
  };
};

export const SORT_OPTIONS = [
  { key: 'rank', label: 'Ranking' },
  { key: 'rating', label: 'Golfer rating' },
  { key: 'price', label: 'Green fee' },
  { key: 'difficulty', label: 'Difficulty' },
  { key: 'name', label: 'A-Z' },
];

const comparators = {
  rank: (a, b) => b.stats.rankedScore - a.stats.rankedScore,
  rating: (a, b) => {
    // Unrated courses sort last rather than pretending to be 0 stars.
    const aRating = a.stats.userAverage ?? -1;
    const bRating = b.stats.userAverage ?? -1;
    if (bRating !== aRating) return bRating - aRating;
    return b.stats.rankedScore - a.stats.rankedScore;
  },
  price: (a, b) => a.course.teeSheet.weekdayFee - b.course.teeSheet.weekdayFee,
  difficulty: (a, b) => b.course.slopeRating - a.course.slopeRating,
  name: (a, b) => a.course.name.localeCompare(b.course.name),
};

const matchesQuery = (course, query) => {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [course.name, course.city, course.state, course.designer]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(needle));
};

/**
 * Build the ranked course list.
 *
 * `rank` is always assigned from the ranking sort so a course keeps its "#3"
 * badge even while the list is sorted by price.
 *
 * @param {Array} reviews every review in the private db
 * @param {{query?: string, types?: string[], maxFee?: number, sort?: string}} options
 */
export const rankCourses = (reviews = [], options = {}) => {
  const { query = '', types = [], maxFee = null, sort = 'rank' } = options;

  const reviewsByCourse = reviews.reduce((acc, review) => {
    if (!review?.courseId) return acc;
    (acc[review.courseId] = acc[review.courseId] || []).push(review);
    return acc;
  }, {});

  const scored = COURSES.map((course) => ({
    course,
    stats: scoreCourse(course, reviewsByCourse[course.id] || []),
  }));

  const rankById = {};
  [...scored].sort(comparators.rank).forEach((entry, index) => {
    rankById[entry.course.id] = index + 1;
  });

  const filtered = scored.filter(({ course }) => {
    if (!matchesQuery(course, query)) return false;
    if (types.length > 0 && !types.includes(course.type)) return false;
    if (maxFee !== null && course.teeSheet.weekdayFee > maxFee) return false;
    return true;
  });

  const comparator = comparators[sort] || comparators.rank;
  return filtered
    .sort(comparator)
    .map((entry) => ({ ...entry, rank: rankById[entry.course.id] }));
};

/** Ranking detail for a single course, including its position in the full list. */
export const getCourseRanking = (courseId, reviews = []) => {
  const course = getCourseById(courseId);
  if (!course) return null;
  const ranked = rankCourses(reviews);
  const entry = ranked.find((item) => item.course.id === courseId);
  return entry ? { ...entry, total: ranked.length } : null;
};

export const formatStars = (value) => (value === null || value === undefined ? '-' : value.toFixed(1));
