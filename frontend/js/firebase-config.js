import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDI5ReTbUqAOIPRPi3YH-xsJekyDQygohY",
  authDomain: "web-architecture-group-project.firebaseapp.com",
  projectId: "web-architecture-group-project",
  storageBucket: "web-architecture-group-project.firebasestorage.app",
  messagingSenderId: "657802896955",
  appId: "1:657802896955:web:ebc9e70daa235ee7325e1e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);