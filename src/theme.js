import { useAppStore } from './store/appStore';

export const colors = {
  light: {
    // Backgrounds
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceAlt: '#f9f9f9',

    // Text
    text: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',

    // Borders
    border: '#e0e0e0',
    borderLight: '#f0f0f0',

    // Brand
    primary: '#2e7d32',
    primaryLight: '#f1f8f4',

    // Inputs
    inputBorder: '#dddddd',
    inputBackground: '#ffffff',
    inputText: '#333333',
    placeholder: '#999999',

    // Cards
    card: '#ffffff',
    cardSelected: '#f1f8f4',

    // Modal
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    modalBackground: '#ffffff',

    // Chat
    chatBackground: '#ffffff',
    bubbleLeft: '#f0f0f0',
    bubbleLeftText: '#333333',
    bubbleRightText: '#ffffff',

    // Buttons
    cancelButton: '#f5f5f5',
    cancelButtonText: '#666666',
    dangerButton: '#ffffff',
    dangerBorder: '#d32f2f',
    dangerText: '#d32f2f',
    signOutButton: '#333333',
    signOutText: '#ffffff',

    // Tab bar
    tabBar: '#ffffff',
    tabBarBorder: '#e0e0e0',

    // Navigation header
    headerBackground: '#ffffff',
    headerText: '#333333',

    // Status bar
    statusBar: 'dark-content',
  },

  dark: {
    // Backgrounds
    background: '#121212',
    surface: '#1e1e1e',
    surfaceAlt: '#252525',

    // Text
    text: '#e0e0e0',
    textSecondary: '#a0a0a0',
    textTertiary: '#707070',

    // Borders
    border: '#333333',
    borderLight: '#2a2a2a',

    // Brand
    primary: '#4caf50',
    primaryLight: '#1b3a1d',

    // Inputs
    inputBorder: '#444444',
    inputBackground: '#2a2a2a',
    inputText: '#e0e0e0',
    placeholder: '#666666',

    // Cards
    card: '#1e1e1e',
    cardSelected: '#1b3a1d',

    // Modal
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalBackground: '#1e1e1e',

    // Chat
    chatBackground: '#121212',
    bubbleLeft: '#2a2a2a',
    bubbleLeftText: '#e0e0e0',
    bubbleRightText: '#ffffff',

    // Buttons
    cancelButton: '#2a2a2a',
    cancelButtonText: '#a0a0a0',
    dangerButton: '#1e1e1e',
    dangerBorder: '#ef5350',
    dangerText: '#ef5350',
    signOutButton: '#2a2a2a',
    signOutText: '#e0e0e0',

    // Tab bar
    tabBar: '#1e1e1e',
    tabBarBorder: '#333333',

    // Navigation header
    headerBackground: '#1e1e1e',
    headerText: '#e0e0e0',

    // Status bar
    statusBar: 'light-content',
  },
};

export function useTheme() {
  const isDarkMode = useAppStore(state => state.isDarkMode);
  return isDarkMode ? colors.dark : colors.light;
}
