// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DigitalBook } from '@/types';
import { Loader2, AlertTriangle, ArrowLeft, ArrowRight, List, X, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReactReader, type IReactReaderStyle } from "react-reader";
import type { Rendition } from 'epubjs';

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<DigitalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string | number>(0);
  const [showToc, setShowToc] = useState(false);
  
  const renditionRef = useRef<Rendition | null>(null);

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
  
  const handlePrevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const handleNextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  const readerStyles: IReactReaderStyle = {
    readerArea: {
      backgroundColor: '#F5F5DC', // beige background
      position: 'relative',
      height: '100%',
      width: '100%'
    },
    titleArea: {
      color: '#4B2A1A', // dark brown text
      textAlign: 'center',
      padding: '1rem',
      fontSize: '1.25rem'
    },
    tocArea: {
        background: '#FFFFFF',
        color: '#000000',
    },
    tocButton: {
        background: '#D2691E', // primary color
        color: 'white',
        border: 'none',
        borderRadius: '2px',
        padding: '10px 20px',
        cursor: 'pointer'
    },
    arrow: {
        color: '#8B4513' // accent color
    },
    // Adding other potentially required fields with default-like values
    container: {
      overflow: "hidden",
      height: "100%",
    },
    tocContainer: {
      padding: '1rem'
    },
    tocEntry: {
      color: '#000000'
    },
    loadingView: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
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
        <Link href="/my-library" className="mt-6">
          <Button>Volver a la Biblioteca</Button>
        </Link>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="relative h-screen flex flex-col font-body antialiased">
      <header className="flex items-center justify-between p-2 bg-card border-b z-20 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => router.push('/my-library')} title="Volver a la biblioteca">
           <Home className="h-5 w-5 mr-2" />
           <span className="hidden sm:inline">Mi Biblioteca</span>
        </Button>
        <div className="text-center truncate px-2">
            <h1 className="font-headline text-lg font-bold text-primary truncate">{book.title}</h1>
            <p className="text-sm text-muted-foreground truncate">por {book.author}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowToc(!showToc)}>
          {showToc ? <X className="h-5 w-5 mr-2" /> : <List className="h-5 w-5 mr-2" />}
          <span className="hidden sm:inline">Índice</span>
        </Button>
      </header>
      
      <div className="relative flex-grow h-full w-full">
         <Button
            variant="ghost"
            onClick={handlePrevPage}
            className="absolute left-0 top-0 bottom-0 z-10 w-1/4 h-full text-primary/50 hover:text-primary hover:bg-transparent opacity-0 hover:opacity-100 transition-opacity"
            aria-label="Página anterior"
          >
            <ArrowLeft className="h-12 w-12" />
          </Button>
        <ReactReader
            url={`/epubs/${book.epubFilename}`}
            location={location}
            locationChanged={(epubcfi: string) => setLocation(epubcfi)}
            getRendition={(rendition) => {
              renditionRef.current = rendition;
            }}
            showToc={showToc}
            readerStyles={readerStyles}
            loadingView={
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            }
        />
        <Button
          variant="ghost"
          onClick={handleNextPage}
          className="absolute right-0 top-0 bottom-0 z-10 w-1/4 h-full text-primary/50 hover:text-primary hover:bg-transparent opacity-0 hover:opacity-100 transition-opacity"
          aria-label="Página siguiente"
        >
          <ArrowRight className="h-12 w-12" />
        </Button>
      </div>
    </div>
  );
}
