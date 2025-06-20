// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth'; // Importa getAuth si vas a usar Firebase Authentication
// import { getStorage } from 'firebase/storage'; // Importa getStorage si vas a usar Firebase Storage

// Tu configuración de Firebase (obtenida de la consola de Firebase)
// Deberías almacenar estos valores en variables de entorno (e.g., .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
// const auth = getAuth(app); // Descomenta si usas Firebase Authentication
// const storage = getStorage(app); // Descomenta si usas Firebase Storage

export { db /*, auth, storage */ }; // Exporta lo que necesites
