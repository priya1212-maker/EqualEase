import assert from 'node:assert/strict';
import test from 'node:test';
import { mapFirestorePlace, mapFirestoreReport } from '../services/firestoreModels.js';

test('Firestore places map verification metadata without changing accessibility values', () => {
  const place = mapFirestorePlace({
    id: 'venue-1',
    data: () => ({
      name: 'Example venue',
      category: 'Cafes',
      location: 'Central district',
      coordinates: { latitude: 12.9716, longitude: 77.5946 },
      accessibility: { stepFreeEntrance: 'unknown' },
      informationSource: { label: 'Venue publication' },
      verification: { status: 'verified', verifiedAt: new Date('2026-10-01T00:00:00.000Z') },
    }),
  });
  assert.equal(place.id, 'venue-1');
  assert.deepEqual(place.coordinates, { latitude: 12.9716, longitude: 77.5946 });
  assert.equal(place.accessibility.stepFreeEntrance, 'unknown');
  assert.equal(place.informationSource.verified, true);
  assert.equal(place.lastVerifiedAt, '2026-10-01T00:00:00.000Z');
});

test('Firestore community reports are always presented as unverified', () => {
  const report = mapFirestoreReport({
    id: 'report-1',
    data: () => ({
      placeId: 'venue-1',
      featureKey: 'stepFreeEntrance',
      status: 'yes',
      observationDate: '2026-10-20',
      verificationStatus: 'verified',
      reportType: 'something-else',
      submittedAt: new Date('2026-10-21T00:00:00.000Z'),
      observationDate: new Date('2026-10-20T12:00:00.000Z'),
    }),
  });
  assert.equal(report.reportType, 'userReport');
  assert.equal(report.verificationStatus, 'unverified');
  assert.equal(report.note, '');
  assert.equal(report.observationDate, '2026-10-20');
});

test('invalid or missing Firestore coordinates remain unavailable', () => {
  const place = mapFirestorePlace({ id: 'venue-no-coordinates', data: () => ({ name: 'No pin' }) });
  assert.equal(place.coordinates, null);
});
