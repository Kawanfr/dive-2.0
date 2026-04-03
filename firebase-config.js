import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGh47U4Pnlhf4gmP28Nzmx3-BvyZys2EM",
  authDomain: "dive-2.firebaseapp.com",
  projectId: "dive-2",
  storageBucket: "dive-2.firebasestorage.app",
  messagingSenderId: "213440510119",
  appId: "1:213440510119:web:73d98553795d5f3758c382"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
