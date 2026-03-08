import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let CloudStorage = null;
if (Platform.OS !== 'web') {
  try {
    CloudStorage = require('expo-cloud-storage');
  } catch (e) {
    console.warn('expo-cloud-storage not available');
  }
}

const STORAGE_KEYS = {
  USER: '@golf_coach_user',
  GOLF_BAG: '@golf_coach_bag',
  GHIN_DATA: '@golf_coach_ghin',
  CHAT_HISTORY: '@golf_coach_chat',
};

// Save data locally and to iCloud (when available)
export const saveToStorage = async (key, data) => {
  try {
    const jsonValue = JSON.stringify(data);

    // Save locally
    await AsyncStorage.setItem(STORAGE_KEYS[key], jsonValue);

    // Save to iCloud (native only)
    if (CloudStorage && Platform.OS !== 'web') {
      try {
        await CloudStorage.setItem(STORAGE_KEYS[key], jsonValue);
        console.log(`Synced ${key} to iCloud`);
      } catch (cloudError) {
        console.warn('iCloud sync failed:', cloudError);
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    throw error;
  }
};

// Load data from storage (prioritize iCloud on native, localStorage on web)
export const loadFromStorage = async () => {
  try {
    const data = {};

    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      try {
        let jsonValue = null;

        // Try iCloud first (native only)
        if (CloudStorage && Platform.OS !== 'web') {
          try {
            jsonValue = await CloudStorage.getItem(storageKey);
          } catch (e) {
            // iCloud not available, continue
          }
        }

        // Fallback to local storage
        if (!jsonValue) {
          jsonValue = await AsyncStorage.getItem(storageKey);
        }

        if (jsonValue) {
          data[key.toLowerCase()] = JSON.parse(jsonValue);
        }
      } catch (error) {
        console.warn(`Error loading ${key}:`, error);
      }
    }

    return data;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return {};
  }
};

// Manual sync to iCloud (no-op on web)
export const syncToCloud = async () => {
  if (Platform.OS === 'web' || !CloudStorage) {
    console.log('iCloud sync not available on web - data saved locally');
    return true;
  }

  try {
    const keys = Object.values(STORAGE_KEYS);
    const syncPromises = keys.map(async (key) => {
      const localData = await AsyncStorage.getItem(key);
      if (localData) {
        await CloudStorage.setItem(key, localData);
      }
    });

    await Promise.all(syncPromises);
    console.log('All data synced to iCloud');
    return true;
  } catch (error) {
    console.error('Error syncing to iCloud:', error);
    throw error;
  }
};

// Clear all data
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    if (CloudStorage && Platform.OS !== 'web') {
      const keys = Object.values(STORAGE_KEYS);
      await Promise.all(keys.map(key => CloudStorage.removeItem(key)));
    }
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};
