import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, useColorScheme, StatusBar } from 'react-native';
import { useAppStore } from './src/store/appStore';
import { loadFromStorage } from './src/services/storage';
import { useTheme } from './src/theme';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import GolfBagScreen from './src/screens/GolfBagScreen';
import ChatScreen from './src/screens/ChatScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const { user, isDarkMode, setUser, setGolfBag, setGhinData, setDarkMode } = useAppStore();
  const systemColorScheme = useColorScheme();
  const theme = useTheme();

  useEffect(() => {
    loadFromStorage().then(data => {
      if (data.user) setUser(data.user);
      if (data.golfBag) setGolfBag(data.golfBag);
      if (data.ghinData) setGhinData(data.ghinData);
    });

    // Default to system preference
    if (systemColorScheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const navigationTheme = isDarkMode ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.tabBar,
      border: theme.tabBarBorder,
      text: theme.text,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.tabBar,
      border: theme.tabBarBorder,
      text: theme.text,
    },
  };

  if (!user) {
    return (
      <>
        <StatusBar barStyle={theme.statusBar} />
        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle={theme.statusBar} />
      <NavigationContainer theme={navigationTheme}>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.textTertiary,
            tabBarStyle: {
              backgroundColor: theme.tabBar,
              borderTopColor: theme.tabBarBorder,
            },
            headerStyle: {
              backgroundColor: theme.headerBackground,
            },
            headerTintColor: theme.headerText,
          }}
        >
          <Tab.Screen
            name="Bag"
            component={GolfBagScreen}
            options={{
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>⛳</Text>
            }}
          />
          <Tab.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>💬</Text>
            }}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>📊</Text>
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text>
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
