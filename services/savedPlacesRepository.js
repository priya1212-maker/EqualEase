import { samplePlaces } from '../data/samplePlaces.js';

export const SAVED_PLACES_STORAGE_KEY = '@equalease/saved-place-ids/v1';

const knownPlaceIds = new Set(samplePlaces.map((place) => place.id));

/** Creates the small storage boundary used by the app and by persistence tests. */
export function createSavedPlacesRepository(storage, key = SAVED_PLACES_STORAGE_KEY, allowedPlaceIds = knownPlaceIds) {
  const allowedIds = () => new Set(allowedPlaceIds instanceof Set ? allowedPlaceIds : allowedPlaceIds);
  return {
    async load() {
      const serializedIds = await storage.getItem(key);
      if (serializedIds == null) return [];

      const parsedIds = JSON.parse(serializedIds);
      if (!Array.isArray(parsedIds)) throw new Error('Saved places data must be a list.');

      const validIds = allowedIds();
      return [...new Set(parsedIds.filter((id) => typeof id === 'string' && validIds.has(id)))];
    },

    async save(placeIds) {
      const allowed = allowedIds();
      const validIds = [...new Set(placeIds.filter((id) => typeof id === 'string' && allowed.has(id)))];
      await storage.setItem(key, JSON.stringify(validIds));
    },
  };
}
