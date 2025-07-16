// src/app/api/contact/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server'; // Use server-side admin SDK
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return new NextResponse(JSON.stringify({ error: 'Todos los campos son requeridos.' }), { status: 400 });
    }

    const notificationData = {
      type: 'contact_form' as const,
      fromName: name,
      fromEmail: email,
      subject,
      message,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    await db.collection('notifications').add(notificationData);

    return NextResponse.json({ success: true, message: 'Mensaje enviado con éxito.' });

  } catch (error: any) {
    console.error('Contact Form API Error:', error);
    return new NextResponse(JSON.stringify({ error: 'No se pudo enviar el mensaje.', details: error.message }), { status: 500 });
  }
}
