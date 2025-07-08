"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isReaderPage = pathname.startsWith('/reader/');

  return (
    <html lang="es">
      <head>
        <title>Alicia Libros - Tu marketplace de librerías</title>
        <meta name="description" content="Descubre libros únicos y apoya a librerías en Latinoamérica." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <WishlistProvider>
          <CartProvider>
            {isReaderPage ? (
              <>{children}</> // Render only the page content for the reader
            ) : (
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-grow">{children}</main>
                <Footer />
              </div>
            )}
            <Toaster />
          </CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
