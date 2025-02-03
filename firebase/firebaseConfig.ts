import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyC6zTSkJwqQXpuJ_E86roWsW_0jaU_SHDA",
  authDomain: "billing4-44c05.firebaseapp.com",
  databaseURL: "https://billing4-44c05-default-rtdb.firebaseio.com",
  projectId: "billing4-44c05",
  storageBucket: "billing4-44c05.firebasestorage.app",
  messagingSenderId: "61902749754",
  appId: "1:61902749754:web:e9a4303733dda2f3cc3503",
  measurementId: "G-K7H6XVKQZH"
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
