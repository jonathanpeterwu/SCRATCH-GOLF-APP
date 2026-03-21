import { useAppStore } from './store/appStore';

export const colors = {
  light: {
    // Backgrounds
    background: '#F8FAFB',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F6F9',
    surfaceElevated: '#FFFFFF',

    // Text
    text: '#1A2332',
    textSecondary: '#5A6678',
    textTertiary: '#9AA4B5',

    // Borders
    border: '#E4E9F0',
    borderLight: '#F0F3F7',

    // Brand - Modern green gradient
    primary: '#2D7738',
    primaryDark: '#1E5127',
    primaryLight: '#E8F5EA',
    primaryGradientStart: '#2D7738',
    primaryGradientEnd: '#3B9648',
    accent: '#FFB74D',

    // Inputs
    inputBorder: '#D1DAE6',
    inputBackground: '#FFFFFF',
    inputText: '#1A2332',
    placeholder: '#9AA4B5',
    inputFocus: '#2D7738',

    // Cards
    card: '#FFFFFF',
    cardHover: '#FAFBFC',
    cardSelected: '#E8F5EA',
    cardBorder: '#E4E9F0',

    // Modal
    modalOverlay: 'rgba(26, 35, 50, 0.6)',
    modalBackground: '#FFFFFF',

    // Chat
    chatBackground: '#F8FAFB',
    bubbleLeft: '#F3F6F9',
    bubbleLeftText: '#1A2332',
    bubbleRightText: '#FFFFFF',

    // Buttons
    cancelButton: '#F3F6F9',
    cancelButtonText: '#5A6678',
    dangerButton: '#FFFFFF',
    dangerBorder: '#E53935',
    dangerText: '#E53935',
    signOutButton: '#1A2332',
    signOutText: '#FFFFFF',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#E4E9F0',

    // Navigation header
    headerBackground: '#FFFFFF',
    headerText: '#1A2332',

    // Shadows
    shadow: 'rgba(26, 35, 50, 0.08)',
    shadowMedium: 'rgba(26, 35, 50, 0.12)',
    shadowStrong: 'rgba(26, 35, 50, 0.16)',

    // Status bar
    statusBar: 'dark-content',

    // Success/Info/Warning
    success: '#2D7738',
    info: '#2196F3',
    warning: '#FF9800',
    error: '#E53935',
  },

  dark: {
    // Backgrounds
    background: '#0D1117',
    surface: '#161B22',
    surfaceAlt: '#1C2128',
    surfaceElevated: '#21262D',

    // Text
    text: '#E6EDF3',
    textSecondary: '#8B949E',
    textTertiary: '#6E7681',

    // Borders
    border: '#30363D',
    borderLight: '#21262D',

    // Brand - Brighter green for dark mode
    primary: '#4CAF50',
    primaryDark: '#66BB6A',
    primaryLight: '#1B3A1D',
    primaryGradientStart: '#4CAF50',
    primaryGradientEnd: '#66BB6A',
    accent: '#FFB74D',

    // Inputs
    inputBorder: '#30363D',
    inputBackground: '#0D1117',
    inputText: '#E6EDF3',
    placeholder: '#6E7681',
    inputFocus: '#4CAF50',

    // Cards
    card: '#161B22',
    cardHover: '#1C2128',
    cardSelected: '#1B3A1D',
    cardBorder: '#30363D',

    // Modal
    modalOverlay: 'rgba(1, 4, 9, 0.8)',
    modalBackground: '#161B22',

    // Chat
    chatBackground: '#0D1117',
    bubbleLeft: '#1C2128',
    bubbleLeftText: '#E6EDF3',
    bubbleRightText: '#FFFFFF',

    // Buttons
    cancelButton: '#21262D',
    cancelButtonText: '#8B949E',
    dangerButton: '#161B22',
    dangerBorder: '#F85149',
    dangerText: '#F85149',
    signOutButton: '#21262D',
    signOutText: '#E6EDF3',

    // Tab bar
    tabBar: '#161B22',
    tabBarBorder: '#30363D',

    // Navigation header
    headerBackground: '#161B22',
    headerText: '#E6EDF3',

    // Shadows
    shadow: 'rgba(1, 4, 9, 0.3)',
    shadowMedium: 'rgba(1, 4, 9, 0.4)',
    shadowStrong: 'rgba(1, 4, 9, 0.5)',

    // Status bar
    statusBar: 'light-content',

    // Success/Info/Warning
    success: '#4CAF50',
    info: '#58A6FF',
    warning: '#FFB74D',
    error: '#F85149',
  },
};

// Common shadow styles
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Typography
export const typography = {
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h2: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  h3: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
  h4: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  h5: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  h6: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export function useTheme() {
  const isDarkMode = useAppStore(state => state.isDarkMode);
  return isDarkMode ? colors.dark : colors.light;
}
