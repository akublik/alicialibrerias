// src/app/(app)/order-confirmation/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, CheckCircle, ArrowRight, BookHeart, ShoppingBag, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Order, OrderItem } from '@/types';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !db) {
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() } as Order);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);
  
  const hasDigitalItems = order?.items.some(item => item.format === 'Digital');
  const isDigitalOnlyOrder = order?.shippingMethod === 'digital';

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center flex flex-col justify-center items-center min-h-[60vh]">
        <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-lg text-muted-foreground">Cargando confirmación...</p>
      </div>
    );
  }
  
  if (!order) {
    return (
       <div className="container mx-auto px-4 py-8 text-center flex flex-col justify-center items-center min-h-[60vh]">
          <h1 className="font-headline text-3xl font-bold text-destructive">Pedido no encontrado</h1>
          <p className="mt-2 text-muted-foreground">No pudimos encontrar los detalles de este pedido.</p>
           <Link href="/dashboard" className="mt-6">
                <Button>Volver a mi panel</Button>
            </Link>
       </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary">¡Gracias por tu compra!</CardTitle>
          <CardDescription className="text-lg text-foreground/80 pt-2">
            Hemos recibido tu pedido y lo estamos procesando.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md text-sm">
                <p><strong>Número de Pedido:</strong> #{order.id.slice(0, 7)}</p>
                <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p><strong>Total:</strong> ${order.totalPrice.toFixed(2)}</p>
            </div>
            {isDigitalOnlyOrder && (
                <div className="bg-primary/10 p-4 rounded-md text-center">
                    <Clock className="mx-auto h-8 w-8 text-primary mb-2"/>
                    <h3 className="font-semibold text-primary">¡Tus libros digitales casi están listos!</h3>
                    <p className="text-sm text-foreground/80 mt-1">
                        El enlace de descarga para tus libros digitales estará disponible en tu panel (sección "Mis Libros Digitales") una vez que la librería confirme el pago y el pedido sea marcado como "Entregado".
                    </p>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full">
              Ir a mi Panel <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
           <Link href="/" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full">
              <ShoppingBag className="mr-2 h-5 w-5"/> Seguir Comprando
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
