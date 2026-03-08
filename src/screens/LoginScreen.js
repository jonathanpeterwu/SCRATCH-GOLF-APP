import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { signInWithApple, isAppleAuthAvailable } from '../services/auth';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme';

let AppleAuthentication = null;
if (Platform.OS !== 'web') {
  AppleAuthentication = require('expo-apple-authentication');
}

export default function LoginScreen() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAppStore(state => state.setUser);
  const t = useTheme();

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    const available = await isAppleAuthAvailable();
    setIsAvailable(available);
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const user = await signInWithApple();
      setUser(user);
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        if (Platform.OS === 'web') {
          alert('Failed to sign in. Please try again.');
        } else {
          Alert.alert('Sign In Error', 'Failed to sign in with Apple. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.appIcon}>⛳️</Text>
          <Text style={[styles.appName, { color: t.primary }]}>Golf Coach</Text>
          <Text style={[styles.tagline, { color: t.textSecondary }]}>
            Your AI-Powered Golf Assistant
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem icon="🏌️" text="Personalized coaching and swing tips" textColor={t.text} />
          <FeatureItem icon="📊" text="Track your GHIN and analyze stats" textColor={t.text} />
          <FeatureItem icon="🎯" text="Custom practice plans" textColor={t.text} />
          <FeatureItem icon="☁️" text="iCloud sync across devices" textColor={t.text} />
        </View>

        {isAvailable && AppleAuthentication ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={8}
            style={styles.appleButton}
            onPress={handleSignIn}
          />
        ) : (
          <TouchableOpacity
            style={[styles.fallbackButton, { backgroundColor: t.primary }]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>
                  {Platform.OS === 'web' ? '🏌️' : '🍎'}
                </Text>
                <Text style={styles.buttonText}>
                  {Platform.OS === 'web' ? 'Get Started' : 'Sign in with Apple'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={[styles.privacy, { color: t.textTertiary }]}>
          {Platform.OS === 'web'
            ? 'Data saved locally in your browser.\nInstall on iOS for iCloud sync and Apple Sign In.'
            : 'Your data is private and secure.\nSynced with iCloud for seamless access.'
          }
        </Text>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text, textColor }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, maxWidth: 480, alignSelf: 'center', width: '100%' },
  iconContainer: { alignItems: 'center', marginBottom: 48 },
  appIcon: { fontSize: 80, marginBottom: 16 },
  appName: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  tagline: { fontSize: 16 },
  features: { marginBottom: 48 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  featureIcon: { fontSize: 24, marginRight: 12 },
  featureText: { fontSize: 16, flex: 1 },
  appleButton: { height: 50, marginBottom: 16 },
  fallbackButton: { height: 50, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  buttonIcon: { fontSize: 20, marginRight: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  privacy: { textAlign: 'center', fontSize: 12, lineHeight: 18 },
});
