// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This function checks if all required config keys are present and valid
function isFirebaseConfigComplete(config: typeof firebaseConfig): boolean {
    return Object.values(config).every(value => typeof value === 'string' && value.length > 0);
}

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

if (!isFirebaseConfigComplete(firebaseConfig)) {
    // This will cause a loud error during build if env vars are missing, which is what we want.
    // The build should not proceed without a valid config.
    console.error(`
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    !!! ATENCIÓN: CONFIGURACIÓN DE FIREBASE INCOMPLETA O INVÁLIDA !!!
    
    Faltan una o más variables de entorno NEXT_PUBLIC_FIREBASE_* en tu archivo .env
    o los valores proporcionados son incorrectos. La compilación se detendrá.
    
    Valores actuales (revisa si hay 'undefined' o están vacíos):
    - apiKey: ${firebaseConfig.apiKey}
    - authDomain: ${firebaseConfig.authDomain}
    - projectId: ${firebaseConfig.projectId}
    - storageBucket: ${firebaseConfig.storageBucket}
    - messagingSenderId: ${firebaseConfig.messagingSenderId}
    - appId: ${firebaseConfig.appId}
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    `);
    // Throwing an error here is intentional to stop the build process.
    throw new Error("Firebase config is incomplete. Check your NEXT_PUBLIC_FIREBASE_* environment variables.");
}

// If the config is valid, we can proceed with initialization.
// This guarantees that 'app', 'db', and 'storage' will be assigned.
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

db = getFirestore(app);
storage = getStorage(app);

// Now db and storage are guaranteed to be initialized and are not nullable.
export { db, storage };
