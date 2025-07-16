// src/lib/firebase/server.ts
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// Esta función inicializa la app de admin BAJO DEMANDA.
// Se ejecuta solo cuando la API es llamada, no durante la compilación.
function initializeAdminApp() {
  if (getApps().length > 0) {
    return admin.app();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error("Error al parsear FIREBASE_SERVICE_ACCOUNT_KEY:", error.message);
    throw new Error("El formato de FIREBASE_SERVICE_ACCOUNT_KEY es inválido.");
  }
}

// Inicializa la app una vez y expone los servicios
const adminApp = initializeAdminApp();
const db = admin.firestore();
const storage = admin.storage();
const auth = admin.auth();

export { db, storage, auth };
