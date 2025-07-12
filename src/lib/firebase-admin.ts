// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida. Sigue la guía de configuración del backend de Firebase.');
}

const serviceAccount = JSON.parse(serviceAccountKey);

// Inicializar Firebase Admin SDK solo si no se ha hecho antes
if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const adminStorage = getStorage();
const bucket = adminStorage.bucket();

export { admin, bucket };
