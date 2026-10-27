module.exports = ({ config }) => {
  const mapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  const plugins = [...(config.plugins ?? [])];

  if (mapsApiKey) {
    plugins.push(['react-native-maps', { androidGoogleMapsApiKey: mapsApiKey }]);
  }

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      mapConfig: { googleMapsAndroidApiKeyConfigured: Boolean(mapsApiKey) },
    },
  };
};
