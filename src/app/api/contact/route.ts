// src/app/api/contact/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/server'; // Use server-side admin SDK
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return new NextResponse(JSON.stringify({ error: 'Todos los campos son requeridos.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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
    let errorMessage = 'No se pudo enviar el mensaje.';
    // Attempt to provide a more specific error message if available
    if (error.message && error.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
        errorMessage = "Error de configuración del servidor. Contacte al administrador.";
    }
    return new NextResponse(JSON.stringify({ error: errorMessage, details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
