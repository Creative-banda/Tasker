import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationPermission = () => {
  useEffect(() => {
    const checkNotificationPermission = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('expoPushToken');

        if (storedToken) {
          console.log('Expo Push Token already stored:', storedToken);
          return;
        }
        const { status } = await Notifications.getPermissionsAsync();

        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            console.log('Notification permissions denied');
            return;
          }
        }
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        console.log('Expo Push Token:', token);

        await AsyncStorage.setItem('expoPushToken', token);

      } catch (error) {
        console.error('Error checking or requesting notification permissions:', error);
      }
    };

    checkNotificationPermission();
  }, []);

  return null;
};

export default NotificationPermission;
