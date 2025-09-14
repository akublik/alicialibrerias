// src/app/api/transactions/grant-points/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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
    });
  } catch (error: any) {
    throw new Error(`El formato de FIREBASE_SERVICE_ACCOUNT_KEY es inválido: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminApp = initializeAdminApp();
    const db = getFirestore(adminApp);

    const { userId, purchaseAmount, apiKey } = await request.json();

    if (!userId || purchaseAmount === undefined || !apiKey) {
      return NextResponse.json({ error: 'Faltan parámetros: se requieren userId, purchaseAmount y apiKey.' }, { status: 400 });
    }
    
    if (typeof purchaseAmount !== 'number' || purchaseAmount < 0) {
        return NextResponse.json({ error: 'El parámetro purchaseAmount debe ser un número no negativo.' }, { status: 400 });
    }

    // 1. Validate API Key
    const librariesRef = db.collection('libraries');
    const q = librariesRef.where('apiKey', '==', apiKey).where('isActive', '==', true).limit(1);
    const librarySnapshot = await q.get();

    if (librarySnapshot.empty) {
      return NextResponse.json({ error: 'La clave de API (apiKey) no es válida o no corresponde a ninguna librería activa.' }, { status: 403 });
    }
    const libraryDoc = librarySnapshot.docs[0];
    const libraryId = libraryDoc.id;
    const libraryName = libraryDoc.data().name;

    // 2. Grant points
    const pointsToGrant = Math.floor(purchaseAmount); // 1 point per dollar
    if (pointsToGrant <= 0) {
       return NextResponse.json({ success: true, message: 'La compra no generó puntos.', pointsGranted: 0 });
    }

    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new Error(`El usuario con ID ${userId} no fue encontrado.`);
        }
        
        const currentPoints = userDoc.data()?.loyaltyPoints || 0;
        const newPoints = currentPoints + pointsToGrant;
        
        // Update user points
        transaction.update(userRef, { loyaltyPoints: newPoints });

        // Log the transaction
        const pointsTransactionRef = db.collection('pointsTransactions').doc();
        transaction.set(pointsTransactionRef, {
            userId: userId,
            libraryId: libraryId,
            description: `Compra en librería física: ${libraryName}`,
            points: pointsToGrant,
            createdAt: FieldValue.serverTimestamp()
        });
    });

    return NextResponse.json({ 
        success: true, 
        message: `Se han añadido ${pointsToGrant} puntos a la cuenta.`,
        pointsGranted: pointsToGrant
    });

  } catch (error: any) {
    console.error('API Grant Points Error:', error);
    let errorMessage = 'No se pudo procesar la transacción debido a un error del servidor.';
    if (error.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
      errorMessage = "Error de configuración del servidor.";
    } else if (error.code === 7 || error.code === 'permission-denied') {
        errorMessage = "Permiso denegado por el servidor.";
    } else {
        // Expose specific transaction errors to the client for better debugging
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
