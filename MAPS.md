# EqualEase maps and place-source notes

## Map choice and setup

The website uses React Leaflet 5 with Leaflet 1.9 and OpenStreetMap tiles. The
Android app uses `react-native-maps` 1.27.2, the version bundled for Expo SDK
57, with Google Maps. React Leaflet is web-only; Expo resolves a separate
native map implementation for Android. The Android map provider key is read at
build time from `GOOGLE_MAPS_ANDROID_API_KEY`; it is not checked into source.
The key will be visible in the Android app, so restrict it in Google Cloud to
Android app `com.equalease.app`, the app-signing SHA-1 fingerprint, and only
Maps SDK for Android. Google Maps Platform requires a billing account. Use a
development build after setting the key because Expo Go uses its own native
configuration.

The web map displays OSM tiles with visible attribution. OSM's standard tile
servers are best-effort community infrastructure, not a guaranteed or paid
service. Follow the current [tile usage policy](https://operations.osmfoundation.org/policies/tiles/):
allow normal interactive map viewing only, honour cache headers, keep the
attribution visible, and do not prefetch, bulk download, or offer offline tiles.

## Web place discovery and search

When a user explicitly selects **Search this area**, the web app sends one
bounding-box query for named features to the configured Overpass endpoint. The
request is restricted to a close zoom and small area, and results are cached in
memory for one minute. Location search uses Nominatim only after the user
submits the search form; it does not autocomplete, and identical queries are
cached in memory. Public endpoint URLs can be switched with
`EXPO_PUBLIC_OSM_OVERPASS_URL` and `EXPO_PUBLIC_OSM_NOMINATIM_URL`.

These public endpoints are for modest user-triggered use and can be slow,
rate-limited, or unavailable. Nominatim's public policy sets an absolute
maximum of one request per second, forbids autocomplete and systematic data
collection, and asks apps to make requests user-triggered. Overpass public
instances are shared and not a reliable commercial backend. For a larger
deployment, operate a policy-compliant proxy with caching or use a contracted
provider / self-hosted service. See the current [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/)
and [Overpass usage notes](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances).

OpenStreetMap features are transient discovery results; the app does not copy
them into Firestore. This keeps the existing Firebase/sample place model
separate from OSM source data. The current Report form accepts places from the
app's configured data source only; users cannot yet submit a report directly
from an OSM-only marker.

In Firebase place documents, add coordinates only when the selected place data
source provides them:

```text
coordinates: { latitude: number, longitude: number }
```

Sample venues intentionally have no coordinates. The app will not place them at
guessed locations. Map markers are available for records with valid coordinate
pairs and open the existing Place Details route.

## Location permission

The app requests foreground location only after the user taps **Use my
location**. It does not request location on startup, in background, or merely
when the map tab/view opens. Denial leaves location search and list discovery
available; if Android no longer allows prompting, the app offers the system app
settings. EqualEase does not persist precise device coordinates. If the user
then taps **Search this area**, the visible map bounds (which may be centered
near the device location) are sent to the selected Overpass endpoint. A manual
location search sends its submitted text to Nominatim. The UI discloses these
requests before use.

## Place and accessibility data

Keep data sources separate:

* **General place data and web map coordinates:** [OpenStreetMap](https://www.openstreetmap.org/copyright)
  provides the web map tiles and the optional Overpass area discovery feed.
  Coverage depends on local mapping and ODbL attribution/share-alike terms
  apply. The app requests only named points/areas with coordinates in the
  visible map viewport after a user action; it does not cache OSM features to
  Firebase.
* **Android map rendering:** Google Maps SDK displays the native Android map.
  Google Places is not integrated. If considered later, its accessibility fields
  have limited coverage and pricing/terms must be reviewed before use.
* **Community-submitted reports:** Keep the existing `accessibilityReports`
  flow separate. Reports are unverified and do not update canonical place
  accessibility fields.
* **Verified accessibility records:** Maintain these in the separate
  administrator-managed place record. Only a trusted review process/backend
  should write verification metadata.

OSM wheelchair values `yes` and `no` are presented as community-tagged
information and stay marked unverified (yellow map markers). `limited` is not
collapsed to Yes or No; it appears as Unknown with an explanatory note. Missing
tags always remain Unknown. Green/red markers are reserved for explicit
Yes/No wheelchair fields on an EqualEase record that is explicitly verified;
a map listing alone never implies accessibility.

OpenStreetMap is the live web-map source for base tiles and user-requested area
discovery. Its wheelchair tags are community-maintained and completeness varies
by region. Its data is [ODbL licensed](https://www.openstreetmap.org/copyright)
and requires attribution. The public [OSM tile service policy](https://operations.osmfoundation.org/policies/tiles/)
is best-effort, has strict usage/caching requirements, and must not be treated
as a production tile SLA. Google Places is not currently integrated; if it is
considered later, accessibility fields, pricing, caching rules, map display,
and attribution terms need review before use.
