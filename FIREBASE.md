# Firebase migration notes

## Mode selection

The app stays in sample mode by default. Set `EXPO_PUBLIC_DATA_MODE=firebase` only
after configuring a Firebase project and deploying `firestore.rules`. Firebase
client configuration is public project identification, not a private credential;
never put service-account JSON or Admin SDK credentials in the app.

Copy `.env.example` to `.env` and fill the web app config values from Firebase
Console → Project settings → Your apps → Web app. Enable Cloud Firestore and
Anonymous Authentication. Anonymous Authentication supplies an opaque UID for
report ownership without collecting a name, email address, or phone number.

## Firestore structure

### `places/{placeId}`

```text
name: string
category: string
location: string
coordinates: { latitude: number, longitude: number } | null
published: boolean
accessibility: {
  stepFreeEntrance: "yes" | "no" | "unknown" | "notApplicable",
  wheelchairRamp: "yes" | "no" | "unknown" | "notApplicable",
  elevator: "yes" | "no" | "unknown" | "notApplicable",
  accessibleWashroom: "yes" | "no" | "unknown" | "notApplicable",
  accessibleParking: "yes" | "no" | "unknown" | "notApplicable",
  doorwayAccessibility: "yes" | "no" | "unknown" | "notApplicable",
  wheelchairAccess: "yes" | "no" | "unknown" | "notApplicable"
}
informationSource: { type: string, label: string }
lastReportedAt: timestamp | null
verification: {
  status: "unverified" | "verified",
  verifiedAt: timestamp | null,
  verifiedBy: string | null
}
```

The app reads only published places. Canonical place data and verification
metadata must be written through trusted, secured administrative tooling, never
directly by this mobile client.

### `accessibilityReports/{reportId}`

```text
placeId: string
featureKey: string
status: "yes" | "no" | "unknown" | "notApplicable"
note: string (up to 500 characters)
observationDate: timestamp (UTC noon for the selected calendar date)
sourceContext: string (up to 240 characters)
submittedAt: server timestamp
authorUid: anonymous Firebase Auth UID
reportType: "userReport"
verificationStatus: "unverified"
```

Reports stay separate from the place's accessibility record. Rules require an
authenticated UID, validate allowed fields and values, force unverified status,
and reject client edits/deletes. Future moderation should use trusted backend
code with privileged credentials kept server-side. Client checks are for user
feedback only and are not the security boundary.

### Saved places

The app continues storing saved IDs locally in AsyncStorage. If cloud sync is
added later, use `users/{uid}/savedPlaces/{placeId}` with only `placeId` and a
server-controlled `savedAt`; rules scope access to that user's UID. Do not store
names, contacts, or other personal profile data in these records.

## Migration stages

1. Keep sample data and local repositories as the default development mode.
2. Add Firestore repositories behind the data-service boundary.
3. When configured, load published place documents and report documents from
   Firestore. An explicit Firebase mode with incomplete configuration shows an
   error; it does not silently fall back to sample data.
4. Enable Firebase mode only after rules are deployed and a real project read
   and report-write have both been tested. This repository alone does not prove
   that any Firebase project is connected.

## Firebase setup checklist

1. Create a Firebase project and register a Web app for the Firebase JS SDK.
2. Create a Cloud Firestore database and choose its region carefully.
3. Enable Authentication → Sign-in method → Anonymous.
4. Test `firestore.rules` with the Firebase Emulator Suite or Rules Playground,
   including allowed/denied submissions and attempts to set verified fields.
   Deploy the tested rules using the Firebase Console Rules tab or Firebase CLI.
5. Copy `.env.example` to `.env`, enter the Firebase web app config, then set
   `EXPO_PUBLIC_DATA_MODE=firebase`.
6. Restart Expo with `npx expo start --clear`. Test reads and report submission.

Before a public launch, add abuse controls such as Firebase App Check and
server-side moderation/rate limits. Anonymous Authentication identifies a
submission session but does not prevent automated spam.

If npm cannot install dependencies, run `npm install` from a network that can
reach the npm registry before starting Expo.
