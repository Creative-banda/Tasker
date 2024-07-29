import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { AntDesign } from '@expo/vector-icons';
import CustomDropdown from './CustomDropdown';
import { ref, set, push } from 'firebase/database';
import { database } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const PeopleModal = ({ isVisible, toggleModal, searchQuery = '', handleSearch, filteredData, loaddata }) => {
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [task, setTask] = useState('');
    const [days, setDays] = useState(0);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setSearchTerm(searchQuery || '');
    }, [searchQuery]);

    const handleNewSearch = (query) => {
        setSearchTerm(query);
        handleSearch(query);
        if (query === '') {
            setSelectedPerson(null);
        }
    };

    const handleItemPress = (item) => {
        setSelectedPerson(item);
        handleNewSearch(item.name);
    };

    
    const sendNotification = async (token, message) => {
        try {
            const response = await axios.post('https://taskerserver.onrender.com/send-notification', {
                token,
                message,
            });
    
            if (response.data.success) {
                console.log('Notification sent successfully:', response.data.ticketChunk);
            } else {
                console.error('Failed to send notification:', response.data.error);
            }
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Error request data:', error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
            }
            console.error('Error config:', error.config);
        }
    };
    


    const handleAssignTask = async () => {
        if (!selectedPerson) {
            Alert.alert('Error', 'Please select a person');
            return;
        }
        if (!task) {
            Alert.alert('Error', 'Please enter a task');
            return;
        }

        try {
            const userName = await AsyncStorage.getItem('userName');
            if (!userName) {
                Alert.alert('Error', 'Failed to retrieve username from storage.');
                return;
            }

            const taskStartTime = new Date();
            const taskEndTime = new Date(taskStartTime);
            taskEndTime.setDate(taskStartTime.getDate() + days);
            taskEndTime.setHours(taskStartTime.getHours() + hours);
            taskEndTime.setMinutes(taskStartTime.getMinutes() + minutes);

            const newTask = {
                title: task,
                name: selectedPerson.name,
                description: `Task assigned by ${userName} and reminder set for ${days} day(s), ${hours} hour(s), and ${minutes} minute(s) from now.`,
                time: taskStartTime.getTime(),
                endTime: taskEndTime.getTime(),
                assignedBy: userName,
                assignedTo: selectedPerson.name,
            };
            console.log(selectedPerson.token)

            const tasksRef = ref(database, `tasks`);
            const newTaskRef = push(tasksRef);
            await set(newTaskRef, newTask);

            Alert.alert('Success', `Task assigned to ${selectedPerson.name} and reminder set for ${days} day(s), ${hours} hour(s), and ${minutes} minute(s) from now.`);
            setTask('');
            console.log(selectedPerson.token);
            console.log(`Task assigned by ${userName} Task: ${task}`);
            sendNotification(selectedPerson.token, `Task assigned by ${userName} Task: ${task}`);
            setSelectedPerson(null);
            setDays(0);
            setHours(0);
            setMinutes(5);
            handleSearch('');
            toggleModal();
            loaddata();
        } catch (error) {
            console.error('Error assigning task:', error.message);
            Alert.alert('Error', 'Failed to assign task. Please try again.');
        }
    };

    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={toggleModal}
            onBackButtonPress={toggleModal}
        >
            <View style={styles.modalContent}>
                <View style={styles.searchBarContainer}>
                    <AntDesign name="search1" size={20} color="#888" style={styles.icon} />
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search name"
                        placeholderTextColor="#888"
                        onChangeText={handleNewSearch}
                        value={searchTerm}
                    />
                </View>
                {!selectedPerson ? (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.item} onPress={() => handleItemPress(item)}>
                                <Text style={styles.itemText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={styles.noResults}>No results found</Text>}
                    />
                ) : (
                    <View style={styles.selectedPersonContainer}>
                        <TextInput
                            style={[styles.input, { height: 130, textAlignVertical: 'top' }]}
                            placeholder="Assign task"
                            placeholderTextColor="#888"
                            value={task}
                            onChangeText={setTask}
                            multiline={true}
                        />
                        <View style={styles.dropdownRow}>
                            <CustomDropdown
                                label="Days"
                                options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                                selectedValue={days}
                                onValueChange={setDays}
                                style={styles.dropdown}
                            />
                            <CustomDropdown
                                label="Hour"
                                options={[...Array(24).keys()]}
                                selectedValue={hours}
                                onValueChange={setHours}
                                style={styles.dropdown}
                            />
                            <CustomDropdown
                                label="Mins"
                                options={[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]}
                                selectedValue={minutes}
                                onValueChange={setMinutes}
                                style={styles.dropdown}
                            />
                        </View>
                        <TouchableOpacity style={styles.assignButton} onPress={handleAssignTask}>
                            <Text style={styles.buttonText}>Assign Task & Set Reminder</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {!selectedPerson && (
                    <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        backgroundColor: '#2a2a2a',
        padding: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    searchBarContainer: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 25,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#333',
        elevation: 3,
    },
    searchBar: {
        flex: 1,
        color: 'white',
    },
    icon: {
        marginHorizontal: 10,
    },
    item: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#555',
    },
    itemText: {
        fontSize: 18,
        color: 'white',
    },
    selectedPersonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#888',
        borderRadius: 5,
        marginBottom: 20,
        color: 'white',
        backgroundColor: '#2a2a2a',
    },
    assignButton: {
        backgroundColor: '#4ABBBF',
        padding: 15,
        borderRadius: 5,
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#5BC0EB',
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: 'bold',
    },
    dropdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    dropdown: {
        textAlign: 'center',
        width: 30,
    },
    noResults: {
        color: 'white',
        marginTop: 10,
    },
});

export default PeopleModal;