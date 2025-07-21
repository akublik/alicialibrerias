// src/app/api/upload-digital-books/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import unzipper from 'unzipper';
import { PassThrough } from 'stream';

// Initialize Firebase Admin SDK
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
    throw new Error(`El formato de FIREBASE_SERVICE_ACCOUNT_KEY es inválido: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminApp = initializeAdminApp();
    const storage = getStorage(adminApp);
    const db = getFirestore(adminApp);
    const bucket = storage.bucket();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.type !== 'application/zip') {
      return NextResponse.json({ error: 'Se requiere un archivo .zip.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const passThrough = new PassThrough();
    passThrough.end(fileBuffer);
    
    const directory = await unzipper.Open.buffer(fileBuffer);
    
    let processedCount = 0;
    const errors: string[] = [];

    for (const entry of directory.files) {
      if (entry.type === 'File' && (entry.path.endsWith('.epub') || entry.path.endsWith('.pdf'))) {
        try {
          const filename = entry.path.split('/').pop()!;
          const nameParts = filename.split('.').slice(0, -1).join('.').split(' - ');
          
          if (nameParts.length < 2) {
            errors.push(`Nombre de archivo no válido, omitiendo: ${filename}`);
            continue;
          }

          const author = nameParts[0].trim();
          const title = nameParts.slice(1).join(' - ').trim();
          const fileExtension = entry.path.split('.').pop()!.toUpperCase();

          // Upload file to Storage
          const uniqueFilename = `epubs/${Date.now()}-${filename}`;
          const fileUpload = bucket.file(uniqueFilename);

          const writeStream = fileUpload.createWriteStream({
            metadata: {
              contentType: fileExtension === 'EPUB' ? 'application/epub+zip' : 'application/pdf',
            },
          });

          await new Promise((resolve, reject) => {
            entry.stream()
              .pipe(writeStream)
              .on('finish', resolve)
              .on('error', reject);
          });
          
          await fileUpload.makePublic();
          const downloadURL = fileUpload.publicUrl();

          // Create Firestore document
          const newBook = {
            title,
            author,
            coverImageUrl: `https://placehold.co/300x450.png?text=${encodeURIComponent(title)}`,
            epubFileUrl: downloadURL,
            format: fileExtension as 'EPUB' | 'PDF',
            description: `Un libro fascinante de ${author}.`,
            categories: [],
            tags: [],
            createdAt: FieldValue.serverTimestamp(),
          };

          await db.collection('digital_books').add(newBook);
          processedCount++;

        } catch (uploadError: any) {
          errors.push(`Error procesando ${entry.path}: ${uploadError.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalFiles: directory.files.length,
      processedCount,
      errors
    });

  } catch (error: any) {
    console.error('API Bulk Upload Error:', error);
    return NextResponse.json({ error: `Error en el servidor: ${error.message}` }, { status: 500 });
  }
}
