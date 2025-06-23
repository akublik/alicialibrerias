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

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// This function checks if all required config keys are present and valid
function isFirebaseConfigComplete(config: typeof firebaseConfig): boolean {
    return Object.values(config).every(value => typeof value === 'string' && value.length > 0);
}

if (isFirebaseConfigComplete(firebaseConfig)) {
    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig);
      } catch(e) {
        console.error("Firebase initialization error:", e);
        // app remains null
      }
    } else {
      app = getApp();
    }

    if (app) {
        db = getFirestore(app);
        storage = getStorage(app);
    }
} else {
    // This warning will be visible in the server logs
    console.warn(`
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    !!! ATENCIÓN: CONFIGURACIÓN DE FIREBASE INCOMPLETA O INVÁLIDA !!!
    
    Faltan una o más variables de entorno NEXT_PUBLIC_FIREBASE_* en tu archivo .env
    o los valores proporcionados son incorrectos.
    
    La aplicación no podrá conectarse a Firebase hasta que esto se corrija.
    
    Valores actuales (revisa si hay 'undefined' o están vacíos):
    - apiKey: ${firebaseConfig.apiKey}
    - authDomain: ${firebaseConfig.authDomain}
    - projectId: ${firebaseConfig.projectId}
    - storageBucket: ${firebaseConfig.storageBucket}
    - messagingSenderId: ${firebaseConfig.messagingSenderId}
    - appId: ${firebaseConfig.appId}
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  `);
}


export { db, storage };
