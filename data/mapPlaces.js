export function hasValidCoordinates(place) {
  const { latitude, longitude } = place?.coordinates ?? {};
  return Number.isFinite(latitude)
    && latitude >= -90 && latitude <= 90
    && Number.isFinite(longitude)
    && longitude >= -180 && longitude <= 180;
}

export function getMappablePlaces(places) {
  return places.filter(hasValidCoordinates);
}

/** A map color can imply confirmation, so only explicitly verified Yes/No records get those colors. */
export function getWheelchairMarkerStatus(place) {
  if (place?.informationSource?.verified !== true) return 'unknown';
  const status = place?.accessibility?.wheelchairAccess;
  return status === 'yes' || status === 'no' ? status : 'unknown';
}
