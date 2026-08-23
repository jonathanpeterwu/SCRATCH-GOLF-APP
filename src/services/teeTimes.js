import { getCourseById } from '../data/courses';
import { TABLES, all, find, insert, update, generateConfirmationCode } from './db';

// Public tee sheet + booking engine.
//
// Each course publishes a tee sheet window (first tee, last tee, interval). We
// expand that into slots for a given day and then subtract two things:
//
//   * "public demand" - other golfers already on the sheet. There is no shared
//     backend here, so demand is derived deterministically from the course id and
//     the slot's date/time. The same slot always shows the same availability on
//     every render and every app launch, which is what a real tee sheet does.
//   * the golfer's own bookings from the private db.

export const MAX_PLAYERS_PER_SLOT = 4;
export const BOOKING_WINDOW_DAYS = 14;

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

// --- date helpers -----------------------------------------------------------

/** 'YYYY-MM-DD' in the device's local timezone (Date#toISOString would shift it). */
export const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fromDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const todayKey = () => toDateKey(new Date());

/** The days a golfer is allowed to book, starting today. */
export const bookableDates = (days = BOOKING_WINDOW_DAYS) => {
  const start = new Date();
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    return {
      key: toDateKey(date),
      date,
      weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
      day: date.getDate(),
      month: date.toLocaleDateString(undefined, { month: 'short' }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: offset === 0,
    };
  });
};

