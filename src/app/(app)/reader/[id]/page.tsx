// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DigitalBook } from '@/types';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { ReactReader, type IReactReaderProps } from "react-reader";
import { Button } from '@/components/ui/button';
import { ConverseWithBookTrigger } from '@/components/ConverseWithBookTrigger';

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<DigitalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [location, setLocation] = useState<string | number>(0);
  const readerContainerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<IReactReaderProps['rendition'] | null>(null);

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
            zIndex: '100', // Ensure it's on top of reader
            textTransform: 'uppercase',
            top: '1rem',
            left: '1rem',
        });
      }
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
                getRendition={(rendition) => {
                  renditionRef.current = rendition;
                }}
                loadingView={
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                }
                // Hide default arrows
                readerStyles={{
                  ...ReactReader.defaultStyles,
                  arrow: {
                    display: 'none',
                  },
                }}
            />
        </div>
        
        {/* Chat Trigger */}
        <ConverseWithBookTrigger bookTitle={book.title} />

        {/* Navigation Arrows */}
        <div 
            className="fixed left-0 top-0 h-full w-1/4 z-10 cursor-pointer group"
            onClick={() => renditionRef.current?.prev()}
        >
            <ArrowLeft className="fixed left-4 top-1/2 -translate-y-1/2 h-16 w-16 text-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
        </div>
        <div 
            className="fixed right-0 top-0 h-full w-1/4 z-10 cursor-pointer group"
            onClick={() => renditionRef.current?.next()}
        >
            <ArrowLeft className="fixed right-4 top-1/2 -translate-y-1/2 h-16 w-16 text-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform rotate-180"/>
        </div>
    </div>
  );
}
