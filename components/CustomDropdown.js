import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import Modal from 'react-native-modal';

const CustomDropdown = ({ label, options, selectedValue, onValueChange }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleSelect = (value) => {
        onValueChange(value);
        setIsModalVisible(false);
    };

    return (
        <View style={styles.dropdownContainer}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.dropdown}>
                <Text style={styles.selectedText}>{selectedValue}</Text>
            </TouchableOpacity>
            <Modal isVisible={isModalVisible} onBackdropPress={() => setIsModalVisible(false)}>
                <View style={styles.modalContent}>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.option} onPress={() => handleSelect(item)}>
                                <Text style={styles.optionText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    dropdownContainer: {
        marginBottom: 20,
    },
    label: {
        color: 'white',
        marginBottom: 5,
    },
    dropdown: {
        borderWidth: 1,
        borderColor: '#888',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#2a2a2a',
    },
    selectedText: {
        color: 'white',
    },
    modalContent: {
        backgroundColor: '#2a2a2a',
        padding: 22,
        borderRadius: 10,
    },
    option: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#555',
    },
    optionText: {
        color: 'white',
    },
});

export default CustomDropdown;
