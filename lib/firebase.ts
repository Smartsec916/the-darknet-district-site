// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACm01u0QvzvYx52u5fYCKmgj6jyq_1Lk8",
  authDomain: "the-darknet-district-71873.firebaseapp.com",
  projectId: "the-darknet-district-71873",
  storageBucket: "the-darknet-district-71873.firebasestorage.app",
  messagingSenderId: "166866456762",
  appId: "1:166866456762:web:6f716b9832e8be9fd27283",
  measurementId: "G-N60E0QB9DD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);