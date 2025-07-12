// src/app/api/upload-image/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';

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

    // Generate a unique filename
    const filename = `${uuidv4()}-${file.name}`;
    const storageRef = ref(storage, `${path}/${filename}`);
    
    // Convert file to buffer to upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const snapshot = await uploadBytesResumable(storageRef, buffer, {
        contentType: file.type,
    });

    const downloadURL = await getDownloadURL(snapshot.ref);

    return NextResponse.json({ downloadURL });

  } catch (error: any) {
    console.error('Upload Error:', error);
    let errorMessage = "Failed to upload file.";
    if (error.code === 'storage/unauthorized') {
        errorMessage = "Permission denied. Check your Firebase Storage security rules."
    }
    return new NextResponse(JSON.stringify({ error: errorMessage, details: error.message }), { status: 500 });
  }
}
