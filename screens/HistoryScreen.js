import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, TouchableWithoutFeedback, Alert, BackHandler } from 'react-native';
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
    
            let historyRef = ref(database, 'history');
            let peopleDataRef = ref(database, 'Admin');
            const historySnapshot = await get(historyRef);
            const peopleSnapshot = await get(peopleDataRef);
    
            if (historySnapshot.exists() && peopleSnapshot.exists()) {
                const historyData = historySnapshot.val();
                const peopleData = peopleSnapshot.val();
    
                const assignedToUser = Object.values(historyData).filter(item => item.assignedTo === username);
                
                const assignedByUser = Object.values(historyData).filter(item => item.assignedBy === username);
    
                const filteredByName = [...assignedToUser, ...assignedByUser];
    
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
    
    const renderTask = ({ item }) => {
        const taskTime = new Date(item.time);
        const endTime = new Date(item.endTime);

        return (
            <View style={styles.taskItem}>
                <Text style={styles.taskText}>Assign By: {item.assignedBy}</Text>
                <Text style={styles.taskText}>To: {item.assignedTo}</Text>
                <Text style={styles.para}>Task: {item.title}</Text>
                <Text style={styles.taskTime}>
                    From {taskTime.toLocaleTimeString()} to {endTime.toLocaleTimeString()}
                </Text>
            </View>
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
                const tasksToDelete = Object.keys(historyData).filter(taskId =>
                    historyData[taskId].assignedBy === username
                );
    
                const updates = {};
                tasksToDelete.forEach(taskId => {
                    updates[`/history/${taskId}`] = null;
                });
    
                await update(ref(database), updates);
    
                // Update local state after deletion
                const remainingTasks = doneTasks.filter(task => !tasksToDelete.includes(task.id));
                setDoneTasks(remainingTasks);
                setFilteredTasks(remainingTasks); // Update filteredTasks to match doneTasks
                setDropdownVisible(false);
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
                    keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                    renderItem={renderTask}
                    contentContainerStyle={styles.list}
                />
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        paddingVertical: 20,
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
});

export default HistoryScreen;
