import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithApple, isAppleAuthAvailable } from '../services/auth';
import { useAppStore } from '../store/appStore';

export default function LoginScreen() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAppStore(state => state.setUser);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    const available = await isAppleAuthAvailable();
    setIsAvailable(available);
  };

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      const user = await signInWithApple();
      setUser(user);
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert('Sign In Error', 'Failed to sign in with Apple. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Icon/Logo */}
        <View style={styles.iconContainer}>
          <Text style={styles.appIcon}>⛳️</Text>
          <Text style={styles.appName}>Golf Coach</Text>
          <Text style={styles.tagline}>Your AI-Powered Golf Assistant</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem icon="🏌️" text="Personalized coaching and swing tips" />
          <FeatureItem icon="📊" text="Track your GHIN and analyze stats" />
          <FeatureItem icon="🎯" text="Custom practice plans" />
          <FeatureItem icon="☁️" text="iCloud sync across devices" />
        </View>

        {/* Sign In Button */}
        {isAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={8}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        ) : (
          <TouchableOpacity
            style={styles.fallbackButton}
            onPress={handleAppleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.appleIcon}>🍎</Text>
                <Text style={styles.buttonText}>Sign in with Apple</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.privacy}>
          Your data is private and secure.{'\n'}
          Synced with iCloud for seamless access.
        </Text>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
  },
  features: {
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  appleButton: {
    height: 50,
    marginBottom: 16,
  },
  fallbackButton: {
    height: 50,
    backgroundColor: '#000',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  privacy: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    lineHeight: 18,
  },
});
