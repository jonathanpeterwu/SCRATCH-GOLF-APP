import { Platform } from 'react-native';
import { saveToStorage } from './storage';

let AppleAuthentication = null;
if (Platform.OS !== 'web') {
  AppleAuthentication = require('expo-apple-authentication');
}

export const signInWithApple = async () => {
  if (Platform.OS === 'web') {
    // Web: use demo/guest login
    const user = {
      id: 'web-guest-' + Date.now(),
      email: null,
      fullName: { givenName: 'Guest', familyName: 'Golfer' },
    };
    await saveToStorage('USER', user);
    return user;
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const user = {
      id: credential.user,
      email: credential.email,
      fullName: credential.fullName,
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
    };

    await saveToStorage('USER', user);
    return user;
  } catch (error) {
    if (error.code === 'ERR_CANCELED') {
      console.log('User canceled Apple Sign In');
    } else {
      console.error('Error signing in with Apple:', error);
    }
    throw error;
  }
};

export const signOut = async () => {
  try {
    await saveToStorage('USER', null);
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const isAppleAuthAvailable = async () => {
  if (Platform.OS === 'web') return false;
  return await AppleAuthentication.isAvailableAsync();
};
