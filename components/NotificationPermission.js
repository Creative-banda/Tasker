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

        const { status: currentStatus } = await Notifications.getPermissionsAsync();
        const { status } = currentStatus !== 'granted'
          ? await Notifications.requestPermissionsAsync()
          : { status: currentStatus };

        if (status !== 'granted') {
          console.log('Notification permissions denied');
          return;
        }

        const { data: token } = await Notifications.getExpoPushTokenAsync({
          projectId: "24108c42-a068-420e-8774-2c0882980859"
        });

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