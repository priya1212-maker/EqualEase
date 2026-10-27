import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserReportsRepository } from './userReportsRepository.js';

const userReportsRepository = createUserReportsRepository(AsyncStorage);

export const loadUserReports = (validPlaceIds) => validPlaceIds
  ? createUserReportsRepository(AsyncStorage, undefined, validPlaceIds).load()
  : userReportsRepository.load();
export const submitUserReportToStorage = (report, validPlaceIds) => validPlaceIds
  ? createUserReportsRepository(AsyncStorage, undefined, validPlaceIds).submit(report, validPlaceIds)
  : userReportsRepository.submit(report);
