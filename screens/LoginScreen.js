import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput, SafeAreaView, StatusBar, Alert , ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, get } from 'firebase/database';
import { database } from '../components/firebase';
import CustomModal from '../components/CustomModal';
import CrossIcon from '../assets/SVG/cross';
import CustomAlert from '../components/CustomAlert';
import DownArrow from '../assets/SVG/DownArrow';

const RoleSelection = ({ navigation }) => {
  const [role, setRole] = useState('');
  const [team, setTeam] = useState('');
  const [name, setName] = useState('');
  const [isRoleDropdownVisible, setRoleDropdownVisible] = useState(false);
  const [isTeamDropdownVisible, setTeamDropdownVisible] = useState(false);
  const [isNameDropdownVisible, setNameDropdownVisible] = useState(false);
  const [isOTPModalVisible, setOTPModalVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [roles, setRoles] = useState([]);
  const [Confirm_otp, SetConfirmOtp] = useState('');
  const [teams, setTeams] = useState([]);
  const [names, setNames] = useState([]);
  const [filteredNames, setFilteredNames] = useState([]);
  const [filterSearchQuery, setFilterSearchQuery] = useState('');
  const [NameWithEmail, setNameWithEmail] = useState([]);
  const [isAlertVisible, setAlertVisible] = useState(false);
  const [mail, setmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (role) {
      fetchTeams();
      setName('');
    }
  }, [role]);

  useEffect(() => {
    if (team) {
      fetchNames();
    }
  }, [team]);

  const fetchRoles = async () => {
    console.log("Fetching Roles");
    try {
      const rolesRef = ref(database, 'roles');
      const snapshot = await get(rolesRef);
      if (snapshot.exists()) {
        const rolesData = Object.keys(snapshot.val());
        setRoles(rolesData);
      }
    } catch (error) {
      console.error('Error fetching roles from Firebase:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      if (role === 'Admin') {
        setTeams([]);
        fetchNames();
      } else {
        const teamsRef = ref(database, `roles/${role}`);
        const snapshot = await get(teamsRef);
        if (snapshot.exists()) {
          const teamsData = Object.values(snapshot.val());
          setTeams(teamsData);
        } else {
          console.log(`No teams found for role: ${role}`);
        }
      }
    } catch (error) {
      console.error('Error fetching teams from Firebase:', error);
    }
  };

  const fetchNames = async () => {
    try {
      let namesData = [];
      let fetchedData = null;

      if (role === 'Admin') {
        const namesRef = ref(database, 'roles/Admin');
        const snapshot = await get(namesRef);
        if (snapshot.exists()) {
          fetchedData = snapshot.val();
          datawithmail = fetchNames
          namesData = Object.keys(fetchedData).map(key => fetchedData[key].name);
          console.log("Admin Data Fetched :", namesData);
        } else {
          console.log('No names found for role: admin');
        }
      } else if (role === 'TL' && team) {
        const teamRef = ref(database, `${team}`);
        const snapshot = await get(teamRef);
        if (snapshot.exists()) {
          fetchedData = snapshot.val();
          namesData = fetchedData.map(item => item.name);
          console.log("TL Data", fetchedData);
        } else {
          console.log(`No names found for team: ${team}`);
        }
      } else if (role === 'User' && team) {
        const adminRef = ref(database, 'Admin');
        const snapshot = await get(adminRef);
        if (snapshot.exists()) {
          const adminData = snapshot.val();
          fetchedData = Object.values(adminData).filter(item => item.Team === team);
          namesData = fetchedData.map(item => item.name);
        } else {
          console.log(`No names found for team: ${team}`);
        }
      }

      setNames(namesData);
      setFilteredNames(namesData);
      setNameWithEmail(fetchedData)

    } catch (error) {
      console.error('Error fetching names from Firebase:', error);
    }
  };


  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setRoleDropdownVisible(false);
    setTeam('');
    setTeams([]);
    setName('');
    setNames([]);
    setFilteredNames([]);

    if (selectedRole === 'Admin') {
      fetchNames();
    } else {
      fetchTeams();
    }
  };

  const handleTeamSelect = (selectedTeam) => {
    setTeam(selectedTeam);
    setTeamDropdownVisible(false);
    if (role === 'TL' || role === 'User') {
      fetchNames();
    }
  };

  const handleNameSelect = (selectedName) => {
    setName(selectedName);
    setNameDropdownVisible(false);
    const selectedPerson = NameWithEmail.find(n => n.name === selectedName);
    if (selectedPerson) {
      setmail(selectedPerson.email);
      console.log("Select Person : ", mail);
      setAlertVisible(true);
    }
  };

  const ConfirmSend = () => {
    const confirm_OTP = Math.floor(1000 + Math.random() * 9000).toString();

    console.log(confirm_OTP)
    SetConfirmOtp(confirm_OTP)
    sendEmail(mail, confirm_OTP)
    setAlertVisible(false)
  }

  const handleFilterSearch = (query) => {
    setFilterSearchQuery(query);
    const filtered = names.filter(item => item.toLowerCase().includes(query.toLowerCase()));
    setFilteredNames(filtered);
  };

  const handleSaveSelection = async () => {
    if (role && name) {
      await AsyncStorage.setItem('userRole', role);
      await AsyncStorage.setItem('userName', name);

      if (role !== 'Admin') {
        await AsyncStorage.setItem('userTeam', team);
      }

      navigation.navigate('Home');
    }
  };

  const sendEmail = async (mail, message) => {
    setSending(true);
    const apiUrl = 'https://script.google.com/macros/s/AKfycbxo7e0b-gpw4mIXeLiOQmwHW6Ao4u3jEm7bIaBvhLQLtlvZpTBhgq0D1-OR_cD_xr6R5g/exec';
    try {
      const res = await fetch(`${apiUrl}?recipient=${encodeURIComponent(mail)}&message=${encodeURIComponent(message)}&title=${encodeURIComponent("Tasker Login OTP")}`);
      const text = await res.text();
      console.log(text);

      Alert.alert(
        "Email Sent",
        text,
        [
          {
            text: "OK",
            onPress: () => setOTPModalVisible(true)
          }
        ]
      );
    } catch (error) {
      console.log("Error sending email: ", error);
    }
    setSending(false);
  };

  const handleOtpSubmit = async () => {
    if (otp === Confirm_otp) {
      try {
        await handleSaveSelection();
      } catch (error) {
        console.error('Error during OTP submission:', error);
      }
      setOTPModalVisible(false);
    } else {
      Alert.alert('Invalid OTP', 'The OTP you entered is incorrect.');
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Text style={styles.header}>Select Your Role</Text>

        <View style={styles.selectionContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setRoleDropdownVisible(true)}
          >
            <Text style={styles.dropdownButtonText}>{role || 'Select Role'}</Text>
            <DownArrow width={25} height={25} />
          </TouchableOpacity>

          {role && role !== 'Admin' && (
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setTeamDropdownVisible(true)}
            >
              <Text style={styles.dropdownButtonText}>{team || 'Select Team'}</Text>
              <DownArrow width={25} height={25} />
            </TouchableOpacity>
          )}

          {(team || role === 'Admin') && (
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setNameDropdownVisible(true)}
            >
              <Text style={styles.dropdownButtonText}>{name || 'Select Name'}</Text>
              <DownArrow width={25} height={25} />
            </TouchableOpacity>
          )}
        </View>

        <CustomModal
          visible={isRoleDropdownVisible}
          items={roles}
          onSelect={handleRoleSelect}
          onRequestClose={() => setRoleDropdownVisible(false)}
          placeholder=""
          filterEnabled={false}
        />

        <CustomModal
          visible={isTeamDropdownVisible}
          items={teams}
          onSelect={handleTeamSelect}
          onRequestClose={() => setTeamDropdownVisible(false)}
          placeholder=""
          filterEnabled={false}
        />
        {sending ?
        <ActivityIndicator size="large" color="#FFFFFF" /> :
        <Text></Text>
      } 

        <CustomModal
          visible={isNameDropdownVisible}
          items={filteredNames}
          onSelect={handleNameSelect}
          onRequestClose={() => setNameDropdownVisible(false)}
          placeholder="Search names..."
          filterEnabled={true}
          filterQuery={filterSearchQuery}
          onFilterChange={handleFilterSearch}
        />

        <CustomAlert
          visible={isAlertVisible}
          message={`${"Are you sure you want to send OTP at"} ${mail}`}
          onConfirm={ConfirmSend}
          onCancel={() => setAlertVisible(false)}
        />

        <Modal visible={isOTPModalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.otpModalContent}>
              <View style={{ width: "100%", alignItems: 'flex-end', paddingTop: 10 }}>
                <TouchableOpacity onPress={() => { setOTPModalVisible(false) }}>
                  <CrossIcon color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.otpHeader}>Enter OTP</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.otpButton}
                onPress={handleOtpSubmit}
              >
                <Text style={styles.otpButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>


      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1E1E1E',
  },
  header: {
    fontSize: 40,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Zain',
    fontWeight: '600',
  },
  selectionContainer: {
    marginBottom: 30,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  dropdownButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  otpModalContent: {
    width: '80%',
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  otpHeader: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  otpInput: {
    width: '100%',
    backgroundColor: '#3C3C3C',
    padding: 10,
    borderRadius: 10,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  otpButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  otpButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default RoleSelection;