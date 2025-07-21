// src/app/api/proxy-epub/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get('path'); // We now expect a path, not a full URL

  if (!filePath) {
    return new NextResponse('Missing file path', { status: 400 });
  }

  try {
    const adminApp = initializeAdminApp();
    const storage = getStorage(adminApp);
    const bucket = storage.bucket();
    const file = bucket.file(decodeURIComponent(filePath));

    const [exists] = await file.exists();
    if (!exists) {
        return new NextResponse('File not found', { status: 404 });
    }

    const [fileBuffer] = await file.download();

    const headers = new Headers();
    headers.set('Content-Type', 'application/epub+zip');
    headers.set('Content-Length', String(fileBuffer.byteLength));

    return new NextResponse(fileBuffer, { status: 200, headers });

  } catch (error: any) {
    console.error('EPUB Proxy Error (Admin SDK):', error);
    let errorMessage = 'Failed to fetch EPUB file via proxy.';
     if (error.code === 403 || (error.errors && error.errors[0]?.reason === 'forbidden')) {
        errorMessage = "Permiso denegado por el servidor. La cuenta de servicio no tiene el rol 'Storage Object Admin' o 'Storage Object Viewer' en Google Cloud IAM.";
    } else if (error.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
        errorMessage = `Error de configuración del servidor: ${error.message}`;
    }
    return new NextResponse(errorMessage, { status: 500 });
  }
}
