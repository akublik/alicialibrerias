// src/app/api/upload-image/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { admin } from '@/lib/firebase-admin'; // Usar la configuración de admin
import { v4 as uuidv4 } from 'uuid';
import { getStorage } from 'firebase-admin/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file) {
      return new NextResponse(JSON.stringify({ error: 'No file provided.' }), { status: 400 });
    }
    if (!path) {
      return new NextResponse(JSON.stringify({ error: 'No path provided.' }), { status: 400 });
    }
    
    const bucket = getStorage(admin.app()).bucket();

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
