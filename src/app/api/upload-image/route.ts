// src/app/api/upload-image/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

function initializeAdminApp() {
  if (getApps().length > 0) {
    return admin.app();
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
    console.error("Error al procesar FIREBASE_SERVICE_ACCOUNT_KEY para subida:", error.message);
    throw new Error("El formato de FIREBASE_SERVICE_ACCOUNT_KEY es inválido o no es un Base64 correcto.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminApp = initializeAdminApp();
    const bucket = getStorage(adminApp).bucket();
    
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file) {
      return new NextResponse(JSON.stringify({ error: 'No file provided.' }), { status: 400 });
    }
    if (!path) {
      return new NextResponse(JSON.stringify({ error: 'No path provided.' }), { status: 400 });
    }
    
    const filename = `${path}/${uuidv4()}-${file.name}`;
    const fileRef = bucket.file(filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    await fileRef.makePublic();
    const downloadURL = fileRef.publicUrl();

    return NextResponse.json({ downloadURL });

  } catch (error: any) {
    console.error('Upload Error:', error);
    let errorMessage = "Failed to upload file.";
    if (error.code === 403 || (error.response && error.response.status === 403)) {
      errorMessage = "Permission denied. Check the IAM permissions for your service account.";
    }
    return new NextResponse(JSON.stringify({ error: errorMessage, details: error.message }), { status: 500 });
  }
}
