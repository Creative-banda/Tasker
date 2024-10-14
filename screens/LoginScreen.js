import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput, SafeAreaView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, get, update } from 'firebase/database';
import { database } from '../components/firebase';
import CustomModal from '../components/CustomModal';
import CrossIcon from '../assets/SVG/cross';
import DownArrow from '../assets/SVG/DownArrow';
import {SEND_OTP} from '@env'

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
  const [SelectedUser, SetSelectedUser] = useState("");
  const [sending, setSending] = useState(false);
  const [ExpoToken, setExpoToken] = useState("");

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

  useEffect(() => {
    const fetchToken = async () => {
      let token = await AsyncStorage.getItem('expoPushToken');
      if (!token) {
        setTimeout(fetchToken, 1000);
      } else {
        console.log('Token fetched:', token);
        setExpoToken(token);
      }
    };

    fetchToken();
  }, []);


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
      setNameWithEmail(fetchedData);

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
      SetSelectedUser(selectedPerson);
      console.log(selectedPerson);
      ConfirmSend(selectedPerson.email, selectedPerson.name);
    }
  };

  const ConfirmSend = (mail, username) => {
    const confirm_OTP = Math.floor(1000 + Math.random() * 9000).toString();
    console.log("Generated OTP:", confirm_OTP);
    SetConfirmOtp(confirm_OTP);
    console.log("Selected User : ", mail);
    sendEmail(mail, confirm_OTP, username);
  };

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

  const sendEmail = async (mail, message, username) => {
    setSending(true);
    try {
      const apiUrl = SEND_OTP;
      const res = await fetch(`${apiUrl}?recipient=${encodeURIComponent(mail)}&otpCode=${encodeURIComponent(message)}&username=${encodeURIComponent(username)}`);
      const text = await res.text();
      console.log(text);

      Alert.alert(
        "Email Sent",
        "OTP Sent to " + mail,
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
    console.log("OTP Submitted:", otp, "Expected OTP:", Confirm_otp);
    if (otp === Confirm_otp) {
      try {
        if (!ExpoToken) {
          Alert.alert("No Permission","Please Allow The Notification")
          console.error("Token is null. Ensure the token is stored in AsyncStorage.");
          return;
        }
        console.log("Token before updating Firebase:", ExpoToken);

        if (SelectedUser.email) {
          const adminRef = ref(database, 'Admin');
          const snapshot = await get(adminRef);

          if (snapshot.exists()) {
            const adminData = snapshot.val();
            let userKey = null;

            for (const key in adminData) {
              if (adminData[key].email === SelectedUser.email) {
                userKey = key;
                break;
              }
            }

            if (userKey !== null) {
              const userRef = ref(database, `Admin/${userKey}`);
              console.log("Updating token for user:", SelectedUser.email, "with key:", userKey);
              await update(userRef, {token : ExpoToken });
              console.log("Token updated for user:", SelectedUser.email);
            } else {
              console.log("No matching email found in Admin node.");
            }
          } else {
            console.log("Admin node does not exist in the database.");
          }
        } else {
          console.log("No email selected for the user.");
        }
      } catch (error) {
        console.error('Error during OTP submission:', error);
      }
      handleSaveSelection();
      
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