export const formatTime = (minutesFromMidnight) => {
  const hours24 = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${`${minutes}`.padStart(2, '0')} ${suffix}`;
};

export const formatDateLabel = (dateKey) =>
  fromDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

const parseClock = (clock) => {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
};

// --- pricing ----------------------------------------------------------------

/**
 * Green fee for one player in a slot: the course's weekday/weekend rate, with the
 * usual twilight and early-bird discounts applied.
 */
export const slotPrice = (course, dateKey, minutes) => {
  const { teeSheet } = course;
  const isWeekend = [0, 6].includes(fromDateKey(dateKey).getDay());
  const base = isWeekend ? teeSheet.weekendFee : teeSheet.weekdayFee;

  const firstTee = parseClock(teeSheet.firstTee);
  const lastTee = parseClock(teeSheet.lastTee);
  const dayLength = Math.max(1, lastTee - firstTee);
  const progress = (minutes - firstTee) / dayLength;

  let multiplier = 1;
  if (progress >= 0.75) multiplier = 0.6; // twilight
  else if (progress >= 0.55) multiplier = 0.8; // late afternoon
  else if (progress <= 0.1) multiplier = 0.85; // first off

  return Math.round((base * multiplier) / 5) * 5;
};

// --- deterministic public demand -------------------------------------------

// Small string hash (FNV-1a). Same input, same output, on every device.
const hashString = (input) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) / 0xffffffff;
};

/** How many of the 4 spots other golfers already hold in this slot. */
const publicDemand = (course, dateKey, minutes) => {
  const noise = hashString(`${course.id}|${dateKey}|${minutes}`);
  const date = fromDateKey(dateKey);
  const isWeekend = [0, 6].includes(date.getDay());

  const firstTee = parseClock(course.teeSheet.firstTee);
  const lastTee = parseClock(course.teeSheet.lastTee);
  const progress = (minutes - firstTee) / Math.max(1, lastTee - firstTee);

  // Prime time is mid-morning; dawn and twilight stay open longer.
  let pressure = 0.35;
  if (progress > 0.15 && progress < 0.5) pressure += 0.25;
  if (progress > 0.85) pressure -= 0.15;
  if (isWeekend) pressure += 0.15;
  // The better the course, the fuller the sheet.
  pressure += ((course.editorialScore ?? 80) - 80) / 150;
  pressure = Math.max(0.1, Math.min(0.95, pressure));

  // Noise carries most of the weight so a sheet has real variety - some full
  // groups, some wide open - rather than every slot landing on the average.
  const load = noise * 0.9 + pressure * 0.6 - 0.25;
  const taken = Math.round(load * MAX_PLAYERS_PER_SLOT);
  return Math.max(0, Math.min(MAX_PLAYERS_PER_SLOT, taken));
};

// --- tee sheet --------------------------------------------------------------

const isPastSlot = (dateKey, minutes) => {
  const now = new Date();
  if (dateKey > toDateKey(now)) return false;
  if (dateKey < toDateKey(now)) return true;
  return minutes <= now.getHours() * 60 + now.getMinutes();
};

/**
 * Every slot on a course's sheet for one day.
 * @param {string} courseId
 * @param {string} dateKey 'YYYY-MM-DD'
 * @param {Array} bookings the golfer's own bookings (from the private db)
 */
export const getTeeSheet = (courseId, dateKey, bookings = []) => {
  const course = getCourseById(courseId);
  if (!course) return [];

  const { teeSheet } = course;
  const firstTee = parseClock(teeSheet.firstTee);
  const lastTee = parseClock(teeSheet.lastTee);
  const interval = teeSheet.intervalMinutes || 10;

  const mine = bookings.filter(
    (booking) =>
      booking.courseId === courseId &&
      booking.date === dateKey &&
      booking.status === BOOKING_STATUS.CONFIRMED
  );

  const slots = [];
  for (let minutes = firstTee; minutes <= lastTee; minutes += interval) {
    const myBooking = mine.find((booking) => booking.teeTimeMinutes === minutes);
    const takenByOthers = publicDemand(course, dateKey, minutes);
    const takenByMe = myBooking ? myBooking.players : 0;
    const available = Math.max(0, MAX_PLAYERS_PER_SLOT - takenByOthers - takenByMe);
    const past = isPastSlot(dateKey, minutes);

    slots.push({
      id: `${courseId}_${dateKey}_${minutes}`,
      courseId,
      date: dateKey,
      minutes,
      time: formatTime(minutes),
      pricePerPlayer: slotPrice(course, dateKey, minutes),
      cartFee: teeSheet.cartFee || 0,
      spotsAvailable: available,
      spotsTotal: MAX_PLAYERS_PER_SLOT,
      isPast: past,
      isBookable: available > 0 && !past,
      myBooking: myBooking || null,
    });
  }
  return slots;
};

/** Cheapest bookable slot on a day - used for the "from $X" line on course cards. */
export const cheapestSlot = (courseId, dateKey, bookings = []) => {
  const bookable = getTeeSheet(courseId, dateKey, bookings).filter((slot) => slot.isBookable);
  if (bookable.length === 0) return null;
  return bookable.reduce((cheapest, slot) =>
    slot.pricePerPlayer < cheapest.pricePerPlayer ? slot : cheapest
  );
};

// --- bookings ---------------------------------------------------------------

export const validateBooking = ({ slot, players }) => {
  if (!slot) return 'That tee time is no longer on the sheet.';
  if (slot.isPast) return 'That tee time has already passed.';
  if (players < 1 || players > MAX_PLAYERS_PER_SLOT) {
    return `Groups are 1 to ${MAX_PLAYERS_PER_SLOT} players.`;
  }
  if (players > slot.spotsAvailable) {
    return slot.spotsAvailable === 0
      ? 'That tee time just filled up.'
      : `Only ${slot.spotsAvailable} ${slot.spotsAvailable === 1 ? 'spot' : 'spots'} left in that group.`;
  }
  if (slot.date > toDateKey(new Date(Date.now() + BOOKING_WINDOW_DAYS * 86400000))) {
    return `Tee times open ${BOOKING_WINDOW_DAYS} days in advance.`;
  }
  return null;
};

/**
 * Write a booking to the private db.
 * @returns {Promise<object>} the stored booking, including its confirmation code
 */
export const bookTeeTime = async ({ slot, players, cart = false, notes = '', userId }) => {
  const error = validateBooking({ slot, players });
  if (error) throw new Error(error);

  const course = getCourseById(slot.courseId);
  const cartTotal = cart ? (slot.cartFee || 0) * players : 0;

  return insert(
    TABLES.BOOKINGS,
    {
      courseId: slot.courseId,
      courseName: course?.name || slot.courseId,
      date: slot.date,
      teeTimeMinutes: slot.minutes,
      teeTime: slot.time,
      players,
      cart,
      notes: notes.trim(),
      pricePerPlayer: slot.pricePerPlayer,
      total: slot.pricePerPlayer * players + cartTotal,
      status: BOOKING_STATUS.CONFIRMED,
      confirmationCode: generateConfirmationCode(),
    },
    userId
  );
};

export const cancelBooking = async (bookingId, userId) =>
  update(TABLES.BOOKINGS, bookingId, { status: BOOKING_STATUS.CANCELLED }, userId);

export const getBookings = async (userId) => all(TABLES.BOOKINGS, userId);

export const getBookingsForCourse = async (courseId, userId) =>
  find(TABLES.BOOKINGS, (booking) => booking.courseId === courseId, userId);

/** A booking's tee time as a real Date, for sorting upcoming vs. past. */
export const bookingDateTime = (booking) => {
  const date = fromDateKey(booking.date);
  date.setMinutes(booking.teeTimeMinutes || 0);
  return date;
};

export const isUpcoming = (booking) =>
  booking.status === BOOKING_STATUS.CONFIRMED && bookingDateTime(booking).getTime() >= Date.now();

/** Split bookings into the two lists the Tee Times tab shows. */
export const splitBookings = (bookings = []) => {
  const upcoming = bookings
    .filter(isUpcoming)
    .sort((a, b) => bookingDateTime(a) - bookingDateTime(b));
  const history = bookings
    .filter((booking) => !isUpcoming(booking))
    .sort((a, b) => bookingDateTime(b) - bookingDateTime(a));
  return { upcoming, history };
};
