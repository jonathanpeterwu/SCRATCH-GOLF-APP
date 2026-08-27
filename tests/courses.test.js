const assert = require('assert');
const { src, reload } = require('./support/setup');

// Catalog, private database, reviews, rankings, tee sheets, and bookings.

const db = src('src/services/db.js');
const rankings = src('src/services/rankings.js');
const teeTimes = src('src/services/teeTimes.js');
const reviewsSvc = src('src/services/reviews.js');
const { COURSES, getCourseById } = src('src/data/courses.js');

module.exports = {
  name: 'courses, database, and booking',
  run: async (ok) => {

    // --- catalog -------------------------------------------------------------
    assert(COURSES.length >= 10, 'catalog has courses');
    const ids = COURSES.map((c) => c.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'course ids unique');
    COURSES.forEach((c) => {
      assert(c.teeSheet && c.teeSheet.firstTee < c.teeSheet.lastTee, `${c.id} tee window sane`);
      // 18-hole courses only - the catalog also carries a 9-hole short course.
      if (c.holes === 18) {
        assert(c.par > 60 && c.yardage > 5000, `${c.id} scorecard sane`);
      } else {
        assert(c.holes > 0 && c.par > 0 && c.yardage > 0, `${c.id} short-course scorecard sane`);
      }
    });
    ok(`catalog: ${COURSES.length} courses, ids unique, tee windows valid`);

    // --- private db ----------------------------------------------------------
    await db.openDb('user-a');
    const r1 = await db.insert(db.TABLES.REVIEWS, { courseId: 'pebble-beach', ratings: { layout: 5 } });
    assert(r1.id && r1.createdAt && r1.updatedAt, 'record gets id + timestamps');
    assert.strictEqual((await db.all(db.TABLES.REVIEWS)).length, 1);

    // A second user must not see user-a's rows.
    await db.openDb('user-b');
    assert.strictEqual((await db.all(db.TABLES.REVIEWS)).length, 0, 'per-user namespacing');
    await db.openDb('user-a');
    assert.strictEqual((await db.all(db.TABLES.REVIEWS)).length, 1, 'rows survive user switch');
    ok('db: insert, namespacing per user');

    // Persistence across a cold start: drop the module cache, keep the storage.
    const db2 = reload('src/services/db.js');
    await db2.openDb('user-a');
    assert.strictEqual((await db2.all(db2.TABLES.REVIEWS)).length, 1, 'rows reload from storage');
    ok('db: rows persist across restart');

    // upsert edits in place rather than stacking duplicates
    await reviewsSvc.saveReview({ courseId: 'pebble-beach', ratings: { layout: 4, pace: 3 }, comment: 'windy', userId: 'user-a' });
    const mine = await reviewsSvc.getReviews('user-a');
    assert.strictEqual(mine.length, 1, 'one review per course');
    assert.strictEqual(mine[0].ratings.layout, 4, 'review updated');
    assert.strictEqual(mine[0].ratings.conditions, undefined, 'unrated category not stored as 0');
    ok('reviews: upsert per course, empty categories dropped');

    assert.throws(() => { throw new Error(reviewsSvc.validateReview({ ratings: {} })); }, /at least one/);
    ok('reviews: rejects an empty rating');

    // --- rankings ------------------------------------------------------------
    const noReviews = rankings.rankCourses([]);
    assert.strictEqual(noReviews.length, COURSES.length, 'all courses ranked');
    assert.deepStrictEqual(
      noReviews.map((e) => e.rank),
      noReviews.map((_, i) => i + 1),
      'ranks are 1..n in rank order'
    );
    const scores = noReviews.map((e) => e.stats.rankedScore);
    assert(scores.every((s, i) => i === 0 || scores[i - 1] >= s), 'ranked descending');

    // One 5-star review must not vault a mid-tier course over the top course.
    const weakest = noReviews[noReviews.length - 1].course;
    const gamed = rankings.rankCourses([
      { courseId: weakest.id, ratings: { conditions: 5, layout: 5, value: 5, pace: 5, facilities: 5 } },
    ]);
    assert.notStrictEqual(gamed[0].course.id, weakest.id, 'single review cannot buy #1');
    // ...but twenty of them should move it up.
    const many = Array.from({ length: 20 }, () => ({
      courseId: weakest.id,
      ratings: { conditions: 5, layout: 5, value: 5, pace: 5, facilities: 5 },
    }));
    const movedRank = rankings.rankCourses(many).find((e) => e.course.id === weakest.id).rank;
    const baseRank = noReviews.find((e) => e.course.id === weakest.id).rank;
    assert(movedRank < baseRank, `sustained reviews move the ranking (${baseRank} -> ${movedRank})`);
    ok('rankings: Bayesian shrinkage resists a single review, responds to many');

    // filters + sorts
    assert(rankings.rankCourses([], { query: 'pebble' }).length === 1, 'search by name');
    assert(rankings.rankCourses([], { query: 'Pete Dye' }).length >= 3, 'search by architect');
    assert(
      rankings.rankCourses([], { types: ['municipal'] }).every((e) => e.course.type === 'municipal'),
      'type filter'
    );
    const byPrice = rankings.rankCourses([], { sort: 'price' }).map((e) => e.course.teeSheet.weekdayFee);
    assert(byPrice.every((p, i) => i === 0 || byPrice[i - 1] <= p), 'price sort ascending');
    // rank badges stay stable under a different sort
    const priceSorted = rankings.rankCourses([], { sort: 'price' });
    priceSorted.forEach((e) => {
      assert.strictEqual(e.rank, noReviews.find((x) => x.course.id === e.course.id).rank, 'rank stable across sorts');
    });
    ok('rankings: search, type filter, sorts, stable rank badges');

    // --- tee sheet -----------------------------------------------------------
    const dates = teeTimes.bookableDates();
    assert.strictEqual(dates.length, teeTimes.BOOKING_WINDOW_DAYS, 'booking window length');
    assert.strictEqual(dates[0].key, teeTimes.todayKey(), 'window starts today');

    const tomorrow = dates[1].key;
    const course = getCourseById('harding-park');
    const sheet = teeTimes.getTeeSheet(course.id, tomorrow, []);
    assert(sheet.length > 20, 'sheet has slots');
    assert(sheet.every((s) => s.spotsAvailable >= 0 && s.spotsAvailable <= 4), 'availability in range');
    assert(sheet.every((s) => s.pricePerPlayer > 0), 'every slot priced');
    // Deterministic: the same day renders identically twice.
    assert.deepStrictEqual(
      teeTimes.getTeeSheet(course.id, tomorrow, []).map((s) => s.spotsAvailable),
      sheet.map((s) => s.spotsAvailable),
      'tee sheet is deterministic'
    );
    // Twilight is cheaper than prime time.
    const first = sheet[0].pricePerPlayer;
    const last = sheet[sheet.length - 1].pricePerPlayer;
    assert(last < first || last < Math.max(...sheet.map((s) => s.pricePerPlayer)), 'twilight discounted');
    ok('tee sheet: deterministic slots, priced, availability bounded');

    // Today's sheet must not offer times that have already passed.
    const todaySheet = teeTimes.getTeeSheet(course.id, teeTimes.todayKey(), []);
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    assert(
      todaySheet.filter((s) => s.minutes <= nowMinutes).every((s) => s.isPast && !s.isBookable),
      'past slots are not bookable'
    );
    ok('tee sheet: past times blocked');

    // --- booking -------------------------------------------------------------
    const open = sheet.find((s) => s.spotsAvailable >= 2);
    const booking = await teeTimes.bookTeeTime({ slot: open, players: 2, cart: true, userId: 'user-a' });
    assert.strictEqual(booking.status, 'confirmed');
    assert.strictEqual(booking.confirmationCode.length, 6, 'confirmation code');
    assert.strictEqual(
      booking.total,
      open.pricePerPlayer * 2 + (open.cartFee || 0) * 2,
      'total includes cart'
    );

    // The booked slot now shows fewer open spots on a re-render.
    const after = teeTimes.getTeeSheet(course.id, tomorrow, [booking]).find((s) => s.minutes === open.minutes);
    assert.strictEqual(after.spotsAvailable, open.spotsAvailable - 2, 'own booking consumes spots');
    assert(after.myBooking, 'slot flags my booking');
    ok('booking: writes to db, prices correctly, reduces availability');

    // Overbooking and past times are refused.
    await assert.rejects(
      () => teeTimes.bookTeeTime({ slot: after, players: 4, userId: 'user-a' }),
      /spot|filled/,
      'overbooking rejected'
    );
    await assert.rejects(
      () => teeTimes.bookTeeTime({ slot: { ...open, isPast: true }, players: 1, userId: 'user-a' }),
      /passed/,
      'past booking rejected'
    );
    ok('booking: overbooking and past times rejected');

    // Cancel moves it out of upcoming.
    let all = await teeTimes.getBookings('user-a');
    assert.strictEqual(teeTimes.splitBookings(all).upcoming.length, 1);
    await teeTimes.cancelBooking(booking.id, 'user-a');
    all = await teeTimes.getBookings('user-a');
    assert.strictEqual(teeTimes.splitBookings(all).upcoming.length, 0, 'cancelled leaves upcoming');
    assert.strictEqual(teeTimes.splitBookings(all).history.length, 1, 'cancelled shows in history');
    ok('booking: cancel moves to history');

    // --- data deletion -------------------------------------------------------
    // Use the same module instance the services wrote through (the app only ever
    // has one; the db2 copy above exists purely to prove reload-from-storage).
    const exported = await db.exportUserData('user-a');
    assert.strictEqual(exported.tables.reviews.length, 1, 'export includes reviews');
    assert.strictEqual(exported.tables.bookings.length, 1, 'export includes bookings');
    await db.clearUserData('user-a');
    assert.strictEqual((await db.all(db.TABLES.BOOKINGS, 'user-a')).length, 0, 'user data cleared');
    // And it is gone from storage, not just from the cache.
    const db3 = reload('src/services/db.js');
    await db3.openDb('user-a');
    assert.strictEqual((await db3.all(db3.TABLES.REVIEWS)).length, 0, 'cleared rows gone from storage');
    ok('db: export + clear user data');

  },
};
