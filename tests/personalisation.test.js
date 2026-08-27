const assert = require('assert');
const { src } = require('./support/setup');

// The personalised layer: game profile, course fit, and the training agent.

const db = src('src/services/db.js');
const { COURSES, getCourseById, DESTINATIONS, formatFee } = src('src/data/courses.js');
const gameProfile = src('src/services/gameProfile.js');
const courseFit = src('src/services/courseFit.js');
const rankings = src('src/services/rankings.js');
const preview = src('src/services/coursePreview.js');
const playLog = src('src/services/playLog.js');

// A golfer with two logged rounds, so strokes gained drive the profile.
const ghinFor = (sg) => ({
  handicapIndex: 12.4,
  recentScores: [
    { date: '2026-05-01', score: 85, differential: 11.2, strokesGained: sg },
    { date: '2026-05-08', score: 88, differential: 12.6, strokesGained: sg },
  ],
});

module.exports = {
  name: 'game profile, course fit, and the training agent',
  run: async (ok) => {

    // --- catalog ------------------------------------------------------------
    const ids = COURSES.map((c) => c.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'ids unique');
    const destinations = new Set(COURSES.map((c) => c.destination));
    ['pinehurst', 'scotland', 'england'].forEach((d) => {
      const count = COURSES.filter((c) => c.destination === d).length;
      assert(count >= 5, `${d} has ${count} courses`);
    });
    DESTINATIONS.forEach(({ key }) => assert(destinations.has(key), `${key} has courses`));
    COURSES.forEach((c) => {
      ['driving', 'approach', 'aroundGreen', 'putting', 'wind', 'groundGame', 'penalty'].forEach((k) => {
        const v = c.traits?.[k];
        assert(typeof v === 'number' && v >= 0 && v <= 100, `${c.id}.traits.${k} in range`);
      });
      assert(['USD', 'GBP'].includes(c.currency), `${c.id} has a currency`);
      assert(c.country && c.destination, `${c.id} has country + destination`);
    });
    assert.strictEqual(formatFee(320, 'GBP'), '£320');
    assert.strictEqual(formatFee(675, 'USD'), '$675');
    ok(`catalog: ${COURSES.length} courses across ${destinations.size} destinations, traits + currency valid`);

    // --- profile ------------------------------------------------------------
    const scratchish = gameProfile.buildGameProfile(
      ghinFor({ offTee: 0.8, approach: -0.2, aroundGreen: -1.6, putting: 0.1 })
    );
    assert.strictEqual(scratchish.weakest, 'aroundGreen', 'weakest category detected');
    assert.strictEqual(scratchish.strongest, 'driving', 'strongest category detected');
    assert(scratchish.skills.driving > scratchish.skills.aroundGreen, 'skills ordered by SG');
    assert(scratchish.focus.includes('aroundGreen'), 'focus defaults to the weakness');
    ok('profile: strokes gained -> skills, weakest/strongest, default focus');

    const declared = gameProfile.buildGameProfile(
      ghinFor({ offTee: 0.8, approach: -0.2, aroundGreen: -1.6, putting: 0.1 }),
      { focus: ['driving'] }
    );
    assert.deepStrictEqual(declared.focus, ['driving'], 'declared focus overrides the numbers');
    ok('profile: declared focus wins over measurement');

    const noData = gameProfile.buildGameProfile(null);
    assert(Object.values(noData.skills).every((v) => v === noData.skills.driving), 'flat without data');
    assert.strictEqual(noData.hasRoundData, false);
    ok('profile: degrades to a flat estimate with no round data');

    // --- fit ----------------------------------------------------------------
    const shortGameCourse = getCourseById('pinehurst-no2'); // aroundGreen 95
    const drivingCourse = getCourseById('bethpage-black'); // driving 95, aroundGreen 70

    const sgFit = courseFit.evaluateFit(shortGameCourse, scratchish);
    const bbFit = courseFit.evaluateFit(drivingCourse, scratchish);
    assert(
      sgFit.training > bbFit.training,
      `short-game course trains this golfer more (${sgFit.training} vs ${bbFit.training})`
    );
    assert.strictEqual(sgFit.toughest.key, 'aroundGreen', 'biggest gap named correctly');
    assert(sgFit.focusTested.includes('aroundGreen'), 'focus area flagged as tested');
    ok('fit: training value tracks the golfer\'s weakness, not raw difficulty');

    // Mirror-image golfer: same total deficit, opposite category.
    const chipper = gameProfile.buildGameProfile(
      ghinFor({ offTee: -1.6, approach: -0.2, aroundGreen: 0.8, putting: 0.1 })
    );
    const sgFit2 = courseFit.evaluateFit(shortGameCourse, chipper);
    const bbFit2 = courseFit.evaluateFit(drivingCourse, chipper);

    // Every course must move in the right direction between the two golfers.
    assert(
      bbFit2.training > bbFit.training,
      `driving course trains the weak driver more (${bbFit2.training} vs ${bbFit.training})`
    );
    assert(
      sgFit.training > sgFit2.training,
      `short-game course trains the weak chipper more (${sgFit.training} vs ${sgFit2.training})`
    );

    // The purest case: a short course of wedges and putts is nearly worthless
    // training for a golfer whose problem is the tee shot.
    const cradle = getCourseById('pinehurst-cradle');
    const cradleChipper = courseFit.evaluateFit(cradle, scratchish).training;
    const cradleDriver = courseFit.evaluateFit(cradle, chipper).training;
    assert(
      cradleChipper - cradleDriver > 15,
      `short course separates the two golfers sharply (${cradleChipper} vs ${cradleDriver})`
    );
    ok('fit: training value tracks the golfer, not the course difficulty');

    // Comfort must be demand-weighted: mirror golfers should NOT score the same
    // on a course that leans on one of their categories.
    assert(
      bbFit2.comfort < bbFit.comfort,
      `weak driver is less comfortable at a driving course (${bbFit2.comfort} vs ${bbFit.comfort})`
    );
    assert(
      sgFit.comfort < sgFit2.comfort,
      `weak chipper is less comfortable at a short-game course (${sgFit.comfort} vs ${sgFit2.comfort})`
    );
    [sgFit, bbFit, sgFit2, bbFit2].forEach((f) => {
      assert(f.comfort >= 0 && f.comfort <= 100 && f.training >= 0 && f.training <= 100, 'scores bounded');
    });
    ok('fit: comfort is demand-weighted, so mirror golfers read differently');

    // Links unfamiliarity.
    const stAndrews = getCourseById('st-andrews-old');
    const noLinks = courseFit.evaluateFit(stAndrews, scratchish);
    const experienced = courseFit.evaluateFit(stAndrews, { ...scratchish, linksExperience: 90 });
    assert(
      noLinks.exposure.unfamiliarity > experienced.exposure.unfamiliarity,
      'links experience reduces unfamiliarity'
    );
    assert(experienced.comfort > noLinks.comfort, 'and raises comfort');
    ok('fit: links experience changes the read on a links course');

    // --- ranking ------------------------------------------------------------
    const byTraining = rankings.rankCourses([], { sort: 'training', profile: scratchish });
    const trainingValues = byTraining.map((e) => e.fit.training);
    assert(trainingValues.every((v, i) => i === 0 || trainingValues[i - 1] >= v), 'training sort desc');
    assert(
      byTraining[0].course.traits.aroundGreen >= 80,
      `top training pick (${byTraining[0].course.name}) tests the weakness`
    );

    const scotland = rankings.rankCourses([], { destinations: ['scotland'], profile: scratchish });
    assert(scotland.every((e) => e.course.destination === 'scotland'), 'destination filter');
    assert(scotland.length >= 5, 'scotland list populated');
    assert(rankings.rankCourses([], { query: 'Scotland' }).length >= 5, 'search by country');
    assert(rankings.rankCourses([], { query: 'Ross' }).length >= 1, 'search by architect still works');

    // Rank badges stay stable across the personalised sorts.
    const base = rankings.rankCourses([]);
    byTraining.forEach((e) => {
      assert.strictEqual(
        e.rank,
        base.find((x) => x.course.id === e.course.id).rank,
        'rank badge stable under training sort'
      );
    });
    ok('ranking: training/fit sorts, destination filter, stable rank badges');

    // --- play log -----------------------------------------------------------
    await db.openDb('golfer-1');
    await playLog.logRound({ courseId: 'st-andrews-old', userId: 'golfer-1' });
    await playLog.logRound({ courseId: 'north-berwick-west', userId: 'golfer-1' });
    const log = await playLog.getPlayLog('golfer-1');
    assert.strictEqual(log.length, 2);
    assert.strictEqual(log[0].destination, 'scotland', 'destination copied onto the row');
    assert(gameProfile.linksExperience(log) > 0, 'links rounds raise experience');
    assert(
      gameProfile.linksExperience(log) < gameProfile.linksExperience([...log, ...log, ...log]),
      'more rounds, more experience'
    );
    assert.strictEqual(playLog.roundsByDestination(log).scotland, 2);
    ok('play log: rounds recorded, feed links experience and destination counts');

    // --- training brief -----------------------------------------------------
    const bag = {
      driver: { brand: 'Titleist', model: 'TSR3', loft: '10.5' },
      woods: [], hybrids: [], irons: [{ number: '7' }], wedges: [{ loft: '56' }],
      putter: { brand: 'Scotty', model: 'Newport' },
    };
    const row = await preview.generatePreview({
      course: stAndrews, profile: scratchish, golfBag: bag, userId: 'golfer-1', useAI: false,
    });
    const brief = row.brief;
    assert.strictEqual(brief.source, 'local', 'falls back to the computed brief with no API key');
    assert(brief.asks.length > 0 && brief.whereExposed.length > 0, 'brief has content');
    assert(brief.prepPlan.length > 0, 'brief prescribes drills');
    assert(
      brief.prepPlan.some((d) => /wedge|chip|putt|green|knockdown/i.test(d.detail)),
      'drills address the short game / conditions'
    );
    assert(
      brief.bagNotes.some((n) => /fairway wood|hybrid/i.test(n)),
      'bag note catches the missing runner club for firm ground'
    );
    assert(brief.expectedScore.high > brief.expectedScore.low, 'score band ordered');
    assert(
      brief.expectedScore.courseHandicap > 12,
      `course handicap adjusts for slope/rating (${brief.expectedScore.courseHandicap})`
    );
    ok('brief: computed locally, drills + bag notes + score band all grounded');

    // Cache: same profile reuses, changed focus invalidates.
    const again = await preview.generatePreview({
      course: stAndrews, profile: scratchish, golfBag: bag, userId: 'golfer-1', useAI: false,
    });
    assert.strictEqual(again.id, row.id, 'cached brief reused');
    const refocused = { ...scratchish, focus: ['driving'] };
    const rebuilt = await preview.generatePreview({
      course: stAndrews, profile: refocused, golfBag: bag, userId: 'golfer-1', useAI: false,
    });
    assert.notStrictEqual(
      preview.profileSignature(scratchish),
      preview.profileSignature(refocused),
      'signature changes with focus'
    );
    assert.strictEqual(rebuilt.courseId, stAndrews.id);
    assert.strictEqual((await db.all(db.TABLES.PREVIEWS, 'golfer-1')).length, 1, 'one brief per course');
    ok('brief: cached per profile signature, rebuilt when the focus changes');

    // A parkland course should read differently from a links.
    const sawgrass = await preview.generatePreview({
      course: getCourseById('tpc-sawgrass-stadium'), profile: scratchish, golfBag: bag,
      userId: 'golfer-1', useAI: false,
    });
    assert.notDeepStrictEqual(sawgrass.brief.asks, brief.asks, 'briefs differ by course');
    ok('brief: course-specific, not a template');

  },
};
