// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
  const warningMessage = `
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    !!! ATENCIÓN: CONFIGURACIÓN DE FIREBASE INCOMPLETA !!!
    
    Faltan las siguientes variables de entorno: ${missingConfigKeys.join(', ')}
    
    Asegúrate de que tu archivo .env.local o la configuración de entorno de Firebase Studio
    contengan estas claves con los valores de tu proyecto de Firebase.
    
    La aplicación no podrá conectarse a Firebase hasta que esto se corrija.
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  `;
  // Using console.warn to avoid the Next.js error overlay while still providing a clear warning.
  console.warn(warningMessage);
}


// Inicializar Firebase
let app;
if (!getApps().length) {
  // Solo intenta inicializar si la configuración está completa
  if (missingConfigKeys.length === 0) {
    try {
        app = initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Error al inicializar Firebase. Revisa tu 'firebaseConfig'.", e);
        app = null;
    }
  } else {
    app = null; // No inicializar si falta configuración
  }
} else {
  app = getApp();
}

// Solo exportar los servicios si la aplicación se inicializó correctamente
const db = app ? getFirestore(app) : null;
const storage = app ? getStorage(app) : null;

if (!db) {
    console.warn("ADVERTENCIA: No se pudo inicializar Firestore. Revisa los mensajes de configuración de Firebase en la consola.");
}
if (!storage) {
    console.warn("ADVERTENCIA: No se pudo inicializar Firebase Storage. Revisa los mensajes de configuración de Firebase en la consola.");
}


export { db, storage };
