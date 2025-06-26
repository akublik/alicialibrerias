// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DigitalBook } from '@/types';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { ReactReader } from "react-reader";
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    if (isLoading) return;

    const observer = new MutationObserver((mutations) => {
      const tocButton = readerContainerRef.current?.querySelector('button[aria-label="Table of Contents"]');
      if (tocButton && tocButton.textContent !== 'ÍNDICE') {
        tocButton.textContent = 'ÍNDICE';
        Object.assign(tocButton.style, {
            fontFamily: "'Belleza', sans-serif",
            fontSize: '1rem',
            padding: '0.25rem 0.75rem',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--primary))',
            border: '1px solid hsl(var(--primary))',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            zIndex: '2',
            textTransform: 'uppercase',
            top: '1rem',
            left: '1rem',
        });
      }
      
      const prevArrow = readerContainerRef.current?.querySelector('#prev');
      if (prevArrow) (prevArrow as HTMLElement).style.display = 'none';

      const nextArrow = readerContainerRef.current?.querySelector('#next');
      if (nextArrow) (nextArrow as HTMLElement).style.display = 'none';
    });

    if (readerContainerRef.current) {
      observer.observe(readerContainerRef.current, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [isLoading]);

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
    <div className="flex flex-col h-screen w-screen bg-muted">
        <header className="flex-shrink-0 bg-background shadow-md z-20">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/my-library" passHref>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a la Biblioteca
                    </Button>
                </Link>
                <div className="text-center hidden sm:block">
                    <h1 className="font-headline text-xl font-bold text-primary truncate">{book.title}</h1>
                    <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                </div>
                <div className="w-48 hidden sm:block"></div> {/* Spacer to keep title centered */}
            </div>
        </header>
        
        <div className="flex-grow h-full w-full" ref={readerContainerRef}>
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
    </div>
  );
}
