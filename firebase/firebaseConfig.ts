import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyBFpJMbFRaDKB1FLOtYNdW77LG9un7qirk",
  authDomain: "billing3-f5757.firebaseapp.com",
  projectId: "billing3-f5757",
  storageBucket: "billing3-f5757.firebasestorage.app",
  messagingSenderId: "255192274257",
  appId: "1:255192274257:web:3044d3b4d0cd80ba906f70",
  measurementId: "G-6JG05J6RL1"
};

// Initialize Firebase
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Firebase services initialization
const database = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);  // Initialize Firebase Auth

// Export services for use in other parts of the app
export { database, storage, auth };
