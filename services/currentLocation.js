/** Called only from the explicit "Use my location" action. */
export async function requestCurrentForegroundLocation(locationApi) {
  try {
    let permission = await locationApi.getForegroundPermissionsAsync();
    if (!permission.granted) {
      if (permission.status === 'denied' && !permission.canAskAgain) {
        return { status: 'permanentlyDenied' };
      }
      permission = await locationApi.requestForegroundPermissionsAsync();
    }
    if (!permission.granted) return { status: 'denied' };

    const servicesEnabled = await locationApi.hasServicesEnabledAsync();
    if (!servicesEnabled) return { status: 'servicesDisabled' };

    const location = await locationApi.getCurrentPositionAsync({
      accuracy: locationApi.Accuracy.Balanced,
    });
    return {
      status: 'granted',
      coords: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
    };
  } catch {
    return { status: 'unavailable' };
  }
}
