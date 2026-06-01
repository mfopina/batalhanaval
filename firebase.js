// =========================
// Firebase Configuration
// =========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ======================================================
// SUBSTITUA PELOS DADOS DO SEU PROJETO FIREBASE
// ======================================================

const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "000000000000",
    appId: "SEU_APP_ID"
};

// ======================================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };
