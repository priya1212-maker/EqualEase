import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { getFirebaseServices, ensureAnonymousUser } from './firebaseApp';
import { mapFirestorePlace, mapFirestoreReport } from './firestoreModels';

export async function loadFirestorePlaces() {
  const { db } = getFirebaseServices();
  const placesQuery = query(collection(db, 'places'), where('published', '==', true));
  const result = await getDocs(placesQuery);
  return result.docs.map(mapFirestorePlace);
}

export async function loadFirestoreReports() {
  const { db } = getFirebaseServices();
  const reportsQuery = query(collection(db, 'accessibilityReports'), orderBy('submittedAt', 'desc'));
  const result = await getDocs(reportsQuery);
  return result.docs.map(mapFirestoreReport);
}

export async function submitFirestoreReport(report) {
  const { db, auth } = getFirebaseServices();
  const user = await ensureAnonymousUser(auth);
  const reference = await addDoc(collection(db, 'accessibilityReports'), {
    ...report,
    observationDate: Timestamp.fromDate(new Date(`${report.observationDate}T12:00:00.000Z`)),
    note: report.note.trim(),
    sourceContext: report.sourceContext.trim(),
    submittedAt: serverTimestamp(),
    authorUid: user.uid,
    reportType: 'userReport',
    verificationStatus: 'unverified',
  });
  return {
    ...report,
    id: reference.id,
    submittedAt: new Date().toISOString(),
    reportType: 'userReport',
    verificationStatus: 'unverified',
  };
}
