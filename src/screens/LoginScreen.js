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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithApple, isAppleAuthAvailable } from '../services/auth';
import { useAppStore } from '../store/appStore';
import { useTheme, shadows, typography, spacing } from '../theme';

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
      {/* Header Gradient */}
      <View style={styles.headerSection}>
        <View style={[styles.gradientContainer, { backgroundColor: t.primary }]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="golf" size={48} color="#FFF" />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.appName, { color: t.text }]}>Golf Coach</Text>
          <Text style={[styles.tagline, { color: t.textSecondary }]}>
            Your AI-Powered Golf Assistant
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            IconComponent={MaterialCommunityIcons}
            iconName="golf-tee"
            text="Personalized coaching and swing tips"
            textColor={t.text}
            iconColor={t.primary}
            bgColor={t.primaryLight}
          />
          <FeatureItem
            IconComponent={Ionicons}
            iconName="stats-chart"
            text="Track your GHIN and analyze stats"
            textColor={t.text}
            iconColor={t.primary}
            bgColor={t.primaryLight}
          />
          <FeatureItem
            IconComponent={Ionicons}
            iconName="target"
            text="Custom practice plans"
            textColor={t.text}
            iconColor={t.primary}
            bgColor={t.primaryLight}
          />
          <FeatureItem
            IconComponent={Ionicons}
            iconName="cloud"
            text="iCloud sync across devices"
            textColor={t.text}
            iconColor={t.primary}
            bgColor={t.primaryLight}
          />
        </View>

        <View style={styles.buttonContainer}>
          {isAvailable && AppleAuthentication ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={styles.appleButton}
              onPress={handleSignIn}
            />
          ) : (
            <TouchableOpacity
              style={[styles.fallbackButton, { backgroundColor: t.primary }, shadows.medium]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  {Platform.OS === 'web' ? (
                    <MaterialCommunityIcons name="golf" size={24} color="#fff" />
                  ) : (
                    <Ionicons name="logo-apple" size={24} color="#fff" />
                  )}
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
    </View>
  );
}

function FeatureItem({ IconComponent, iconName, text, textColor, iconColor, bgColor }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIconCircle, { backgroundColor: bgColor }]}>
        <IconComponent name={iconName} size={24} color={iconColor} />
      </View>
      <Text style={[styles.featureText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
    marginTop: -24,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appName: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.body,
    textAlign: 'center',
  },
  features: {
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  featureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    ...typography.body,
    flex: 1,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: spacing.xl,
  },
  appleButton: {
    height: 56,
    marginBottom: spacing.md,
  },
  fallbackButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  buttonText: {
    color: '#fff',
    ...typography.button,
  },
  privacy: {
    textAlign: 'center',
    ...typography.caption,
    lineHeight: 18,
  },
});
