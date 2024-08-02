import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import AddRemoveScreen from './screens/AddRemoveScreen';
import RoleSelection from './screens/LoginScreen';
import { useFonts } from 'expo-font';
import NotificationPermission from './components/NotificationPermission';
import * as Notifications from 'expo-notifications';

enableScreens();

const Stack = createNativeStackNavigator();

const App = () => {
  const [initialRoute, setInitialRoute] = useState(null);
  const [fontsLoaded] = useFonts({
    'Zain': require('./assets/fonts/Zain-Bold.ttf')
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const userRole = await AsyncStorage.getItem('userRole');
        const userName = await AsyncStorage.getItem('userName');

        if (userRole && userName) {
          setInitialRoute('Home');
        } else {
          setInitialRoute('RoleSelection');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitialRoute('RoleSelection');
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  if (initialRoute === null || !fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NotificationPermission />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="AddRemove" component={AddRemoveScreen} />
          <Stack.Screen name="RoleSelection" component={RoleSelection} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
