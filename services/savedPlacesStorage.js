import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSavedPlacesRepository } from './savedPlacesRepository';

const savedPlacesRepository = createSavedPlacesRepository(AsyncStorage);

export const loadSavedPlaceIds = (validPlaceIds) => validPlaceIds
  ? createSavedPlacesRepository(AsyncStorage, undefined, validPlaceIds).load()
  : savedPlacesRepository.load();
export const saveSavedPlaceIds = (placeIds, validPlaceIds) => validPlaceIds
  ? createSavedPlacesRepository(AsyncStorage, undefined, validPlaceIds).save(placeIds)
  : savedPlacesRepository.save(placeIds);
