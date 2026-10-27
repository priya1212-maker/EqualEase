# EqualEase

**Accessibility for everyone. Independence for every journey.**

EqualEase is a student-built React Native application exploring how people can review accessibility information about places before visiting. It focuses initially on wheelchair-related features and makes missing information visible instead of treating it as a negative answer.

> **Project status:** Prototype for development and demonstration. The bundled venues are fictional sample records. This repository does not currently provide live real-world place discovery, a connected Firebase project, or evidence of deployment to users.

## Problem and goals

Public place listings often do not give people enough detail to plan around accessibility needs. EqualEase is designed to bring place information and accessibility details together, make the source and confidence of that information clear, and provide a way for people to submit observations without presenting those observations as verified facts.

The current prototype aims to:

- Browse, search, and filter places.
- Show feature-level accessibility statuses, including **Unknown** and **Not applicable**.
- Save places locally and report observed accessibility details.
- Explore a map when a place record has real coordinates and map configuration is available.
- Keep community reports distinct from canonical place records and verification metadata.

## Implemented functionality

- Welcome screen and Expo Router navigation between Explore, Saved, and Report.
- Search by place name, category, or location description; category filters; reset and empty states.
- Place detail screens for feature-level accessibility information and its source.
- Explicitly fictional development sample data. Sample accessibility values are not evidence about real venues.
- Local saved-place persistence using AsyncStorage.
- Local report validation and persistence in sample mode. Reports are presented as unverified user reports.
- Map/list switch, coordinate-validated markers, and marker navigation to place details.
- Foreground location permission requested only after the user asks to use their location; denied/unavailable states preserve manual search.
- Optional Firebase Firestore and anonymous-auth data path behind an explicit configuration switch. It is **not connected or tested against a live Firebase project** in this repository.
- Accessibility support such as text labels, accessible navigation names, and touch controls. This prototype still needs hands-on assistive-technology review.

## Technology stack

- React Native 0.86 and React 19
- Expo SDK 57 and Expo Router
- JavaScript
- React Leaflet and Leaflet for the web map; `react-native-maps` for native map rendering
- `expo-location` for foreground location after an explicit user action
- AsyncStorage for device-local saved IDs and sample-mode reports
- Firebase JavaScript SDK (optional Firestore and anonymous Authentication path)
- Node.js built-in test runner for the repository's automated checks

Exact package versions are recorded in `package.json` and `package-lock.json`.

## Project structure

```text
app/                 Expo Router routes and navigation layouts
  (tabs)/             Explore, Saved, Report, and Explore detail stack
components/           Shared UI components, place cards, map, status display
contexts/             Shared saved-place and place/report state
data/                 Fictional sample venues and map-coordinate filtering
services/             Local persistence, Firebase access, location access
theme/                Shared design tokens
tests/                Node tests for data, routing, persistence, and map behavior
assets/               App icons and splash artwork
FIREBASE.md           Optional Firebase setup, schema, and rules notes
MAPS.md               Map configuration and place-data source notes
firestore.rules       Proposed Firestore client security rules
```

The app entry point is `expo-router/entry` (configured in `package.json`). `app/_layout.js` sets up the root navigation; `app/(tabs)/_layout.js` defines the bottom tabs; the place details route is nested under Explore.

## Run locally

### Requirements

- Node.js and npm
- An Android development environment (Android Studio/SDK and an emulator), or an Android device configured for Expo development
- A compatible Expo development build for native map behavior

Install the locked dependencies and start the Metro development server:

```bash
npm ci
npx expo start
```

Then use the terminal's Expo prompts to open an available Android emulator, or scan the QR code with a compatible development client. The Android shortcut is:

```bash
npm run android
```

That command starts Expo and attempts to open an already configured Android target; it does not install Android Studio or create an emulator. For browser preview, run `npm run web` (native map/location behavior is not represented by the web fallback).

Run automated checks with:

```bash
npm test
npx expo config --type public
npx expo export --platform android
npx expo export --platform web
```

The exports validate bundling; they do not replace device testing. There is no configured ESLint or TypeScript check at present.

## Firebase configuration (optional, not connected by default)

The default is `EXPO_PUBLIC_DATA_MODE=sample`. To try the Firebase path:

1. Create a Firebase project and register a Web app.
2. Enable Firestore and Anonymous Authentication.
3. Review and test `firestore.rules` in the Firebase Emulator Suite or Rules Playground, then deploy the rules to the project.
4. Copy `.env.example` to `.env` and enter the Firebase Web app configuration values from Firebase Console.
5. Set `EXPO_PUBLIC_DATA_MODE=firebase`, restart Expo, then test reads and report submission against that project.

Firebase Web configuration values identify a project and are shipped to the client; they are not service-account credentials. **Never place a service-account JSON file, Admin SDK key, or other server credential in this app or repository.** The `.env*` ignore rule prevents local env files from being committed; `.env.example` is intentionally tracked and contains blank values.

The rules currently allow public reads of published places and reports, require an authenticated anonymous UID to create reports, force reports to remain unverified, and deny client edits/deletes. Because reports are publicly readable under the current rules, do not put personal or sensitive details in note/source fields. Rules have not been verified against a live project here. Add abuse controls and moderation before treating Firebase submission as a public production service. See [FIREBASE.md](FIREBASE.md).

