import { TABLES, all, findOne, insert, remove } from './db';
import { getCourseById } from '../data/courses';

// Which courses the golfer has actually played.
//
// This is the "usage" signal behind the personalised ranking. It does two jobs:
//   * marks a course as played in the list, so a trip plan is about where to go next
//   * feeds linksExperience() in gameProfile.js - a golfer with six links rounds
//     logged gets a different Scotland brief from one who has never played the
//     ball along the ground
//
// The course's own traits are copied onto the row at log time, so the experience
// calculation does not have to re-look-up the catalog (and still works if a
// course is later removed from it).

export const getPlayLog = async (userId) => all(TABLES.PLAY_LOG, userId);

export const hasPlayed = async (courseId, userId) =>
  Boolean(await findOne(TABLES.PLAY_LOG, (row) => row.courseId === courseId, userId));

export const logRound = async ({ courseId, playedOn = null, score = null, notes = '', userId }) => {
  const course = getCourseById(courseId);
  if (!course) throw new Error('Unknown course');

  return insert(
    TABLES.PLAY_LOG,
    {
      courseId,
      courseName: course.name,
      destination: course.destination,
      playedOn: playedOn || new Date().toISOString().slice(0, 10),
      score: score === null || score === '' ? null : Number(score),
      notes: notes.trim(),
      // Snapshot of the conditions this round was played in.
      groundGame: course.traits?.groundGame ?? 50,
      wind: course.traits?.wind ?? 50,
    },
    userId
  );
};

export const removeRound = async (roundId, userId) => remove(TABLES.PLAY_LOG, roundId, userId);

/** Rounds logged per destination - the "where have I actually been" summary. */
export const roundsByDestination = (playLog = []) =>
  playLog.reduce((acc, round) => {
    if (!round.destination) return acc;
    acc[round.destination] = (acc[round.destination] || 0) + 1;
    return acc;
  }, {});
