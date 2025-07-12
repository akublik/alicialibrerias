// src/app/api/upload-image/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

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

  const serviceAccount = JSON.parse(serviceAccountKey);

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
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
    
    // Generate a unique filename
    const filename = `${path}/${uuidv4()}-${file.name}`;
    const fileRef = bucket.file(filename);

    // Convert file to buffer to upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the file to Firebase Storage
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file public and get its URL
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
