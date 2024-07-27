import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NotificationPermission = () => {
  useEffect(() => {
    let isMounted = true;

    const checkNotificationPermission = async () => {
      try {
        let storedToken = await AsyncStorage.getItem('expoPushToken');
        if (storedToken) {
          console.log('Expo Push Token already stored:', storedToken);
          return;
        }

        // Handle notification permissions differently for iOS and Android
        let status;

        if (Platform.OS === 'ios') {
          // iOS specific permission check
          const permissionResponse = await Notifications.requestPermissionsAsync();
          status = permissionResponse.status;
        } else if (Platform.OS === 'android') {
          if (Device.osVersion >= 33) { // Android 13+
            // Check for POST_NOTIFICATIONS permission
            const { status: currentStatus } = await Notifications.getPermissionsAsync();
            if (currentStatus !== 'granted') {
              const permissionResponse = await Notifications.requestPermissionsAsync();
              status = permissionResponse.status;
            } else {
              status = currentStatus;
            }
          } else {
            // For Android versions below 13
            const permissionResponse = await Notifications.requestPermissionsAsync();
            status = permissionResponse.status;
          }
        }

        if (status !== 'granted') {
          console.log('Notification permissions denied');
          return;
        }

        // Retrieve and store the Expo push token
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        if (isMounted) {
          console.log('Expo Push Token:', token);
          await AsyncStorage.setItem('expoPushToken', token);
        }
      } catch (error) {
        console.error('Error checking or requesting notification permissions:', error);
      }
    };

    checkNotificationPermission();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
};

export default NotificationPermission;
