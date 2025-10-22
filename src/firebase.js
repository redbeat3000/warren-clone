// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getPerformance } from "firebase/performance";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB96ifoM5I-GNlZh6nZCRlCMpBO_uMFdCE",
  authDomain: "warren-clone.firebaseapp.com",
  projectId: "warren-clone",
  storageBucket: "warren-clone.firebasestorage.app",
  messagingSenderId: "902305488345",
  appId: "1:902305488345:web:e47404f30a83d96cbe0dc8",
  measurementId: "G-5HFMN659Y8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const performance = getPerformance(app);

// Export the app instance and analytics
export { app, analytics };

export default app;