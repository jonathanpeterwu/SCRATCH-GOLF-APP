import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAppStore } from './src/store/appStore';
import { loadFromStorage } from './src/services/storage';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import GolfBagScreen from './src/screens/GolfBagScreen';
import ChatScreen from './src/screens/ChatScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const { user, setUser, setGolfBag, setGhinData } = useAppStore();

  useEffect(() => {
    // Load data from storage on app start
    loadFromStorage().then(data => {
      if (data.user) setUser(data.user);
      if (data.golfBag) setGolfBag(data.golfBag);
      if (data.ghinData) setGhinData(data.ghinData);
    });
  }, []);

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2e7d32',
          tabBarInactiveTintColor: 'gray',
        }}
      >
        <Tab.Screen
          name="Bag"
          component={GolfBagScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>⛳</Text>
          }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💬</Text>
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📊</Text>
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
