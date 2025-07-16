// src/app/api/contact/route.ts
import { NextResponse, type NextRequest } from 'next/server';
// Importamos la configuración del cliente que SÍ está funcionando en el resto de la app
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
      createdAt: serverTimestamp(), // Usamos el serverTimestamp del SDK de cliente
    };

    // Usamos el db del cliente para añadir el documento.
    // Esto dependerá de tus reglas de seguridad de Firestore.
    // Para que funcione, asegúrate que las reglas permitan la escritura en la colección 'notifications'.
    await addDoc(collection(db, 'notifications'), notificationData);

    return NextResponse.json({ success: true, message: 'Mensaje enviado con éxito.' });

  } catch (error: any) {
    console.error('Contact Form API Error:', error);
    let errorMessage = 'No se pudo enviar el mensaje.';
    
    // Proporcionar un mensaje más útil si es un error de permisos de Firestore
    if (error.code === 'permission-denied') {
        errorMessage = "Error de permisos de Firestore. Asegúrate de que tus reglas de seguridad permitan la escritura en la colección 'notifications'.";
    }

    return new NextResponse(JSON.stringify({ error: errorMessage, details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
