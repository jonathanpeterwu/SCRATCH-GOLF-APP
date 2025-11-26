import * as AppleAuthentication from 'expo-apple-authentication';
import { saveToStorage } from './storage';

export const signInWithApple = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Create user object
    const user = {
      id: credential.user,
      email: credential.email,
      fullName: credential.fullName,
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
    };

    // Save to storage
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
  return await AppleAuthentication.isAvailableAsync();
};
