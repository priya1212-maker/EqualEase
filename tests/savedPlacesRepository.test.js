import assert from 'node:assert/strict';
import test from 'node:test';
import { createSavedPlacesRepository, SAVED_PLACES_STORAGE_KEY } from '../services/savedPlacesRepository.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    values,
    async getItem(key) { return values.has(key) ? values.get(key) : null; },
    async setItem(key, value) { values.set(key, value); },
  };
}

test('saved IDs survive creating a new repository instance (app restart)', async () => {
  const storage = createMemoryStorage();
  const firstRun = createSavedPlacesRepository(storage);
  await firstRun.save(['sample-cafe-north']);

  const nextRun = createSavedPlacesRepository(storage);
  assert.deepEqual(await nextRun.load(), ['sample-cafe-north']);
  assert.equal(storage.values.has(SAVED_PLACES_STORAGE_KEY), true);
});

test('removing a saved place persists an empty list', async () => {
  const storage = createMemoryStorage();
  const repository = createSavedPlacesRepository(storage);
  await repository.save(['sample-cafe-north']);
  await repository.save([]);
  assert.deepEqual(await createSavedPlacesRepository(storage).load(), []);
});

test('load returns an empty list when nothing has been saved', async () => {
  assert.deepEqual(await createSavedPlacesRepository(createMemoryStorage()).load(), []);
});

test('stored IDs are deduplicated and unknown IDs are discarded', async () => {
  const storage = createMemoryStorage();
  await storage.setItem(SAVED_PLACES_STORAGE_KEY, JSON.stringify([
    'sample-cafe-north', 'sample-cafe-north', 'not-a-sample-place', 7,
  ]));
  assert.deepEqual(await createSavedPlacesRepository(storage).load(), ['sample-cafe-north']);
});

test('invalid persisted JSON produces a load error the app can surface', async () => {
  const storage = createMemoryStorage();
  await storage.setItem(SAVED_PLACES_STORAGE_KEY, '{');
  await assert.rejects(createSavedPlacesRepository(storage).load(), SyntaxError);
});
