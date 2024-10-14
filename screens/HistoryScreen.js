import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, TouchableWithoutFeedback, Alert, BackHandler, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Filter from '../assets/SVG/FilterIcon';
import { ref, get, update } from 'firebase/database';
import { database } from '../components/firebase';

function HistoryScreen() {
    const [doneTasks, setDoneTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [filterSearchQuery, setFilterSearchQuery] = useState('');
    const [filterPeople, setFilterPeople] = useState([]);
    const [selectedTasks, setSelectedTasks] = useState([]);

    useEffect(() => {
        initializeHistory();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (isDropdownVisible) {
                    setDropdownVisible(false);
                    return true;
                }
                return false;
            };

            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => {
                BackHandler.removeEventListener('hardwareBackPress', onBackPress);
            };
        }, [isDropdownVisible])
    );

    const initializeHistory = async () => {
        try {
            const username = await AsyncStorage.getItem('userName');
            const userrole = await AsyncStorage.getItem('userRole');
            const userTeam = await AsyncStorage.getItem('userTeam');

            console.log('Retrieved username from AsyncStorage:', username, userTeam, userrole);

            const historyRef = ref(database, 'history');
            const peopleDataRef = ref(database, 'Admin');
            const historySnapshot = await get(historyRef);
            const peopleSnapshot = await get(peopleDataRef);

            if (historySnapshot.exists() && peopleSnapshot.exists()) {
                const historyData = historySnapshot.val();
                const peopleData = peopleSnapshot.val();

                const assignedToUser = Object.values(historyData).filter(item => item.assignedTo === username);
                const assignedByUser = Object.values(historyData).filter(item => item.assignedBy === username);

                const filteredByName = [...assignedToUser, ...assignedByUser].map((item, index) => ({
                    ...item,
                    id: `${item.assignedBy}-${item.title}-${index}`
                }));

                if (userrole === "Admin") {
                    setFilterPeople(Object.values(peopleData));
                } else {
                    const filteredByTeam = Object.values(peopleData).filter(item => item.Team === userTeam);
                    setFilterPeople(filteredByTeam);
                }

                setFilteredTasks(filteredByName);
                setDoneTasks(filteredByName);
            } else {
                console.log('No data available');
            }
        } catch (error) {
            console.error('Error fetching history from Firebase:', error);
            Alert.alert('Error', 'Failed to fetch data. Please try again.');
        }
    };



    const toggleTaskSelection = (id, assignedTo, assignedBy, title) => {
        setSelectedTasks((prevSelectedTasks) => {
            const taskIndex = prevSelectedTasks.findIndex(task => task.id === id);
            if (taskIndex !== -1) {
                return prevSelectedTasks.filter(task => task.id !== id);
            } else {
                return [...prevSelectedTasks, { id, assignedTo, assignedBy, title }];
            }
        });
    };

    const handleDeleteSelectedTasks = async () => {
        Alert.alert(
            'Delete Tasks',
            'Are you sure you want to delete selected tasks?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'OK',
                    onPress: async () => {
                        try {
                            const historyRef = ref(database, 'history');
                            const historySnapshot = await get(historyRef);

                            if (historySnapshot.exists()) {
                                const historyData = historySnapshot.val();
                                console.log('Fetched history data:', historyData);

                                // Prepare updates object
                                let updates = {};
                                selectedTasks.forEach(task => {
                                    // Find the key corresponding to the task
                                    const keyToRemove = Object.keys(historyData).find(key => {
                                        const historyTask = historyData[key];
                                        return historyTask.assignedBy === task.assignedBy && historyTask.title === task.title;
                                    });

                                    if (keyToRemove) {
                                        updates[`/history/${keyToRemove}`] = null;
                                        console.log('Task to delete:', historyData[keyToRemove], 'with key:', keyToRemove);
                                    }
                                });

                                console.log('Updates to apply:', updates);

                                // Apply updates
                                await update(ref(database), updates);
                                console.log('Firebase updated successfully');

                                // Update local state
                                const remainingTasks = doneTasks.filter(task => !selectedTasks.some(selTask => selTask.assignedBy === task.assignedBy && selTask.title === task.title));
                                setDoneTasks(remainingTasks);
                                setFilteredTasks(remainingTasks);
                                setSelectedTasks([]);
                                Alert.alert('Success', 'Selected tasks have been deleted.');
                            } else {
                                Alert.alert('Error', 'No tasks found to delete.');
                                console.log('No history data available');
                            }
                        } catch (error) {
                            console.error('Error deleting tasks from Firebase:', error);
                            Alert.alert('Error', 'Failed to delete selected tasks.');
                        }
                    },
                },
            ]
        );
    };



    const handleCancelSelection = () => {
        setSelectedTasks([]);
    };

    const renderTask = ({ item }) => {
        const taskTime = new Date(item.time);
        const endTime = new Date(item.endTime);
        const isSelected = selectedTasks.some(task => task.id === item.id);

        return (
            <TouchableOpacity
                style={[styles.taskItem, isSelected && styles.selectedTaskItem]}
                onPress={() => toggleTaskSelection(item.id, item.assignedTo, item.assignedBy, item.title)}
            >
                <Text style={styles.taskText}>Assign By: {item.assignedBy}</Text>
                <Text style={styles.taskText}>To: {item.assignedTo}</Text>
                <Text style={styles.para}>Task: {item.title}</Text>
                <Text style={styles.taskTime}>
                    From {taskTime.toLocaleTimeString()} to {endTime.toLocaleTimeString()}
                </Text>
            </TouchableOpacity>
        );
    };

    const handleFilterTasks = () => {
        setDropdownVisible(true);
    };

    const handlePersonSelect = (person) => {
        setDropdownVisible(false);
        if (person.name === 'All') {
            setFilteredTasks(doneTasks);
        } else {
            const filteredTasks = doneTasks.filter(task =>
                task.assignedTo === person.name || task.assignedBy === person.name
            );
            setFilteredTasks(filteredTasks);
        }
    };

    const handleFilterSearch = (query) => {
        setFilterSearchQuery(query);
    };

    const handleDeleteAllData = async () => {
        try {
            const username = await AsyncStorage.getItem('userName');
            const historyRef = ref(database, 'history');
            const historySnapshot = await get(historyRef);

            if (historySnapshot.exists()) {
                const historyData = historySnapshot.val();
                const tasksToDelete = Object.keys(historyData).filter(taskId => historyData[taskId].assignedBy === username || historyData[taskId].assignedTo === username
                );

                const updates = {};
                tasksToDelete.forEach(taskId => {
                    updates[`/history/${taskId}`] = null;
                });

                await update(ref(database), updates);

                const remainingTasks = doneTasks.filter(task => !tasksToDelete.includes(task.id));
                setDoneTasks(remainingTasks);
                setFilteredTasks(remainingTasks);
                setDropdownVisible(false);
                initializeHistory();
                Alert.alert('Success', 'Tasks assigned by you have been deleted.');
            } else {
                console.log('No history data available');
            }
        } catch (error) {
            console.error('Error deleting data:', error);
            Alert.alert('Error', 'Failed to delete history data.');
        }
    };

    return (
        <SafeAreaView style={{flex:1, backgroundColor: '#1a1a1a',}}>

            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>History</Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity style={styles.iconButton} onPress={handleFilterTasks}>
                            <Filter width={30} height={30} color="#FFFFFF" strokeWidth={1} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAllData}>
                            <Text style={styles.deleteButtonText}>Delete All</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {filteredTasks.length === 0 ? (
                    <Text style={styles.noTasksText}>No completed tasks</Text>
                ) : (
                    <FlatList
                        data={filteredTasks}
                        keyExtractor={(item) => `${item.assignedBy}-${item.assignedTo}-${item.title}-${item.id}`}
                        renderItem={renderTask}
                        contentContainerStyle={styles.list}
                    />


                )}

                {selectedTasks.length > 0 && (
                    <View style={styles.selectionActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleDeleteSelectedTasks}>
                            <Text style={styles.actionButtonText}>Delete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={handleCancelSelection}>
                            <Text style={styles.actionButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Modal
                    visible={isDropdownVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setDropdownVisible(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
                        <View style={styles.dropdownOverlay}>
                            <View style={styles.dropdownContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search"
                                    placeholderTextColor="#888"
                                    value={filterSearchQuery}
                                    onChangeText={handleFilterSearch}
                                />
                                <ScrollView style={styles.scrollview}>
                                    {[{ id: 0, name: "All" }, ...filterPeople].filter(item =>
                                        item.name.toLowerCase().includes(filterSearchQuery.toLowerCase())
                                    ).map(person => (
                                        <TouchableOpacity
                                            key={person.id}
                                            onPress={() => handlePersonSelect(person)}
                                            style={styles.dropdownItem}
                                        >
                                            <Text style={styles.dropdownItemText}>{person.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    header: {
        color: '#FFFFFF',
        fontSize: 28,
        marginTop: 20,
        marginBottom: 15,
        fontWeight: 'bold',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    noTasksText: {
        color: 'white',
        fontSize: 20,
        textAlign: 'center',
        marginTop: 20,
    },
    list: {
        paddingHorizontal: 20,
    },
    taskItem: {
        backgroundColor: '#444',
        padding: 20,
        marginVertical: 10,
        borderRadius: 10,
    },
    selectedTaskItem: {
        backgroundColor: '#666',
    },
    taskText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    para: {
        color: 'white',
        fontSize: 16,
        marginBottom: 5,
    },
    taskTime: {
        marginTop: 30,
        color: 'white',
        fontSize: 14,
    },
    iconButton: {
        marginRight: 10,
    },
    deleteButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: '#FF3B30',
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    dropdownOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    dropdownContainer: {
        backgroundColor: '#333',
        borderRadius: 10,
        width: '80%',
        padding: 20,
    },
    searchInput: {
        height: 40,
        borderColor: '#555',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 10,
        color: '#fff',
        backgroundColor: '#222',
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#555',
    },
    dropdownItemText: {
        fontSize: 18,
        color: '#fff',
    },
    scrollview: {
        backgroundColor: '#333',
    },
    selectionActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    actionButton: {
        padding: 10,
        backgroundColor: '#FF3B30',
        borderRadius: 5,
        marginHorizontal: 10,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        paddingHorizontal: 20,
    },
});

export default HistoryScreen;