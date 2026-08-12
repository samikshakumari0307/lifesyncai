// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBk6F3vJF7izpt_Fiv8qPV3aKHkrIbJQqI",
  authDomain: "lifesyncai-d8ec9.firebaseapp.com",
  projectId: "lifesyncai-d8ec9",
  storageBucket: "lifesyncai-d8ec9.firebasestorage.app",
  messagingSenderId: "41464935682",
  appId: "1:41464935682:web:c649120cec23981182be1b",
  measurementId: "G-G1ZGMXQQGB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