## Map configuration (optional)

The website map uses React Leaflet with OpenStreetMap tiles. Users can search a location with Nominatim and explicitly search the visible area for named places and OSM tags with Overpass. The public endpoints are community resources, not a production service contract; queries run only after a user action, are zoom/area limited, and are cached briefly in memory. Do not add autocomplete, background searches, bulk collection, or offline tile downloads. OSM attribution is shown on the map. Usage policies can change; configure `EXPO_PUBLIC_OSM_NOMINATIM_URL` and `EXPO_PUBLIC_OSM_OVERPASS_URL` to switch to another compatible service when needed.

The Android app retains `react-native-maps` with Google Maps. To show its live Android basemap, create a Google Cloud project, enable **Maps SDK for Android**, configure billing, and create a key restricted to Android package `com.equalease.app`, the correct signing certificate SHA-1, and the Maps SDK for Android. Set `GOOGLE_MAPS_ANDROID_API_KEY` in a local `.env` (or an appropriate build environment) and rebuild the native development app. Do not commit the key. A mobile map key is included in the app binary, so restrict it by app and API; it is not a server secret.

Expo Go does not include this project's native Maps configuration. No Android key is currently configured. The website can retrieve named OpenStreetMap features for a small visible area after the user selects **Search this area**; public endpoint availability and tagging coverage vary, and the endpoint may refuse requests. The default sample records remain fictional and have no coordinates. A place appearing on a map is not evidence of accessibility.

OSM wheelchair tags are community-mapped, not EqualEase-verified. The map shows Yes/No only when an OSM feature explicitly supplies the corresponding tag, but labels that source unverified and uses the yellow marker. The OSM value `limited` maps to Unknown, and absent values always remain Unknown. Green or red markers are reserved for explicitly verified EqualEase records with an explicit Yes/No wheelchair-access field. OSM-discovered records are temporary map/list results and cannot currently be saved or reported through the app's form; the form works with the configured sample/Firebase place dataset. More data-source and usage notes are in [MAPS.md](MAPS.md).

Location is requested only after tapping **Use my location**, and is used to center the current map. The app does not upload or persist that location. If permission is denied or the location service is unavailable, the user can continue using text search; this search does not geocode a free-form address.

## Accessibility data model

Each place has general fields (such as name, category, location description, and optional coordinates) and a separate accessibility feature map. Each feature can be `yes`, `no`, `unknown`, or `notApplicable`. Missing feature values are displayed as **Unknown**. The initial features include step-free entrance, wheelchair ramp, elevator, accessible washroom, accessible parking, and doorway accessibility.

In the optional Firestore model, `places/{placeId}` contains canonical published place data, accessibility values, information source, and verification metadata. `accessibilityReports/{reportId}` stores a separate user observation, its date and optional notes/source context, and an unverified status. User reports do not overwrite canonical accessibility values. Verification metadata is reserved for a trusted review/admin process; the client does not get to verify its own submission. See [FIREBASE.md](FIREBASE.md) for fields and rules.

## Known limitations and unfinished work

- Sample venues and their accessibility statuses are fictional development fixtures, not real-world facts.
- There are no sample coordinates. The Android basemap needs a restricted Google Maps key; web OSM discovery requires network access and can return sparse or no results.
- The web map currently queries public OSM endpoints directly for user-requested small areas. There is no production geocoding/places service contract or proxy/cache backend; shared public services may be rate-limited or unavailable.
- No Firebase project is configured or tested. Firebase mode is optional; sample mode remains the default. Local sample reports are not cloud submissions.
- Cloud report rules currently make report contents publicly readable. Live project rule testing, moderation, abuse prevention, and privacy review remain outstanding.
- Saved places remain on the current device; cloud sync is not implemented.
- There is no admin/reviewer interface for verification, and no verified real-world accessibility record is bundled.
- Android emulator/device testing was not available in the development environment used for the latest automated build checks. Permission prompts, map rendering, marker interaction, and TalkBack behavior need manual device testing.
- No production release, user count, deployment, or measured real-world impact is claimed.

## Suggested screenshots and demonstration

Use screenshots from a configured emulator or device, and label any sample content as fictional:

1. Welcome screen showing the EqualEase purpose.
2. Explore list with the development sample-data notice visible.
3. Place details showing a mix of Yes, No, Unknown, and Not applicable statuses and source context.
4. Saved Places with a saved item, followed by the empty state.
5. Report form with validation feedback and a local submission confirmation labelled unverified.
6. Map/list switch and a marker only after adding a coordinate-bearing test record and configuring the map key.

A short demo can move from Welcome to Explore, search/filter a sample place, inspect its feature statuses, save and reopen it, then submit a clearly labelled development report. If demonstrating the map, first explain that the test marker uses an explicit test coordinate and that the map does not certify accessibility. Avoid presenting fictional records as real recommendations.

## Student portfolio summary

**EqualEase** is a React Native and Expo prototype for exploring place accessibility information. It demonstrates Expo Router navigation, searchable sample place data, feature-level accessibility statuses, local bookmarks and reports, and an optional map/Firebase architecture. The project keeps unverified user observations separate from verified place records and makes missing data explicit. It is a development prototype; real place data, moderation, live Firebase validation, and on-device accessibility testing remain future work.
