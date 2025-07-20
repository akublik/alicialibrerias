// src/app/api/upload-image/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

// This function initializes the admin app ON-DEMAND and safely (singleton).
function initializeAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKeyBase64) {
    throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida.');
  }

  try {
    const serviceAccountJson = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error("Error al procesar FIREBASE_SERVICE_ACCOUNT_KEY:", error.message);
    throw new Error("El formato de FIREBASE_SERVICE_ACCOUNT_KEY es inválido o no es un Base64 correcto.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminApp = initializeAdminApp();
    const storage = getStorage(adminApp);
    const bucket = storage.bucket();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueFilename = `${path}/${uuidv4()}-${file.name}`;
    const fileUpload = bucket.file(uniqueFilename);

    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });
    
    // Make the file public and get its URL
    await fileUpload.makePublic();
    const downloadURL = fileUpload.publicUrl();
    
    return NextResponse.json({ success: true, downloadURL });

  } catch (error: any) {
    console.error('API Upload Error:', error);
    let errorMessage = 'No se pudo subir la imagen.';
    if (error.code === 403 || (error.errors && error.errors[0]?.reason === 'forbidden')) {
        errorMessage = "Permiso denegado por el servidor. La cuenta de servicio no tiene el rol 'Storage Object Admin' en Google Cloud IAM para este proyecto.";
    } else if (error.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
        errorMessage = `Error de configuración del servidor: ${error.message}`;
    }
    
    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}
