import { TABLES, all, findOne, upsert, remove } from './db';
import { RATING_CATEGORIES } from './rankings';

// Course ratings and reviews. A golfer keeps one review per course - rating a
// course again edits the review they already left rather than stacking a second
// one, which is what keeps the ranking honest.

export const getReviews = async (userId) => all(TABLES.REVIEWS, userId);

export const getMyReviewForCourse = async (courseId, userId) =>
  findOne(TABLES.REVIEWS, (review) => review.courseId === courseId, userId);

export const validateReview = ({ ratings }) => {
  const rated = RATING_CATEGORIES.filter(({ key }) => ratings?.[key] > 0);
  if (rated.length === 0) return 'Rate at least one category before saving.';
  const outOfRange = rated.find(({ key }) => ratings[key] < 1 || ratings[key] > 5);
  if (outOfRange) return `${outOfRange.label} must be between 1 and 5 stars.`;
  return null;
};

export const saveReview = async ({ courseId, ratings, comment = '', playedOn = null, userId }) => {
  const error = validateReview({ ratings });
  if (error) throw new Error(error);

  // Drop empty categories so an unrated category never counts as a zero.
  const cleaned = {};
  RATING_CATEGORIES.forEach(({ key }) => {
    if (ratings[key] > 0) cleaned[key] = ratings[key];
  });

  return upsert(
    TABLES.REVIEWS,
    (review) => review.courseId === courseId,
    { courseId, ratings: cleaned, comment: comment.trim(), playedOn },
    userId
  );
};

export const deleteReview = async (reviewId, userId) => remove(TABLES.REVIEWS, reviewId, userId);
