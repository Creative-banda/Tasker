import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const CustomAlert = ({ visible, message, onConfirm, onCancel }) => {
  const scaleValue = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true, 
      }).start();
    } else {
      scaleValue.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      onRequestClose={onCancel}
      style={{ zIndex: 1000 }} // Ensure it has a high z-index
    >
      <View style={styles.alertContainer}>
        <Animated.View style={[styles.alertBox, { transform: [{ scale: scaleValue }] }]}>
          <Icon name="exclamation-circle" size={40} color="#FF0000" style={styles.alertIcon} />
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.alertButton} onPress={onConfirm}>
              <Text style={styles.alertButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertButton} onPress={onCancel}>
              <Text style={styles.alertButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertBox: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 10000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  alertIcon: {
    marginBottom: 20,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  alertButton: {
    backgroundColor: '#46D6AA',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 10,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default CustomAlert;