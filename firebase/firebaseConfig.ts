import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyAW_U-DjNi3PYhiDOQ4FpE6t-VkCUvO-k8",
  authDomain: "billing2-2f453.firebaseapp.com",
  databaseURL: "https://billing2-2f453-default-rtdb.firebaseio.com",
  projectId: "billing2-2f453",
  storageBucket: "billing2-2f453.firebasestorage.app",
  messagingSenderId: "734384256613",
  appId: "1:734384256613:web:56f950f278902f29e9b88c",
  measurementId: "G-F90QHM1F5Q"
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
