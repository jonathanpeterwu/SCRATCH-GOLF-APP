import AsyncStorage from '@react-native-async-storage/async-storage';
import * as CloudStorage from 'expo-cloud-storage';

const STORAGE_KEYS = {
  USER: '@golf_coach_user',
  GOLF_BAG: '@golf_coach_bag',
  GHIN_DATA: '@golf_coach_ghin',
  CHAT_HISTORY: '@golf_coach_chat',
};

// Save data locally and to iCloud
export const saveToStorage = async (key, data) => {
  try {
    const jsonValue = JSON.stringify(data);

    // Save locally
    await AsyncStorage.setItem(STORAGE_KEYS[key], jsonValue);

    // Save to iCloud
    try {
      await CloudStorage.setItem(STORAGE_KEYS[key], jsonValue);
      console.log(`Synced ${key} to iCloud`);
    } catch (cloudError) {
      console.warn('iCloud sync failed:', cloudError);
      // Still continue even if iCloud fails
    }

    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    throw error;
  }
};

// Load data from storage (prioritize iCloud, fallback to local)
export const loadFromStorage = async () => {
  try {
    const data = {};

    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      try {
        // Try iCloud first
        let jsonValue = await CloudStorage.getItem(storageKey);

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

// Manual sync to iCloud
export const syncToCloud = async () => {
  try {
    // Get all local data
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
    // Note: CloudStorage doesn't have a clear all method
    const keys = Object.values(STORAGE_KEYS);
    await Promise.all(keys.map(key => CloudStorage.removeItem(key)));
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};
