import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyD4Nf3aD7nK3ZHhaF0leTO6vg2Q1EwzSk8",
  authDomain: "billing1-b9ebd.firebaseapp.com",
  databaseURL: "https://billing1-b9ebd-default-rtdb.firebaseio.com",
  projectId: "billing1-b9ebd",
  storageBucket: "billing1-b9ebd.firebasestorage.app",
  messagingSenderId: "811498081209",
  appId: "1:811498081209:web:55ea2e49aa410623404468",
  measurementId: "G-349RRXWFLZ"
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
