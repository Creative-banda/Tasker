import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyBG4aUuoDTt1Hb2_A7wCFbKr389b9atE_E",
    authDomain: "tasker-2e23e.firebaseapp.com",
    projectId: "tasker-2e23e",
    storageBucket: "tasker-2e23e.appspot.com",
    messagingSenderId: "86757479088",
    appId: "1:86757479088:web:d0cc2f86ebcca86c182175",
    measurementId: "G-202Q6D5D3G"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };