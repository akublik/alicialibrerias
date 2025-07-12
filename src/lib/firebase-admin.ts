// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Esta función inicializa la app de admin BAJO DEMANDA.
// Esto evita que se ejecute durante el `next build`, que es donde falla.
function initializeAdminApp() {
  if (getApps().length > 0) {
    return admin.app();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida.');
  }

  const serviceAccount = JSON.parse(serviceAccountKey);

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

// Ahora, cuando llamemos a `admin`, nos aseguraremos de que la app esté inicializada.
const adminApp = initializeAdminApp();
const adminStorage = getStorage(adminApp);

export { adminApp, adminStorage };
