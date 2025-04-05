import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyAR9FUui8byCaWX5M4uYeOfQQiuNK9QgMU",
  authDomain: "billing-468b4.firebaseapp.com",
  databaseURL: "https://billing-468b4-default-rtdb.firebaseio.com",
  projectId: "billing-468b4",
  storageBucket: "billing-468b4.firebasestorage.app",
  messagingSenderId: "710763854212",
  appId: "1:710763854212:web:06d1d4dfbecbf2e6ed05d1",
  measurementId: "G-F4TRTVBGKZ"
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
