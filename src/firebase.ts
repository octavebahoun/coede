import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "northern-resource-pb34d",
  appId: "1:791002637317:web:d44ea6fe7043c6fb53286c",
  apiKey: "AIzaSyDh_DY6DTWY5XGpvecjTelg9UuYX2JGp_w",
  authDomain: "northern-resource-pb34d.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-1ed31eb0-7675-472f-bdf0-b943335cd445",
  storageBucket: "northern-resource-pb34d.firebasestorage.app",
  messagingSenderId: "791002637317"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
