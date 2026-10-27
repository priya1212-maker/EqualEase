import { samplePlaces } from '../data/samplePlaces';
import { loadSavedPlaceIds, saveSavedPlaceIds } from './savedPlacesStorage';
import { loadUserReports, submitUserReportToStorage } from './userReportsStorage';
import { hasFirebaseConfig } from './firebaseApp';
import {
  loadFirestorePlaces,
  loadFirestoreReports,
  submitFirestoreReport,
} from './firebaseRepositories';

export const isFirebaseRequested = process.env.EXPO_PUBLIC_DATA_MODE === 'firebase';

export async function loadPlaces() {
  if (!isFirebaseRequested) return samplePlaces;
  if (!hasFirebaseConfig) throw new Error('Firebase configuration is incomplete.');
  return loadFirestorePlaces();
}

export async function loadSavedIds(placeIds) {
  return loadSavedPlaceIds(placeIds);
}

export async function saveSavedIds(savedIds, placeIds) {
  return saveSavedPlaceIds(savedIds, placeIds);
}

export async function loadReports(placeIds) {
  if (!isFirebaseRequested) return loadUserReports(placeIds);
  if (!hasFirebaseConfig) throw new Error('Firebase configuration is incomplete.');
  return loadFirestoreReports();
}

export async function submitReport(report, placeIds) {
  if (!isFirebaseRequested) return submitUserReportToStorage(report, placeIds);
  if (!hasFirebaseConfig) throw new Error('Firebase configuration is incomplete.');
  return submitFirestoreReport(report);
}
