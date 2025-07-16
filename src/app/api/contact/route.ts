// src/app/api/contact/route.ts
import { NextResponse, type NextRequest } from 'next/server';
// Usaremos la instancia de admin para escribir en la base de datos
import { db } from '@/lib/firebase/server'; 
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
    
    // Usamos el SDK de Admin para escribir en la colección 'notifications'
    // Esto utiliza los permisos del servidor (definidos en FIREBASE_SERVICE_ACCOUNT_KEY)
    // y no depende de las reglas de seguridad del cliente.
    await db.collection('notifications').add(notificationData);

    return NextResponse.json({ success: true, message: 'Mensaje enviado con éxito.' });

  } catch (error: any) {
    console.error('API Contact (Admin SDK) Error:', error);
    let errorMessage = 'No se pudo enviar el mensaje debido a un error del servidor.';
    
    // Proporcionar un mensaje más específico si el error es de configuración
    if (error.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
      errorMessage = "Error de configuración del servidor. Por favor, contacte al administrador.";
    } else if (error.code === 'permission-denied' || error.code === 7) {
        errorMessage = "Permiso denegado por el servidor. Verifique los permisos de la cuenta de servicio en IAM.";
    }

    return new NextResponse(JSON.stringify({ error: errorMessage, details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}