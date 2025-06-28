// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DigitalBook } from '@/types';
import { Loader2, AlertTriangle, ArrowLeft, X, BookOpen } from 'lucide-react';
import { ReactReader } from "react-reader";
import type { Rendition } from 'epubjs';
import { Button } from '@/components/ui/button';
import { ConverseWithBookTrigger } from '@/components/ConverseWithBookTrigger';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<DigitalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [location, setLocation] = useState<string | number>(0);
  const renditionRef = useRef<Rendition | null>(null);
  const [toc, setToc] = useState<any[]>([]);
  const [isTocVisible, setIsTocVisible] = useState(false);

  useEffect(() => {
    if (!bookId || !db) {
      setError("Error de configuración de la aplicación.");
      setIsLoading(false);
      return;
    }

    const fetchBook = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const bookRef = doc(db, "digital_books", bookId);
        const docSnap = await getDoc(bookRef);
        if (docSnap.exists()) {
          const bookData = { id: docSnap.id, ...docSnap.data() } as DigitalBook;
          setBook(bookData);
          
          if (!bookData.epubFileUrl) {
            throw new Error("Este libro no tiene un archivo EPUB disponible para leer.");
          }

        } else {
          throw new Error("Libro no encontrado en la biblioteca digital.");
        }
      } catch (e: any) {
        console.error("Error al cargar el libro:", e);
        setError(`Error al cargar el libro: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  const onTocLocationChanges = (href: string) => {
    if (renditionRef.current) {
        renditionRef.current.display(href);
        setIsTocVisible(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-muted">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando libro...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-muted">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Ocurrió un error</h1>
        <p className="text-muted-foreground max-w-lg whitespace-pre-wrap">{error}</p>
        <Button onClick={() => router.push('/my-library')} className="mt-6">
          Volver a la Biblioteca
        </Button>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="flex flex-col h-screen w-screen bg-muted overflow-hidden">
        <header className="flex-shrink-0 bg-background shadow-md z-30">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/my-library" passHref>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a la Biblioteca
                    </Button>
                </Link>
                <div className="text-center hidden sm:block mx-4 overflow-hidden">
                    <h1 className="font-headline text-xl font-bold text-primary truncate">{book.title}</h1>
                    <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                </div>
                <Button variant="outline" onClick={() => setIsTocVisible(!isTocVisible)}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Índice
                </Button>
            </div>
        </header>
        
        <div className="flex-grow flex relative">
            <aside className={cn(
                "absolute sm:relative top-0 left-0 h-full bg-background z-20 transition-transform duration-300 ease-in-out w-72 border-r shadow-lg",
                isTocVisible ? "translate-x-0" : "-translate-x-full"
            )}>
                 <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-headline text-lg text-primary">Índice</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsTocVisible(false)}>
                        <X className="h-5 w-5"/>
                    </Button>
                 </div>
                 <ScrollArea className="h-[calc(100%-4.5rem)]">
                    <ul className="p-2">
                    {toc.map((item, index) => (
                        <li key={index}>
                            <button
                                onClick={() => onTocLocationChanges(item.href)}
                                className="block w-full text-left p-2 rounded-md hover:bg-muted text-sm text-foreground/80"
                            >
                                {item.label.trim()}
                            </button>
                        </li>
                    ))}
                    </ul>
                 </ScrollArea>
            </aside>

            <div className="flex-grow h-full relative" id="reader-wrapper">
                {book.epubFileUrl ? (
                    <ReactReader
                        key={book.id}
                        url={`/api/proxy-epub?url=${encodeURIComponent(book.epubFileUrl)}`}
                        location={location}
                        locationChanged={(epubcfi: string) => setLocation(epubcfi)}
                        getRendition={(rendition) => {
                            renditionRef.current = rendition;
                            rendition.book.loaded.navigation.then(({ toc: bookToc }) => {
                                setToc(bookToc);
                            });
                        }}
                        loadingView={
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            </div>
                        }
                        tocComponent={() => <div />}
                        showToc={false}
                    />
                ) : (
                   <div className="flex justify-center items-center h-full">
                       <Loader2 className="h-10 w-10 animate-spin text-primary" />
                   </div>
                )}
            </div>
        </div>
        
        <ConverseWithBookTrigger bookTitle={book.title} />

        <div 
            className="fixed left-0 top-16 h-[calc(100%-4rem)] w-1/4 z-10 cursor-pointer group"
            onClick={() => renditionRef.current?.prev()}
        >
            <ArrowLeft className="fixed left-4 top-1/2 -translate-y-1/2 h-16 w-16 text-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
        </div>
        <div 
            className="fixed right-0 top-16 h-[calc(100%-4rem)] w-1/4 z-10 cursor-pointer group"
            onClick={() => renditionRef.current?.next()}
        >
            <ArrowLeft className="fixed right-4 top-1/2 -translate-y-1/2 h-16 w-16 text-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform rotate-180"/>
        </div>
    </div>
  );
}
