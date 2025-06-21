// src/app/(app)/pre-checkout/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

export default function PreCheckoutPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated) {
      setAuthStatus('authenticated');
      router.replace('/checkout');
    } else {
      setAuthStatus('unauthenticated');
    }
  }, [router]);

  if (authStatus === 'loading' || authStatus === 'authenticated') {
    return (
      <div className="container mx-auto px-4 py-8 text-center flex flex-col justify-center items-center min-h-[60vh]">
        <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-lg text-muted-foreground">
          {authStatus === 'loading' ? 'Verificando tu sesión...' : 'Redirigiendo al pago...'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary">Estás a un paso</CardTitle>
          <CardDescription className="text-lg text-foreground/80 pt-2">
            Para continuar, por favor, inicia sesión o crea una cuenta. Esto nos permite guardar tu historial de compras y darte un mejor servicio.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          <Link href="/login?redirect=/checkout" className="w-full">
            <Button size="lg" className="w-full font-body text-base h-auto py-4 flex flex-col items-start text-left">
              <div className='flex items-center'>
                <LogIn className="mr-3 h-6 w-6" />
                <span className='text-lg'>Iniciar Sesión</span>
              </div>
              <span className='font-normal text-sm text-primary-foreground/80 pt-1 whitespace-normal'>Ya tengo una cuenta en Alicia Libros.</span>
            </Button>
          </Link>
          <Link href="/register?redirect=/checkout" className="w-full">
            <Button size="lg" variant="outline" className="w-full font-body text-base h-auto py-4 flex flex-col items-start text-left">
               <div className='flex items-center'>
                <UserPlus className="mr-3 h-6 w-6" />
                <span className='text-lg'>Crear Cuenta</span>
              </div>
              <span className='font-normal text-sm text-foreground/80 pt-1 whitespace-normal'>Soy nuevo/a y quiero registrarme.</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
      <div className="text-center mt-8">
        <Link href="/cart">
          <Button variant="link" className="text-muted-foreground">
            Volver al carrito
          </Button>
        </Link>
      </div>
    </div>
  );
}