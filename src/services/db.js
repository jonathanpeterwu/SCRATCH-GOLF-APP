import AsyncStorage from '@react-native-async-storage/async-storage';

// Private on-device database.
//
// Everything a golfer creates - course ratings, reviews, tee time bookings - is
// stored here and nowhere else. Three properties keep it private:
//
//   1. Keys are namespaced per user id, so two accounts on one device never see
//      each other's rows.
//   2. It uses AsyncStorage directly rather than services/storage.js, which means
//      none of it is ever pushed to iCloud or any other remote.
//   3. clearUserData() removes every row for a user in one call (sign out, or a
//      "delete my data" request).
//
// The API is a small document store: tables hold arrays of records, each record
// gets an id and timestamps, and every write flushes the whole table. That is
// plenty at this size and keeps the storage format inspectable JSON.

const DB_PREFIX = '@golf_coach_db';
const DB_VERSION = 'v1';

export const TABLES = {
  REVIEWS: 'reviews',
  BOOKINGS: 'bookings',
  PROFILE: 'profile', // single row: the golfer's declared focus and goal
  PLAY_LOG: 'playLog', // courses played, with the traits they were played on
  PREVIEWS: 'previews', // cached training briefs, keyed by course
};

const TABLE_NAMES = Object.values(TABLES);

// userId -> { tableName -> records[] }
const cache = {};
let activeUserId = null;

const tableKey = (userId, table) => `${DB_PREFIX}:${DB_VERSION}:${userId}:${table}`;

const assertTable = (table) => {
  if (!TABLE_NAMES.includes(table)) {
    throw new Error(`Unknown table "${table}". Expected one of: ${TABLE_NAMES.join(', ')}`);
  }
};

const requireUser = (userId) => {
  const id = userId || activeUserId;
  if (!id) {
    throw new Error('No active database user. Call openDb(userId) first.');
  }
  return id;
};

// Ids only need to be unique within one device's database.
let idCounter = 0;
const generateId = (prefix = 'rec') => {
  idCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${random}`;
};

// Confirmation codes are what the golfer reads out at the pro shop, so they are
// short and unambiguous (no O/0/I/1).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const generateConfirmationCode = () => {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
};

const readTable = async (userId, table) => {
  if (cache[userId]?.[table]) {
    return cache[userId][table];
  }

  let records = [];
  try {
    const raw = await AsyncStorage.getItem(tableKey(userId, table));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        records = parsed;
      } else {
        console.warn(`Discarding malformed table "${table}" - expected an array`);
      }
    }
  } catch (error) {
    // A corrupted table should not take the app down; start it empty instead.
    console.warn(`Error reading table "${table}":`, error);
  }

  cache[userId] = { ...(cache[userId] || {}), [table]: records };
  return records;
};

const writeTable = async (userId, table, records) => {
  cache[userId] = { ...(cache[userId] || {}), [table]: records };
  await AsyncStorage.setItem(tableKey(userId, table), JSON.stringify(records));
  return records;
};

/**
 * Open (and lazily create) the database for a user. Safe to call repeatedly -
 * later calls just warm the cache.
 */
export const openDb = async (userId) => {
  if (!userId) throw new Error('openDb requires a user id');
  activeUserId = userId;
  await Promise.all(TABLE_NAMES.map((table) => readTable(userId, table)));
  return activeUserId;
};

export const getActiveUserId = () => activeUserId;

export const closeDb = () => {
  activeUserId = null;
};

export const all = async (table, userId) => {
  assertTable(table);
  return [...(await readTable(requireUser(userId), table))];
};

export const find = async (table, predicate, userId) => {
  const records = await all(table, userId);
  return records.filter(predicate);
};

export const findOne = async (table, predicate, userId) => {
  const records = await all(table, userId);
  return records.find(predicate) || null;
};

export const insert = async (table, record, userId) => {
  assertTable(table);
  const id = requireUser(userId);
  const now = new Date().toISOString();
  const saved = {
    ...record,
    id: record.id || generateId(table.slice(0, 3)),
    createdAt: record.createdAt || now,
    updatedAt: now,
  };
  const records = await readTable(id, table);
  await writeTable(id, table, [...records, saved]);
  return saved;
};

/**
 * Insert, or replace the existing record that `predicate` matches. Used for
 * ratings, where a golfer has at most one review per course.
 */
export const upsert = async (table, predicate, record, userId) => {
  assertTable(table);
  const id = requireUser(userId);
  const existing = await findOne(table, predicate, id);
  if (!existing) {
    return insert(table, record, id);
  }
  return update(table, existing.id, record, id);
};

export const update = async (table, recordId, changes, userId) => {
  assertTable(table);
  const id = requireUser(userId);
  const records = await readTable(id, table);
  let updated = null;
  const next = records.map((row) => {
    if (row.id !== recordId) return row;
    updated = { ...row, ...changes, id: row.id, createdAt: row.createdAt, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) return null;
  await writeTable(id, table, next);
  return updated;
};

export const remove = async (table, recordId, userId) => {
  assertTable(table);
  const id = requireUser(userId);
  const records = await readTable(id, table);
  const next = records.filter((row) => row.id !== recordId);
  if (next.length === records.length) return false;
  await writeTable(id, table, next);
  return true;
};

/** Delete every row belonging to a user. */
export const clearUserData = async (userId) => {
  const id = requireUser(userId);
  await AsyncStorage.multiRemove(TABLE_NAMES.map((table) => tableKey(id, table)));
  delete cache[id];
  return true;
};

/** Everything the app holds for a user, for a "download my data" style export. */
export const exportUserData = async (userId) => {
  const id = requireUser(userId);
  const tables = {};
  for (const table of TABLE_NAMES) {
    tables[table] = await all(table, id);
  }
  return { version: DB_VERSION, userId: id, exportedAt: new Date().toISOString(), tables };
};
