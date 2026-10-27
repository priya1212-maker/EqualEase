import {
  ACCESSIBILITY_FEATURES,
  ACCESSIBILITY_STATUSES,
  samplePlaces,
} from '../data/samplePlaces.js';

export const USER_REPORTS_STORAGE_KEY = '@equalease/user-reports/v1';

const placeIds = new Set(samplePlaces.map((place) => place.id));
const featureKeys = new Set(ACCESSIBILITY_FEATURES.map((feature) => feature.key));
const statusKeys = new Set(Object.keys(ACCESSIBILITY_STATUSES));
const MAX_NOTE_LENGTH = 500;
const MAX_SOURCE_LENGTH = 240;

export function isValidObservationDate(value, today = localDateString()) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
    && value <= today;
}

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function validateUserReport(report, allowedPlaceIds = placeIds) {
  const errors = {};
  const validPlaceIds = allowedPlaceIds instanceof Set ? allowedPlaceIds : new Set(allowedPlaceIds);
  if (!validPlaceIds.has(report?.placeId)) errors.placeId = 'Choose a place from the list.';
  if (!featureKeys.has(report?.featureKey)) errors.featureKey = 'Choose an accessibility feature.';
  if (!statusKeys.has(report?.status)) errors.status = 'Choose a status.';
  if (!isValidObservationDate(report?.observationDate)) {
    errors.observationDate = 'Enter a real date in YYYY-MM-DD format that is not in the future.';
  }
  if (typeof report?.note !== 'string' || report.note.length > MAX_NOTE_LENGTH) {
    errors.note = `Notes must be ${MAX_NOTE_LENGTH} characters or fewer.`;
  }
  if (typeof report?.sourceContext !== 'string' || report.sourceContext.length > MAX_SOURCE_LENGTH) {
    errors.sourceContext = `Source or context must be ${MAX_SOURCE_LENGTH} characters or fewer.`;
  }
  return errors;
}

function normalizeStoredReport(report) {
  if (Object.keys(validateUserReport(report)).length > 0) return null;
  if (typeof report?.id !== 'string' || typeof report?.submittedAt !== 'string') return null;
  return {
    id: report.id,
    placeId: report.placeId,
    featureKey: report.featureKey,
    status: report.status,
    note: report.note.trim(),
    observationDate: report.observationDate,
    sourceContext: report.sourceContext.trim(),
    submittedAt: report.submittedAt,
    reportType: 'userReport',
    verificationStatus: 'unverified',
  };
}

export function createUserReportsRepository(storage, key = USER_REPORTS_STORAGE_KEY, allowedPlaceIds = placeIds) {
  return {
    async load() {
      const serialized = await storage.getItem(key);
      if (serialized == null) return [];
      const parsed = JSON.parse(serialized);
      if (!Array.isArray(parsed)) throw new Error('User report data must be a list.');
      return parsed.map(normalizeStoredReport).filter(Boolean);
    },

    async submit(report, validPlaceIds = allowedPlaceIds) {
      const errors = validateUserReport(report, validPlaceIds);
      if (Object.keys(errors).length > 0) {
        const error = new Error('The report is missing valid required information.');
        error.validationErrors = errors;
        throw error;
      }

      const savedReport = {
        id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        placeId: report.placeId,
        featureKey: report.featureKey,
        status: report.status,
        note: report.note.trim(),
        observationDate: report.observationDate,
        sourceContext: report.sourceContext.trim(),
        submittedAt: new Date().toISOString(),
        reportType: 'userReport',
        verificationStatus: 'unverified',
      };
      const currentReports = await this.load();
      await storage.setItem(key, JSON.stringify([...currentReports, savedReport]));
      return savedReport;
    },
  };
}
