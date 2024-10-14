import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { ref, get, set, remove } from 'firebase/database';
import { database } from '../components/firebase';
import CustomAlert from '../components/CustomAlert';
import TeamSelectionModal from '../components/TeamSelectionModal';
import AddPersonModal from '../components/AddPersonModal';

const AddRemoveScreen = () => {
    const [people, setPeople] = useState([]);
    const [newPerson, setNewPerson] = useState('');
    const [alertVisible, setAlertVisible] = useState(false);
    const [personToRemove, setPersonToRemove] = useState(null);
    const [teamModalVisible, setTeamModalVisible] = useState(false);
    const [personToAdd, setPersonToAdd] = useState(null);
    const [addPersonModalVisible, setAddPersonModalVisible] = useState(false);

    useEffect(() => {
        initializeData();
    }, []);

    const initializeData = async () => {
        try {
            const rolesRef = ref(database, 'Admin');
            const snapshot = await get(rolesRef);
            if (snapshot.exists()) {
                const rolesData = snapshot.val();
                const formattedRolesData = Object.keys(rolesData).map(key => ({
                    id: key,
                    name: rolesData[key].name,
                    team: rolesData[key].team,
                    email: rolesData[key].email,
                }));
                setPeople(formattedRolesData);
            } else {
                console.log('No data available for roles');
            }
        } catch (error) {
            console.error('Error fetching roles from Firebase:', error);
            Alert.alert('Error', 'Failed to fetch data. Please try again.');
        }
    };

    const generateRandomId = () => {
        return Math.random().toString(36).substring(7);
    };

    const handleAddPerson = () => {
        if (newPerson.trim() !== '') {
            setPersonToAdd(newPerson.trim());
            setTeamModalVisible(true);
        }
    };

    const handleSelectTeam = (team) => {
        if (personToAdd) {
            setTeamModalVisible(false);
            setPersonToAdd({ name: personToAdd, team });
            setAddPersonModalVisible(true);
        }
    };

    const handleAddPersonWithEmail = async (email, team) => {
        if (personToAdd.name && personToAdd.team) {
            try {
                const personId = generateRandomId();
                const newPersonRef = ref(database, `Admin/${personId}`);
                const newPersonData = {
                    Team: personToAdd.team,
                    email: email,
                    id: personId,
                    name: personToAdd.name,
                };
                await set(newPersonRef, newPersonData);
                initializeData();
                setNewPerson('');
                setPersonToAdd(null);
                setAddPersonModalVisible(false);
            } catch (error) {
                console.error('Error adding person:', error);
                Alert.alert('Error', 'Failed to add person. Please try again.');
            }
        }
    };

    const handleRemovePerson = (person) => {
        setPersonToRemove(person);
        setAlertVisible(true);
    };

    const handleConfirmRemove = async () => {
        if (personToRemove && personToRemove.id) {
            try {
                const personRef = ref(database, `Admin/${personToRemove.id}`);
                await remove(personRef);
                const updatedPeople = people.filter(p => p.id !== personToRemove.id);
                setPeople(updatedPeople);
                setAlertVisible(false);
                setPersonToRemove(null);
            } catch (error) {
                console.error('Error removing person:', error);
                Alert.alert('Error', 'Failed to remove person. Please try again.');
            }
        }
    };

    const handleCancelRemove = () => {
        setAlertVisible(false);
        setPersonToRemove(null);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#333" }}>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
                <View style={styles.container}>
                    <Text style={styles.header}>Add or Remove People</Text>
                    <FlatList
                        data={people}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.personItem}>
                                <Text style={styles.personName}>{item.name}</Text>
                                <TouchableOpacity onPress={() => handleRemovePerson(item)} style={styles.removeButton}>
                                    <Text style={styles.removeButtonText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter new person"
                        placeholderTextColor="#ccc"
                        value={newPerson}
                        onChangeText={setNewPerson}
                    />
                    <TouchableOpacity onPress={handleAddPerson} style={styles.addButton}>
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>

                    <CustomAlert
                        visible={alertVisible}
                        message={`Are you sure you want to remove ${personToRemove?.name}?`}
                        onConfirm={handleConfirmRemove}
                        onCancel={handleCancelRemove}
                    />

                    <TeamSelectionModal
                        visible={teamModalVisible}
                        onClose={() => setTeamModalVisible(false)}
                        onSelectTeam={handleSelectTeam}
                    />

                    <AddPersonModal
                        visible={addPersonModalVisible}
                        onClose={() => setAddPersonModalVisible(false)}
                        onSubmit={handleAddPersonWithEmail}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#333',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
    },
    personItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#444',
        borderRadius: 5,
        marginBottom: 10,
    },
    personName: {
        color: 'white',
        fontSize: 18,
    },
    removeButton: {
        backgroundColor: '#ff4c4c',
        padding: 10,
        borderRadius: 5,
    },
    removeButtonText: {
        color: 'white',
    },
    input: {
        backgroundColor: '#555',
        padding: 10,
        borderRadius: 5,
        color: 'white',
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: '#2EB5AB',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontSize: 18,
    },
});

export default AddRemoveScreen;