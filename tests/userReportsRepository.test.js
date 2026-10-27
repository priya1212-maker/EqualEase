import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createUserReportsRepository,
  isValidObservationDate,
  localDateString,
  USER_REPORTS_STORAGE_KEY,
  validateUserReport,
} from '../services/userReportsRepository.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    values,
    async getItem(key) { return values.has(key) ? values.get(key) : null; },
    async setItem(key, value) { values.set(key, value); },
  };
}

function validReport(overrides = {}) {
  return {
    placeId: 'sample-cafe-north',
    featureKey: 'stepFreeEntrance',
    status: 'yes',
    note: 'Observed a step-free entrance.',
    observationDate: '2025-02-14',
    sourceContext: 'Observed during a visit.',
    ...overrides,
  };
}

test('a valid user report is persisted and survives a new app repository instance', async () => {
  const storage = createMemoryStorage();
  const submitted = await createUserReportsRepository(storage).submit(validReport());
  const reportsAfterRestart = await createUserReportsRepository(storage).load();

  assert.equal(reportsAfterRestart.length, 1);
  assert.equal(reportsAfterRestart[0].id, submitted.id);
  assert.equal(reportsAfterRestart[0].reportType, 'userReport');
  assert.equal(reportsAfterRestart[0].verificationStatus, 'unverified');
  assert.equal(Object.hasOwn(reportsAfterRestart[0], 'verified'), false);
  assert.equal(storage.values.has(USER_REPORTS_STORAGE_KEY), true);
});

test('required place, feature, status, and observation date are validated', () => {
  const errors = validateUserReport(validReport({
    placeId: 'unknown-place',
    featureKey: 'unknown-feature',
    status: 'maybe',
    observationDate: '2025-02-30',
  }));
  assert.deepEqual(Object.keys(errors).sort(), ['featureKey', 'observationDate', 'placeId', 'status']);
});

test('notes and source context have enforced maximum lengths', () => {
  const errors = validateUserReport(validReport({
    note: 'n'.repeat(501),
    sourceContext: 's'.repeat(241),
  }));
  assert.ok(errors.note);
  assert.ok(errors.sourceContext);
});

test('observation dates must be real calendar days no later than today', () => {
  assert.equal(isValidObservationDate('2024-02-29', '2025-01-01'), true);
  assert.equal(isValidObservationDate('2025-02-29', '2026-01-01'), false);
  assert.equal(isValidObservationDate('2025-01-02', '2025-01-01'), false);
  assert.match(localDateString(new Date(2025, 0, 2)), /^2025-01-02$/);
});

test('loaded reports discard invalid records and force their unverified report type', async () => {
  const storage = createMemoryStorage();
  const record = {
    id: 'report-existing',
    ...validReport(),
    submittedAt: '2025-02-14T12:00:00.000Z',
    reportType: 'verifiedVenueRecord',
    verificationStatus: 'verified',
    verified: true,
  };
  await storage.setItem(USER_REPORTS_STORAGE_KEY, JSON.stringify([record, { id: 'bad' }]));
  const [loaded] = await createUserReportsRepository(storage).load();
  assert.equal(loaded.reportType, 'userReport');
  assert.equal(loaded.verificationStatus, 'unverified');
  assert.equal(Object.hasOwn(loaded, 'verified'), false);
});

test('storage write errors reject submission instead of claiming it was saved', async () => {
  const storage = {
    async getItem() { return null; },
    async setItem() { throw new Error('device storage unavailable'); },
  };
  await assert.rejects(createUserReportsRepository(storage).submit(validReport()), /device storage unavailable/);
});
