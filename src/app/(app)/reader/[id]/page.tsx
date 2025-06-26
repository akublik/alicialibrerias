// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DigitalBook } from '@/types';
import { Loader2, AlertTriangle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ReactReader } from "react-reader";

export default function ReaderPage() {
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<DigitalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // location is the only state needed for the reader component itself
  const [location, setLocation] = useState<string | number>(0);

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
          setBook({ id: docSnap.id, ...docSnap.data() } as DigitalBook);
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
        <Link href="/my-library" className="mt-6">
          <Button>Volver a la Biblioteca</Button>
        </Link>
      </div>
    );
  }

  if (!book) return null;

  if (!book.epubFilename) {
    return (
         <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-muted">
            <BookOpen className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-2xl font-bold text-primary mb-2">{book.title}</h1>
            <p className="text-muted-foreground mb-6">Este libro no está disponible en formato EPUB para el lector integrado.</p>
             <Link href="/my-library" className="mt-4">
                <Button variant="link">Volver a la Biblioteca</Button>
            </Link>
        </div>
    )
  }

  return (
    // A simple, full-height container for the reader
    <div style={{ height: '100vh' }}>
      <ReactReader
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
  );
}
