// src/app/(app)/reader/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DigitalBook } from '@/types';
import { Loader2, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    // This effect runs after the component mounts and finds the reader's internal elements.
    const observer = new MutationObserver((mutations, obs) => {
      if (readerContainerRef.current) {
        // Find the library's default TOC button
        const tocButton = readerContainerRef.current.querySelector('button[aria-label="Table of Contents"]');
        if (tocButton) {
          // Found the button, now modify it as requested by the user.
          tocButton.innerHTML = 'ÍNDICE';
          tocButton.setAttribute('style', `
            font-family: 'Belleza', sans-serif;
            font-size: 1rem;
            padding: 0.25rem 0.75rem;
            background: white;
            color: #D2691E;
            border: 1px solid #D2691E;
            border-radius: 0.5rem;
            cursor: pointer;
            z-index: 2;
          `);
          
          // The user also requested to remove the default navigation arrows.
          const prevArrow = readerContainerRef.current.querySelector('#prev');
          if (prevArrow) (prevArrow as HTMLElement).style.display = 'none';

          const nextArrow = readerContainerRef.current.querySelector('#next');
          if (nextArrow) (nextArrow as HTMLElement).style.display = 'none';
          
          obs.disconnect(); // We're done, stop observing.
          return;
        }
      }
    });

    if (readerContainerRef.current) {
      observer.observe(readerContainerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, [isLoading]); // Rerun when book is loaded to ensure reader is in DOM

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
    // The reader needs a container with a defined height.
    <div className="h-screen w-screen" ref={readerContainerRef}>
      <ReactReader
        key={book.id}
        url={`/epubs/${book.epubFilename}`}
        location={location}
        locationChanged={(epubcfi: string) => setLocation(epubcfi)}
        // By not providing custom headers/arrows, we let the library use its defaults,
        // which we then modify with the useEffect hook above.
        loadingView={
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        }
      />
    </div>
  );
}
