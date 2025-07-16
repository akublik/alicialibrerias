// src/app/api/contact/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
      createdAt: serverTimestamp(),
    };

    // Corrected to write to the 'notifications' collection as defined in firestore.rules
    await addDoc(collection(db, 'notifications'), notificationData);

    return NextResponse.json({ success: true, message: 'Mensaje enviado con éxito.' });

  } catch (error: any) {
    console.error('Contact Form API Error:', error);
    let errorMessage = 'No se pudo enviar el mensaje.';
    
    if (error.code === 'permission-denied') {
        errorMessage = "Error de permisos de Firestore. Revisa las reglas de seguridad de tu proyecto.";
    }

    return new NextResponse(JSON.stringify({ error: errorMessage, details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
