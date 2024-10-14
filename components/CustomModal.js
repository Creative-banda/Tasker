import React, { useState } from 'react';
import { Modal, View, FlatList, TouchableOpacity, Text, StyleSheet, TextInput, TouchableWithoutFeedback, Animated } from 'react-native';

const CustomModal = ({ visible, items, onSelect, onRequestClose, placeholder, filterEnabled, filterQuery, onFilterChange }) => {
  const [isVisible, setIsVisible] = useState(visible);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }
  }, [visible]);

  const handleRequestClose = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onRequestClose();
    });
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleRequestClose}
    >
      <TouchableWithoutFeedback onPress={handleRequestClose}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0], }), },],
                },
              ]}
            >
              {filterEnabled && (
                <TextInput
                  style={styles.searchInput}
                  placeholder={placeholder}
                  value={filterQuery}
                  onChangeText={onFilterChange}
                  placeholderTextColor="#888"
                />
              )}
              <FlatList
                data={items}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => onSelect(item)}>
                    <Text style={styles.modalItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
              <TouchableOpacity style={styles.closeButton} onPress={handleRequestClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#2C2C2C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalItemText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Zain'
  },
  searchInput: {
    backgroundColor: '#3C3C3C',
    padding: 10,
    borderRadius: 10,
    color: '#FFFFFF',
    marginBottom: 15,
  },
  closeButton: {
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 0.5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6C63FF',
  },
});

export default CustomModal;