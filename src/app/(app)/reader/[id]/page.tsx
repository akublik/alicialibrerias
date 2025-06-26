// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DigitalBook } from '@/types';
import { Loader2, AlertTriangle, Home, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReactReader } from "react-reader";

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<DigitalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [location, setLocation] = useState<string | number>(0);
  
  const readerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bookId || !db) {
      setIsLoading(false);
      setError("Error de configuración de la aplicación.");
      return;
    }

    const fetchBook = async () => {
      setIsLoading(true);
      try {
        const bookRef = doc(db, "digital_books", bookId);
        const docSnap = await getDoc(bookRef);
        if (docSnap.exists()) {
          const bookData = { id: docSnap.id, ...docSnap.data() } as DigitalBook;
          if (!bookData.epubFilename) {
            setError("Este libro no tiene un archivo EPUB disponible para leer.");
          } else {
            setBook(bookData);
          }
        } else {
          setError("Libro no encontrado en la biblioteca digital.");
        }
      } catch (e: any) {
        setError(`Error al cargar el libro: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  // This effect finds the reader's default TOC button and hides it.
  useEffect(() => {
    // We use a MutationObserver to wait for the reader's internal elements to be rendered.
    const observer = new MutationObserver((mutations, obs) => {
      if (readerContainerRef.current) {
        // The default TOC button in react-reader has a specific aria-label.
        const tocButton = readerContainerRef.current.querySelector('button[aria-label="Table of Contents"]');
        if (tocButton) {
          // Hide the default button
          (tocButton as HTMLElement).style.display = 'none';
          obs.disconnect(); // Stop observing once we've found and hidden the button.
          return;
        }
      }
    });

    if (readerContainerRef.current) {
      observer.observe(readerContainerRef.current, {
        childList: true,
        subtree: true
      });
    }

    return () => observer.disconnect();
  }, [isLoading]); // Re-run when loading state changes, i.e., after the book loads.

  // Function to programmatically click the hidden default TOC button
  const handleToggleToc = () => {
      if (readerContainerRef.current) {
          const tocButton = readerContainerRef.current.querySelector('button[aria-label="Table of Contents"]') as HTMLElement | null;
          tocButton?.click();
      }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-muted">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-muted">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Ocurrió un error</h1>
        <p className="text-muted-foreground max-w-lg whitespace-pre-wrap">{error}</p>
        <button onClick={() => router.push('/my-library')} className="mt-6 bg-primary text-white px-4 py-2 rounded">
          Volver a la Biblioteca
        </button>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="h-screen flex flex-col font-body antialiased bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-2 bg-card border-b shrink-0 z-30">
        <Button variant="ghost" size="sm" onClick={() => router.push('/my-library')} title="Volver a la biblioteca">
           <Home className="h-5 w-5 mr-2" />
           <span className="hidden sm:inline">Mi Biblioteca</span>
        </Button>
        <div className="text-center truncate px-2">
            <h1 className="font-headline text-lg font-bold text-primary truncate">{book.title}</h1>
            <p className="text-sm text-muted-foreground truncate">por {book.author}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleToggleToc}>
            <Menu className="mr-2 h-5 w-5"/>
            <span>Índice</span>
        </Button>
      </header>
      
      {/* Main Reader Area */}
      <main className="flex-1 relative">
        <div className="absolute top-0 left-0 right-0 bottom-0 h-full w-full z-10" ref={readerContainerRef}>
            <ReactReader
                key={book.id}
                url={`/epubs/${book.epubFilename}`}
                location={location}
                locationChanged={(epubcfi: string) => setLocation(epubcfi)}
                loadingView={
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                }
            />
        </div>
      </main>
    </div>
  );
}