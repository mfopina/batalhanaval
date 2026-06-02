import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBwd3e6wneYAOULHDBAwhq3mraHTPWO7i0",
    authDomain: "batalha-naval-online-ed013.firebaseapp.com",
    projectId: "batalha-naval-online-ed013",
    storageBucket: "batalha-naval-online-ed013.firebasestorage.app",
    messagingSenderId: "848215303165",
    appId: "1:848215303165:web:c30c20a48e4714deb9ef94"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
