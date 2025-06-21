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

// Verificación de variables de entorno para diagnóstico
const missingConfigKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfigKeys.length > 0) {
  const errorMessage = `
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    !!! ERROR DE CONFIGURACIÓN DE FIREBASE !!!
    
    Faltan las siguientes variables de entorno: ${missingConfigKeys.join(', ')}
    
    Asegúrate de que tu archivo .env o la configuración de entorno de Firebase Studio
    contengan estas claves con los valores de tu proyecto de Firebase.
    
    El registro no funcionará hasta que esto se corrija.
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  `;
  console.error(errorMessage);
}


// Inicializar Firebase
let app;
if (!getApps().length) {
  // Solo intenta inicializar si la configuración está completa
  if (missingConfigKeys.length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = null; // No inicializar si falta configuración
  }
} else {
  app = getApp();
}

// Solo exportar 'db' si la aplicación se inicializó correctamente
// Esto evita errores en cascada en otras partes de la aplicación
const db = app ? getFirestore(app) : null;

if (!db) {
    console.error("ERROR: No se pudo inicializar Firestore. Revisa los errores de configuración de Firebase de más arriba.");
}


export { db /*, auth, storage */ }; // Exporta lo que necesites
