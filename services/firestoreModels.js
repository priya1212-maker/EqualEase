function dateValue(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

export function mapFirestorePlace(snapshot) {
  const data = snapshot.data();
  const verification = data.verification ?? {};
  const coordinates = data.coordinates;
  const hasCoordinates = Number.isFinite(coordinates?.latitude)
    && coordinates.latitude >= -90 && coordinates.latitude <= 90
    && Number.isFinite(coordinates?.longitude)
    && coordinates.longitude >= -180 && coordinates.longitude <= 180;
  return {
    id: snapshot.id,
    name: data.name,
    category: data.category,
    location: data.location,
    coordinates: hasCoordinates ? coordinates : null,
    accessibility: data.accessibility ?? {},
    informationSource: {
      type: data.informationSource?.type ?? 'firestore',
      label: data.informationSource?.label ?? 'Firebase place record',
      verified: verification.status === 'verified',
    },
    lastReportedAt: dateValue(data.lastReportedAt),
    lastVerifiedAt: dateValue(verification.verifiedAt),
  };
}

export function mapFirestoreReport(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    placeId: data.placeId,
    featureKey: data.featureKey,
    status: data.status,
    note: data.note ?? '',
    observationDate: dateValue(data.observationDate)?.slice(0, 10) ?? data.observationDate,
    sourceContext: data.sourceContext ?? '',
    submittedAt: dateValue(data.submittedAt),
    reportType: 'userReport',
    verificationStatus: 'unverified',
  };
}
