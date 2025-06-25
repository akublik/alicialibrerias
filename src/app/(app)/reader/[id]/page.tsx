// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DigitalBook } from '@/types';
import { Loader2, AlertTriangle, ArrowLeft, ArrowRight, BookOpen, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Rendition } from 'epubjs';
import type Book from 'epubjs/types/book';

export default function ReaderPage() {
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<DigitalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookInstanceRef = useRef<Book | null>(null);

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

  useEffect(() => {
    if (!book || !book.epubUrl || !viewerRef.current) return;
    
    let isMounted = true;
    
    import('epubjs').then(({ default: ePub }) => {
        if (!isMounted || !viewerRef.current) return;

        if (viewerRef.current.innerHTML) {
            viewerRef.current.innerHTML = '';
        }

        const bookInstance = ePub(book.epubUrl);
        bookInstanceRef.current = bookInstance;

        const rendition = bookInstance.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "auto",
        });

        renditionRef.current = rendition;
        rendition.display();

    }).catch(err => {
        console.error("Failed to load epubjs", err);
        if(isMounted) {
            setError("No se pudo cargar el visor de libros.");
        }
    });

    return () => {
      isMounted = false;
      if (bookInstanceRef.current) {
        bookInstanceRef.current.destroy();
      }
    };
  }, [book]);

  const goNext = () => {
    renditionRef.current?.next();
  };

  const goPrev = () => {
    renditionRef.current?.prev();
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
        <p className="text-muted-foreground">{error}</p>
        <Link href="/my-library" className="mt-6">
          <Button>Volver a la Biblioteca</Button>
        </Link>
      </div>
    );
  }

  if (!book) return null; // Should not happen if not loading and no error

  if (!book.epubUrl) {
    return (
         <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-muted">
            <BookOpen className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-2xl font-bold text-primary mb-2">{book.title}</h1>
            <p className="text-muted-foreground mb-6">Este libro no está disponible en formato EPUB para el lector integrado.</p>
             {book.pdfUrl && (
                <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button>
                        <FileText className="mr-2 h-4 w-4" />
                        Abrir PDF
                    </Button>
                </a>
            )}
             <Link href="/my-library" className="mt-4">
                <Button variant="link">Volver a la Biblioteca</Button>
            </Link>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-muted font-body">
      <header className="flex-shrink-0 flex items-center justify-between p-3 border-b bg-background shadow-sm">
        <Link href="/my-library" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Biblioteca
          </Button>
        </Link>
        <div className="text-center truncate px-4">
            <h1 className="font-headline text-lg font-semibold text-primary truncate">{book.title}</h1>
            <p className="text-sm text-muted-foreground truncate">{book.author}</p>
        </div>
        <div className="w-28"></div> {/* Spacer */}
      </header>

      <main className="flex-grow relative">
         <div id="viewer" ref={viewerRef} className="w-full h-full" />
      </main>

       <footer className="flex-shrink-0 flex items-center justify-center p-3 border-t bg-background shadow-sm">
        <div className="flex items-center gap-4">
            <Button variant="outline" onClick={goPrev} aria-label="Página anterior">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm text-muted-foreground">Navegación</span>
            <Button variant="outline" onClick={goNext} aria-label="Página siguiente">
              <ArrowRight className="h-5 w-5" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
