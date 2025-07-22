// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

// This function will be replaced by the build process with the actual config
// Do not call this function directly.
function getFirebaseConfig(): FirebaseOptions {
    // ---- DYNAMIC CONFIG INJECTION ----
    // The server will inject the correct Firebase config here.
    // If you are seeing this in your local environment, it means you need to
    // add your Firebase config to a .env file for local development.
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!Object.values(firebaseConfig).every(Boolean)) {
        console.error("Firebase config is incomplete. Check your NEXT_PUBLIC_FIREBASE_* environment variables.");
        throw new Error("Firebase config is incomplete.");
    }

    return firebaseConfig;
}

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// --- DIAGNOSTIC LOG ---
console.log('======================================================================');
console.log('>>> FIREBASE CONFIGURATION CHECK <<<');
console.log(`>>> Using Firebase Project ID: ${firebaseConfig.projectId}`);
console.log('======================================================================');


db = getFirestore(app);
storage = getStorage(app);
auth = getAuth(app);

let googleMapsApiKey: string | undefined;

// This function is designed to run on the client-side, where process.env is populated by Next.js
// It will be undefined on the server-side, which is expected.
function initializeGoogleMaps() {
    googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!googleMapsApiKey) {
        console.warn('Google Maps API Key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) not found. Maps functionality will be disabled.');
    }
}

// Call the function to initialize the key.
// This approach ensures the environment variable is read in the client's context.
initializeGoogleMaps();

export { db, storage, auth, app, googleMapsApiKey };
