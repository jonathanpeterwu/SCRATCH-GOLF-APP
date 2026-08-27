import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from './src/store/appStore';
import { loadFromStorage } from './src/services/storage';
import { openDb } from './src/services/db';
import { getReviews } from './src/services/reviews';
import { getBookings } from './src/services/teeTimes';
import { getPlayLog } from './src/services/playLog';
import { getProfileSettings } from './src/services/gameProfile';
import { useTheme } from './src/theme';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import TeeTimesScreen from './src/screens/TeeTimesScreen';
import GolfBagScreen from './src/screens/GolfBagScreen';
import ChatScreen from './src/screens/ChatScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const { user, isDarkMode, setUser, setGolfBag, setGhinData, setDarkMode, setCourseData,
    setChatHistory } = useAppStore();
  const systemColorScheme = useColorScheme();
  const theme = useTheme();

  useEffect(() => {
    loadFromStorage().then(data => {
      if (data.user) setUser(data.user);
      if (data.golfBag) setGolfBag(data.golfBag);
      if (data.ghinData) setGhinData(data.ghinData);
      if (data.chatHistory) setChatHistory(data.chatHistory);
    });

    // Default to system preference
    if (systemColorScheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  // Open the private course database for whoever is signed in and pull their
  // ratings and bookings into the store.
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    (async () => {
      try {
        await openDb(user.id);
        const [reviews, bookings, playLog, profileSettings] = await Promise.all([
          getReviews(user.id),
          getBookings(user.id),
          getPlayLog(user.id),
          getProfileSettings(user.id),
        ]);
        if (!cancelled) setCourseData({ reviews, bookings, playLog, profileSettings });
      } catch (error) {
        console.error('Error opening course database:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

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
              borderTopWidth: 1,
              paddingTop: 8,
              paddingBottom: 8,
              height: 60,
            },
            headerStyle: {
              backgroundColor: theme.headerBackground,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            },
            headerTintColor: theme.headerText,
            tabBarLabelStyle: { fontSize: 10 },
          }}
        >
          <Tab.Screen
            name="Courses"
            component={CoursesScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="golf" size={24} color={color} />
              ),
              headerTitle: 'Course Rankings',
            }}
          />
          <Tab.Screen
            name="Tee Times"
            component={TeeTimesScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'calendar' : 'calendar-outline'}
                  size={22}
                  color={color}
                />
              ),
              headerTitle: 'My Tee Times',
            }}
          />
          <Tab.Screen
            name="Bag"
            component={GolfBagScreen}
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? "golf" : "golf"}
                  size={26}
                  color={color}
                />
              ),
              headerTitle: 'My Golf Bag',
            }}
          />
          <Tab.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "chatbubbles" : "chatbubbles-outline"}
                  size={24}
                  color={color}
                />
              ),
              headerTitle: 'Golf Coach',
            }}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "stats-chart" : "stats-chart-outline"}
                  size={24}
                  color={color}
                />
              ),
              headerTitle: 'My Stats',
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={24}
                  color={color}
                />
              ),
              headerTitle: 'Profile',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
