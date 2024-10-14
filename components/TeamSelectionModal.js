// components/TeamSelectionModal.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

const TeamSelectionModal = ({ visible, onClose, onSelectTeam }) => {
    const teams = ['Financial literacy', 'Horticulture ', 'DIY', 'Robotics','Coding','R&D'];

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select a Team</Text>
                    {teams.map((team, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => onSelectTeam(team)}
                            style={styles.teamButton}
                        >
                            <Text style={styles.teamButtonText}>{team}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#545250',
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    teamButton: {
        padding: 10,
        backgroundColor: '#2EB5AB',
        borderRadius: 5,
        marginBottom: 10,
        alignItems: 'center',
    },
    teamButtonText: {
        color: 'white',
        fontSize: 16,
    },
    closeButton: {
        padding: 10,
        backgroundColor: '#ff4c4c',
        borderRadius: 5,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default TeamSelectionModal;
