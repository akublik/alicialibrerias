// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DigitalBook } from '@/types';
import { Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ReaderPage() {
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<DigitalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId || !db) {
      setIsLoading(false);
      setError("Error de configuración.");
      return;
    }

    const fetchBook = async () => {
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
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Ocurrió un error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Link href="/my-library" className="mt-6">
            <Button>Volver a mi biblioteca</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{book?.title}</h1>
      <p className="text-lg text-muted-foreground">{book?.author}</p>
      <div className="mt-8 border rounded-lg p-8 text-center space-y-4">
        <p className="text-xl">El lector de E-books se implementará aquí.</p>
        <div className="space-y-2">
            {book?.epubUrl && (
            <p className="text-muted-foreground">URL del EPUB: <a href={book.epubUrl} className="text-primary underline" target="_blank" rel="noopener noreferrer">{book.epubUrl}</a></p>
            )}
            {book?.pdfUrl && (
            <p className="text-muted-foreground">URL del PDF: <a href={book.pdfUrl} className="text-primary underline" target="_blank" rel="noopener noreferrer">{book.pdfUrl}</a></p>
            )}
        </div>
      </div>
    </div>
  );
}
