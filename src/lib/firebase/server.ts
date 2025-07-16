// src/lib/firebase/server.ts
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

let adminApp: admin.app.App;

// Esta función inicializa la app de admin BAJO DEMANDA y de forma segura (singleton).
function initializeAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
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
    throw new Error("El formato de FIREBASE_SERVICE_ACCOUNT_KEY es inválido. Asegúrate de que sea un string JSON válido sin saltos de línea.");
  }
}

try {
  adminApp = initializeAdminApp();
} catch (error: any) {
    console.error("Fallo crítico en la inicialización de Firebase Admin:", error.message);
    // En un escenario real, aquí se podría notificar a un servicio de monitoreo.
    // Para evitar que la app crashee por completo si se usa este módulo en un contexto no-API,
    // se puede manejar de forma más controlada, pero para las API routes, el error debe propagarse.
    throw error;
}

const db = admin.firestore();
const storage = admin.storage();
const auth = admin.auth();

export { db, storage, auth };
