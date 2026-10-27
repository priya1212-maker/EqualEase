import { colors } from '../theme/index.js';

export const ACCESSIBILITY_STATUSES = {
  yes: { label: 'Yes', color: colors.statusYes },
  no: { label: 'No', color: colors.statusNo },
  unknown: { label: 'Unknown', color: colors.statusUnknown },
  notApplicable: { label: 'Not applicable', color: colors.statusNotApplicable },
};

export const PLACE_CATEGORIES = [
  'Cafes',
  'Restaurants',
  'Hospitals & clinics',
  'Colleges & universities',
  'Shopping malls',
  'Parks & public places',
  'Transport',
  'Hotels & attractions',
  'Public Places',
];

export const ALL_CATEGORIES = 'All places';

export const ACCESSIBILITY_FEATURES = [
  { key: 'stepFreeEntrance', label: 'Step-free entrance', icon: '🚪' },
  { key: 'wheelchairRamp', label: 'Wheelchair ramp', icon: '♿' },
  { key: 'elevator', label: 'Elevator', icon: '🛗' },
  { key: 'accessibleWashroom', label: 'Accessible washroom', icon: '🚻' },
  { key: 'accessibleParking', label: 'Accessible parking', icon: '🅿' },
  { key: 'doorwayAccessibility', label: 'Doorway accessibility', icon: '↔' },
];

// Fictional development examples only. None of these details are verified.
export const samplePlaces = [
  {
    id: 'sample-cafe-north',
    name: 'Sample Corner Cafe',
    category: 'Cafes',
    location: 'North District, Sample City',
    informationSource: { type: 'sample', label: 'Development sample data', verified: false },
    lastReportedAt: null,
    lastVerifiedAt: null,
    accessibility: {
      stepFreeEntrance: 'yes',
      wheelchairRamp: 'unknown',
      accessibleWashroom: 'unknown',
      accessibleParking: 'no',
      elevator: 'notApplicable',
    },
  },
  {
    id: 'sample-restaurant-river',
    name: 'Sample Riverside Kitchen',
    category: 'Restaurants',
    location: 'Riverside Quarter, Sample City',
    informationSource: { type: 'sample', label: 'Development sample data', verified: false },
    lastReportedAt: null,
    lastVerifiedAt: null,
    accessibility: {
      stepFreeEntrance: 'unknown',
      wheelchairRamp: 'yes',
      accessibleWashroom: 'yes',
      accessibleParking: 'yes',
      elevator: 'notApplicable',
    },
  },
  {
    id: 'sample-hospital-central',
    name: 'Sample Central Clinic',
    category: 'Hospitals',
    location: 'Central Ward, Sample City',
    informationSource: { type: 'sample', label: 'Development sample data', verified: false },
    lastReportedAt: null,
    lastVerifiedAt: null,
    accessibility: {
      stepFreeEntrance: 'yes',
      wheelchairRamp: 'yes',
      accessibleWashroom: 'unknown',
      accessibleParking: 'yes',
      elevator: 'yes',
      doorwayAccessibility: 'yes',
    },
  },
  {
    id: 'sample-college-greenfield',
    name: 'Sample Greenfield College',
    category: 'Colleges',
    location: 'Greenfield Campus, Sample City',
    informationSource: { type: 'sample', label: 'Development sample data', verified: false },
    lastReportedAt: null,
    lastVerifiedAt: null,
    accessibility: {
      stepFreeEntrance: 'no',
      wheelchairRamp: 'no',
      accessibleWashroom: 'yes',
      accessibleParking: 'unknown',
      elevator: 'yes',
      doorwayAccessibility: 'unknown',
    },
  },
  {
    id: 'sample-library-old-town',
    name: 'Sample Old Town Library',
    category: 'Public Places',
    location: 'Old Town, Sample City',
    informationSource: { type: 'sample', label: 'Development sample data', verified: false },
    lastReportedAt: null,
    lastVerifiedAt: null,
    accessibility: {
      stepFreeEntrance: 'yes',
      wheelchairRamp: 'notApplicable',
      accessibleWashroom: 'notApplicable',
      accessibleParking: 'unknown',
      elevator: 'no',
      doorwayAccessibility: 'notApplicable',
    },
  },
  {
    id: 'sample-cafe-market',
    name: 'Sample Market Cafe',
    category: 'Cafes',
    location: 'Market District, Sample City',
    informationSource: { type: 'sample', label: 'Development sample data', verified: false },
    lastReportedAt: null,
    lastVerifiedAt: null,
    accessibility: {
      stepFreeEntrance: 'unknown',
      wheelchairRamp: 'unknown',
      accessibleWashroom: 'no',
      accessibleParking: 'notApplicable',
      elevator: 'notApplicable',
      doorwayAccessibility: 'no',
    },
  },
];

export function filterPlaces(places, searchText = '', category = ALL_CATEGORIES) {
  const query = searchText.trim().toLocaleLowerCase();
  const categoryMembers = {
    'Hospitals & clinics': ['Hospitals', 'Clinics', 'Hospitals & clinics'],
    'Colleges & universities': ['Colleges', 'Universities', 'Colleges & universities'],
    'Parks & public places': ['Parks', 'Parks & public places', 'Parks & public spaces', 'Public Places'],
  };

  return places.filter((place) => {
    const matchesCategory = category === ALL_CATEGORIES
      || (categoryMembers[category] ?? [category]).includes(place.category);
    const searchableText = `${place.name} ${place.category} ${place.location}`.toLocaleLowerCase();
    return matchesCategory && (!query || searchableText.includes(query));
  });
}

export function getSamplePlaceById(id) {
  return samplePlaces.find((place) => place.id === id);
}

export function getFeatureStatus(place, featureKey) {
  const status = place?.accessibility?.[featureKey];
  return Object.prototype.hasOwnProperty.call(ACCESSIBILITY_STATUSES, status) ? status : 'unknown';
}

export function toggleSavedPlaceId(savedIds, placeId) {
  return savedIds.includes(placeId)
    ? savedIds.filter((id) => id !== placeId)
    : [...savedIds, placeId];
}
