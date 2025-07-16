// src/app/api/contact/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { FieldValue } from 'firebase-admin/firestore';

// Esta función inicializa la app de admin BAJO DEMANDA y de forma segura (singleton).
// Se ejecuta solo cuando la API es llamada, no durante la compilación.
function initializeAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKeyBase64) {
    throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida.');
  }

  try {
    // Decodificar la clave Base64 a una cadena JSON
    const serviceAccountJson = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error: any) {
    console.error("Error al procesar FIREBASE_SERVICE_ACCOUNT_KEY:", error.message);
    throw new Error("El formato de FIREBASE_SERVICE_ACCOUNT_KEY es inválido o no es un Base64 correcto.");
  }
}


export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Todos los campos son requeridos.' }, { status: 400 });
    }
    
    const adminApp = initializeAdminApp();
    const db = admin.firestore();

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
    console.error('API Contact (Admin SDK) Error:', error);
    let errorMessage = 'No se pudo enviar el mensaje debido a un error del servidor.';
    
    if (error.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
      errorMessage = "Error de configuración del servidor. La clave de la cuenta de servicio no se pudo procesar.";
    } else if (error.code === 'permission-denied' || error.code === 7) {
        errorMessage = "Permiso denegado por el servidor. Verifique los permisos de la cuenta de servicio en IAM.";
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}
