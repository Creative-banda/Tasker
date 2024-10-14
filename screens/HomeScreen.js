import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TouchableWithoutFeedback, TextInput, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import PeopleModal from '../components/PeopleModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../components/CustomAlert';
import History from '../assets/SVG/HistoryIcon';
import Filter from "../assets/SVG/FilterIcon";
import EditIcon from "../assets/SVG/Edit";
import AddIcon from "../assets/SVG/AddIcon";
import { ref, get, remove, set, onValue } from 'firebase/database';
import { database } from '../components/firebase';
import Alert from '../components/Alert';
import axios from 'axios';

const HomeScreen = ({ navigation }) => {
    const [isModalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [filterData, setFilterData] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [doneTasks, setDoneTasks] = useState([]);
    const [isAlertVisible, setAlertVisible] = useState(false);
    const [taskToMarkDone, setTaskToMarkDone] = useState(null);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [allTasks, setAllTasks] = useState([]);
    const [filterSearchQuery, setFilterSearchQuery] = useState('');
    const [filtercheck, setfiltercheck] = useState(false);
    const [filterperson, setfilterperson] = useState("");
    const [timeLeft, setTimeLeft] = useState({});
    const [alertMessage, setAlertMessage] = useState('');
    const [CustomalertVisible, setCustomAlertVisible] = useState(false);
    const [taskUpdateTrigger, setTaskUpdateTrigger] = useState(0);
    const [UserData, SetUsersData] = useState([]);
    const [DeleteData, SetDeleteData] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            await initializeData();
            await loadTasks();
        };

        fetchData();
        listenForTaskUpdates();
    }, []);

    useEffect(() => {
        loadTasks();
    }, [taskUpdateTrigger]);

    const listenForTaskUpdates = () => {
        const tasksRef = ref(database, 'tasks');
        onValue(tasksRef, (snapshot) => {
            if (snapshot.exists()) {
                const tasksData = snapshot.val();
                setTaskUpdateTrigger(prev => prev + 1);
            }
        });
    };

    useFocusEffect(
        useCallback(() => {
            const refreshData = async () => {
                await initializeData();
                await loadTasks();
            };
            refreshData();
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            const now = new Date();
            const updatedTimeLeft = tasks.reduce((acc, task) => {
                const endTime = new Date(task.endTime);
                const timeDifference = Math.max(0, endTime - now);
                const daysLeft = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                const hoursLeft = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutesLeft = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
                const timeLeftString = `${daysLeft}d ${hoursLeft}h ${minutesLeft}m`;
                return { ...acc, [task.id]: timeLeftString };
            }, {});
            setTimeLeft(updatedTimeLeft);
        }, [tasks])
    );

    const initializeData = async () => {
        try {
            const userTeam = await AsyncStorage.getItem('userTeam');
            const username = await AsyncStorage.getItem('userRole');
            const name = await AsyncStorage.getItem('userName');
            console.log("Name :",name);
            console.log("Role :",username);
            const rolesRef = ref(database, 'Admin');
            const snapshot = await get(rolesRef);

            if (snapshot.exists()) {
                const rolesData = snapshot.val();
                const rolesArray = Object.keys(rolesData).map(key => ({ ...rolesData[key], id: key }));
                const filteredRolesData = rolesArray.filter(item => item !== undefined);

                if (username === "Admin") {
                    const filtered = filteredRolesData.filter(item => item.name !== name);
                    setFilteredData(filtered);
                    setFilterData(filtered);
                    SetUsersData(filtered)
                } else {
                    const filteredByTeam = filteredRolesData.filter(item => item.Team === userTeam && item.name !== name || item.Team === "STEM" );
                    setFilteredData(filteredByTeam);
                    setFilterData(filteredByTeam);
                    SetUsersData(filteredByTeam)
                }
            } else {
                setFilteredData([]);
                setFilterData([]);
            }
        } catch (error) {
            console.error('Error fetching roles from Firebase:', error);
            setFilteredData([]);
            setFilterData([]);
        }
    };

    const loadTasks = async () => {
        try {
            const name = await AsyncStorage.getItem('userName');

            const tasksRef = ref(database, `tasks`);
            const snapshot = await get(tasksRef);
            if (snapshot.exists()) {
                const tasksData = snapshot.val();
                const parsedTasks = Object.keys(tasksData).map(taskId => ({
                    ...tasksData[taskId],
                    id: taskId,
                    time: tasksData[taskId].time ? new Date(tasksData[taskId].time) : new Date(),
                    endTime: tasksData[taskId].endTime ? new Date(tasksData[taskId].endTime) : new Date()
                }));
                const filteredTasks = parsedTasks.filter(task => task.assignedBy === name || task.assignedTo === name);
                setTasks(filteredTasks.sort((a, b) => new Date(a.endTime) - new Date(b.endTime)));
                setAllTasks(filteredTasks);
            } else {
                setTasks([]);
                setAllTasks([]);
            }
        } catch (error) {
            console.error('Error reading tasks from Firebase:', error);
        }
    };

    const toggleModal = async () => {
        const userRole = await AsyncStorage.getItem('userRole');
        if (userRole === 'User') {
            setAlertMessage('Sorry, only admin and TL can assign any task.');
            setCustomAlertVisible(true);
            return;
        }
        setModalVisible(!isModalVisible);

    };

    const toggleModalDropDown = () => {
        setDropdownVisible(!isDropdownVisible);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        const filtered = UserData.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
        setFilteredData(filtered);

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
            console.error('Error sending notification:', error.message);
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
            } else if (error.request) {
                console.error('Error request data:', error.request);
            } else {
                console.error('Error message:', error.message);
            }
        }
    };

    const handleMarkTaskDone = async () => {
        if (taskToMarkDone && taskToMarkDone.id) {
            const username = await AsyncStorage.getItem('userName');
            if (taskToMarkDone.assignedBy !== username) {
                sendNotification(taskToMarkDone.token, "Task : " +taskToMarkDone.title + "Is Completed, Marked Done By " + username);
            }
            try {
                const tasksRef = ref(database, `tasks/${taskToMarkDone.id}`);
                const taskSnapshot = await get(tasksRef);
                if (taskSnapshot.exists()) {
                    const taskData = taskSnapshot.val();
                    const historyRef = ref(database, `history/${taskToMarkDone.id}`);
                    await set(historyRef, taskData);
                    await remove(tasksRef);
                    const updatedTasks = tasks.filter(task => task.id !== taskToMarkDone.id);
                    setTasks(updatedTasks.sort((a, b) => new Date(a.endTime) - new Date(b.endTime)));
                    setAllTasks(updatedTasks);
                    setDoneTasks([...doneTasks, taskToMarkDone]);
                    setAlertVisible(false);
                }
            } catch (error) {
                console.error('Error marking task as done:', error);
                setAlertMessage("Failed to mark task as done. Please try again.");
                setCustomAlertVisible(true);
            }
        }
    };

    const renderTask = ({ item }) => {
        const timeLeftString = timeLeft[item.id] || '0d 0h 0m';
        const timeParts = timeLeftString.match(/(\d+)d (\d+)h (\d+)m/);
        const days = parseInt(timeParts[1], 10);
        const hours = parseInt(timeParts[2], 10);
        const minutes = parseInt(timeParts[3], 10);
        const isUrgent = days === 0 && hours === 0 && minutes < 15;

        return (
            <View style={[styles.taskItem, isUrgent && styles.urgentTaskItem]}>
                <Text style={styles.taskText}>Assigned By: {item.assignedBy}</Text>
                <Text style={styles.taskText}>Assigned To: {item.assignedTo}</Text>
                <Text style={styles.taskText}>Task: {item.title}</Text>
                <Text style={styles.minutesLeftstyle}>({timeLeftString} left)</Text>
                <TouchableOpacity
                    onPress={() => {
                        setTaskToMarkDone(item);
                        setAlertVisible(true);
                    }}
                    style={styles.doneButton}
                >
                    <Feather name="more-vertical" size={24} color="black" />
                </TouchableOpacity>
            </View>
        );
    };

    const dltstorage = async () => {
        console.log("Loading");
        SetDeleteData(DeleteData + 1)
        if (DeleteData >= 5) {
            try {
                await AsyncStorage.clear();
                navigation.navigate('RoleSelection');
                SetDeleteData(0)
            } catch (error) {
                console.error('Error clearing AsyncStorage:', error);
            }
        }
    };

    const Addremove = async () => {
        const userRole = await AsyncStorage.getItem('userRole');
        if (userRole !== 'Admin') {
            setAlertMessage('Sorry, Only Admin Can Edit');
            setCustomAlertVisible(true);
            return;
        }
        navigation.navigate('AddRemove');
    };

    const handleViewHistory = () => {
        navigation.navigate('History');
    };

    const handlePersonSelect = (person) => {
        setDropdownVisible(false);
        if (person.name === 'All') {
            setTasks(allTasks.sort((a, b) => new Date(a.endTime) - new Date(b.endTime)));
            setfiltercheck(false);
        } else {
            const filteredTasks = allTasks.filter(task => task.assignedTo === person.name);
            setTasks(filteredTasks.sort((a, b) => new Date(a.endTime) - new Date(b.endTime)));
            setfiltercheck(true);
            setfilterperson(person.name);
        }
    };

    const handleFilterSearch = (query) => {
        setFilterSearchQuery(query);
        const filtered = filterData.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
        setFilteredData(filtered);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#1a1a1a" }}>

            <LinearGradient colors={['#1a1a1a', '#333333']} style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
                <Alert
                    visible={CustomalertVisible}
                    message={alertMessage}
                    onOkay={() => setCustomAlertVisible(false)}
                />
                <TouchableOpacity onPress={dltstorage}>
                    <Text style={styles.header}>Tasker</Text>
                </TouchableOpacity>

                {filtercheck && <Text style={styles.FilterPerson}> Selected Filter : {filterperson}</Text>}
                <View style={styles.content}>
                    {tasks.length === 0 ? (
                        <Text style={styles.noTasksText}>No tasks</Text>
                    ) : (
                        <FlatList
                            data={tasks.filter(item => item && Object.keys(item).length > 0)}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderTask}
                            style={styles.taskList}
                        />
                    )}
                </View>
                <View style={styles.ButtonContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={Addremove}>
                        <View style={styles.iconWrapper}>
                            <EditIcon width={27} height={27} color="#FFFFFF" strokeWidth={1} />
                            <Text style={styles.editiconText}>Edit</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={handleViewHistory}>
                        <View style={styles.iconWrapper}>
                            <History width={30} height={30} color="#FFFFFF" strokeWidth={0.1} />
                            <Text style={styles.iconText}>History</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.plusIcon} onPress={toggleModal}>
                        <View style={styles.iconWrapper}>
                            <AddIcon name="plus" size={30} color="#FFFFFF" />
                            <Text style={styles.iconText}>Add</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => setDropdownVisible(true)}>
                        <View style={styles.iconWrapper}>
                            <Filter width={30} height={30} color="#FFFFFF" strokeWidth={1} />
                            <Text style={styles.iconText}>Filter</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <PeopleModal
                    isVisible={isModalVisible}
                    toggleModal={toggleModal}
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    filteredData={filteredData}
                    loaddata={loadTasks}
                />
                <CustomAlert
                    visible={isAlertVisible}
                    message="Are you sure you want to mark this task as done?"
                    onConfirm={handleMarkTaskDone}
                    onCancel={() => setAlertVisible(false)}
                />
                <Modal
                    visible={isDropdownVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={toggleModalDropDown}
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
                                <ScrollView>
                                    {[{ id: 'all', name: 'All' }, ...filterData].filter(item => item.name && item.name.toLowerCase().includes(filterSearchQuery.toLowerCase())).map(person => (
                                        <TouchableOpacity
                                            key={person.id.toString()}
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
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 30,
    },
    header: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noTasksText: {
        color: 'white',
        fontSize: 20,
        marginTop: 20,
    },
    taskItem: {
        backgroundColor: '#444',
        padding: 10,
        marginVertical: 10,
        borderRadius: 5,
        minWidth: '100%',
        alignItems: 'flex-start',
    },
    urgentTaskItem: {
        backgroundColor: '#ff4c4c',
    },
    taskText: {
        color: 'white',
        fontSize: 16,
        marginBottom: 5,
    },
    doneButton: {
        position: 'absolute',
        right: 10,
        padding: 5,
        backgroundColor: '#2EB5AB',
        borderRadius: 5,
    },
    ButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#0F0F0F',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    iconButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    dropdownOverlay: {
        flex: 1,
        paddingVertical: 70,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    iconText: {
        color: '#FFFFFF',
        marginTop: 5,
        fontSize: 10,
    },
    editiconText: {
        color: '#FFFFFF',
        marginTop: 5,
        fontSize: 10,
        marginRight: 5
    },
    dropdownContainer: {
        backgroundColor: '#2B2A29',
        borderRadius: 10,
        width: '80%',
        padding: 10,
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    searchInput: {
        height: 40,
        borderColor: '#000000',
        color: "#FFFFFF",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    minutesLeftstyle: {
        width: '100%',
        textAlign: 'right',
        color: '#FFFFFF'
    },
    FilterPerson: {
        backgroundColor: '#969696',
        width: "100%",
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: '800',
        textAlign: 'center',
        paddingVertical: 10
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    dropdownItemText: {
        fontSize: 18,
        color: "#FFFFFF"
    },
});

export default HomeScreen;