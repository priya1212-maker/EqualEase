import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toggleSavedPlaceId } from '../data/samplePlaces';
import { isFirebaseRequested, loadPlaces, loadReports, loadSavedIds, saveSavedIds, submitReport } from '../services/dataSource';

const SavedPlacesContext = createContext(null);

function groupReportsByPlace(reports) {
  return reports.reduce((grouped, report) => ({
    ...grouped,
    [report.placeId]: [...(grouped[report.placeId] ?? []), report],
  }), {});
}

function describeDataError(error, subject) {
  if (typeof error?.message === 'string' && error.message.includes('Firebase configuration')) return error.message;
  if (error?.code === 'permission-denied') {
    return `Firebase denied access to ${subject}. Check that the Firestore rules are deployed and allow this operation.`;
  }
  if (isFirebaseRequested) {
    return `${subject} could not be reached. Check your connection and Firebase configuration, then try again.`;
  }
  return `${subject} could not be loaded from this device. Try again.`;
}

export function SavedPlacesProvider({ children }) {
  const [places, setPlaces] = useState([]);
  const [isPlacesLoading, setIsPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState([]);
  const [isSavedPlacesLoading, setIsSavedPlacesLoading] = useState(true);
  const [savedPlacesError, setSavedPlacesError] = useState(null);
  const [savedPlacesErrorKind, setSavedPlacesErrorKind] = useState(null);
  const [userReports, setUserReports] = useState({});
  const [isUserReportsLoading, setIsUserReportsLoading] = useState(true);
  const [userReportsError, setUserReportsError] = useState(null);
  const savedIdsRef = useRef([]);
  const reportListRef = useRef([]);
  const placesRef = useRef([]);
  const writeQueueRef = useRef(Promise.resolve());
  const reportsWriteQueueRef = useRef(Promise.resolve());

  const refreshPlaces = useCallback(async () => {
    setIsPlacesLoading(true);
    setPlacesError(null);
    try {
      const loadedPlaces = await loadPlaces();
      placesRef.current = loadedPlaces;
      setPlaces(loadedPlaces);
      const ids = loadedPlaces.map((place) => place.id);
      try {
        const savedIds = await loadSavedIds(ids);
        savedIdsRef.current = savedIds;
        setSavedPlaceIds(savedIds);
        setSavedPlacesError(null);
        setSavedPlacesErrorKind(null);
      } catch {
        setSavedPlacesError('Saved place IDs could not be loaded from this device.');
        setSavedPlacesErrorKind('load');
      } finally {
        setIsSavedPlacesLoading(false);
      }
      setPlacesError(null);
      return loadedPlaces;
    } catch (error) {
      setPlacesError(describeDataError(error, 'Places'));
      throw error;
    } finally {
      setIsPlacesLoading(false);
    }
  }, []);

  const refreshReports = useCallback(async (placeIds = placesRef.current.map((place) => place.id)) => {
    setIsUserReportsLoading(true);
    try {
      const reports = await loadReports(placeIds);
      reportListRef.current = reports;
      setUserReports(groupReportsByPlace(reports));
      setUserReportsError(null);
    } catch (error) {
      setUserReportsError(describeDataError(error, 'Reports'));
    } finally {
      setIsUserReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;
    (async () => {
      try {
        const loadedPlaces = await loadPlaces();
        if (!isCurrent) return;
        placesRef.current = loadedPlaces;
        setPlaces(loadedPlaces);
        const ids = loadedPlaces.map((place) => place.id);
        try {
          const loadedSavedIds = await loadSavedIds(ids);
          if (!isCurrent) return;
          savedIdsRef.current = loadedSavedIds;
          setSavedPlaceIds(loadedSavedIds);
          setSavedPlacesError(null);
          setSavedPlacesErrorKind(null);
        } catch {
          if (isCurrent) {
            setSavedPlacesError('Saved place IDs could not be loaded from this device.');
            setSavedPlacesErrorKind('load');
          }
        } finally {
          if (isCurrent) setIsSavedPlacesLoading(false);
        }
        const reports = await loadReports(ids);
        if (!isCurrent) return;
        reportListRef.current = reports;
        setUserReports(groupReportsByPlace(reports));
        setUserReportsError(null);
      } catch (error) {
        if (isCurrent) {
          setPlacesError(describeDataError(error, 'Places'));
          setUserReportsError(describeDataError(error, 'Reports'));
        }
      } finally {
        if (isCurrent) {
          setIsPlacesLoading(false);
          setIsSavedPlacesLoading(false);
          setIsUserReportsLoading(false);
        }
      }
    })();
    return () => { isCurrent = false; };
  }, []);

  const persistIds = useCallback((ids) => {
    const validPlaceIds = placesRef.current.map((place) => place.id);
    writeQueueRef.current = writeQueueRef.current
      .catch(() => {})
      .then(() => saveSavedIds(ids, validPlaceIds));
    return writeQueueRef.current;
  }, []);

  const toggleSavedPlace = useCallback((placeId) => {
    if (isSavedPlacesLoading) return;
    const nextIds = toggleSavedPlaceId(savedIdsRef.current, placeId);
    savedIdsRef.current = nextIds;
    setSavedPlaceIds(nextIds);
    setSavedPlacesError(null);
    setSavedPlacesErrorKind(null);
    persistIds(nextIds).catch(() => {
      setSavedPlacesError('Your change is shown for now but could not be saved on this device. Try again.');
      setSavedPlacesErrorKind('save');
    });
  }, [isSavedPlacesLoading, persistIds]);

  const retrySavedPlaces = useCallback(() => {
    const validPlaceIds = placesRef.current.map((place) => place.id);
    if (savedPlacesErrorKind === 'load') {
      loadSavedIds(validPlaceIds)
        .then((ids) => {
          savedIdsRef.current = ids;
          setSavedPlaceIds(ids);
          setSavedPlacesError(null);
          setSavedPlacesErrorKind(null);
        })
        .catch(() => setSavedPlacesError('Saved places still could not be loaded. Check device storage and try again.'));
      return;
    }
    persistIds(savedIdsRef.current)
      .then(() => {
        setSavedPlacesError(null);
        setSavedPlacesErrorKind(null);
      })
      .catch(() => {
        setSavedPlacesError('Saved places still could not be saved. Check device storage and try again.');
        setSavedPlacesErrorKind('save');
      });
  }, [persistIds, savedPlacesErrorKind]);

  const submitUserReport = useCallback((report) => {
    const validPlaceIds = placesRef.current.map((place) => place.id);
    const submission = reportsWriteQueueRef.current
      .catch(() => {})
      .then(() => submitReport(report, validPlaceIds))
      .then((savedReport) => {
        const reports = [...reportListRef.current, savedReport];
        reportListRef.current = reports;
        setUserReports(groupReportsByPlace(reports));
        setUserReportsError(null);
        return savedReport;
      })
      .catch((error) => {
        setUserReportsError(describeDataError(error, 'The report'));
        throw error;
      });
    reportsWriteQueueRef.current = submission;
    return submission;
  }, []);

  const retryUserReports = useCallback(() => refreshReports(), [refreshReports]);
  const retryPlaces = useCallback(() => refreshPlaces().then(() => refreshReports()), [refreshPlaces, refreshReports]);

  const value = useMemo(() => ({
    places,
    isPlacesLoading,
    placesError,
    isFirebaseMode: isFirebaseRequested,
    savedPlaceIds,
    isSavedPlacesLoading,
    savedPlacesError,
    savedPlacesErrorKind,
    userReports,
    isUserReportsLoading,
    userReportsError,
    toggleSavedPlace,
    retrySavedPlaces,
    submitUserReport,
    retryUserReports,
    retryPlaces,
  }), [places, isPlacesLoading, placesError, savedPlaceIds, isSavedPlacesLoading, savedPlacesError, savedPlacesErrorKind, userReports, isUserReportsLoading, userReportsError, toggleSavedPlace, retrySavedPlaces, submitUserReport, retryUserReports, retryPlaces]);

  return <SavedPlacesContext.Provider value={value}>{children}</SavedPlacesContext.Provider>;
}

export function useSavedPlaces() {
  const context = useContext(SavedPlacesContext);
  if (!context) throw new Error('useSavedPlaces must be used inside SavedPlacesProvider.');
  return context;
}
