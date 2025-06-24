// src/app/(app)/search/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { BookCard } from '@/components/BookCard';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Book } from '@/types';
import { Loader2, SearchX } from 'lucide-react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!db) {
        setIsLoading(false);
        return;
      }
      try {
        const librariesSnapshot = await getDocs(collection(db, "libraries"));
        const librariesMap = new Map<string, { name: string, location: string }>();
        librariesSnapshot.forEach(doc => {
            const data = doc.data();
            librariesMap.set(doc.id, { name: data.name, location: data.location });
        });

        const booksSnapshot = await getDocs(collection(db, "books"));
        const booksData = booksSnapshot.docs.map(doc => {
            const book = { id: doc.id, ...doc.data() } as Book;
            if (book.libraryId && librariesMap.has(book.libraryId)) {
                const libInfo = librariesMap.get(book.libraryId)!;
                return { ...book, libraryName: libInfo.name, libraryLocation: libInfo.location };
            }
            return book;
        });
        setAllBooks(booksData);
      } catch (error) {
        console.error("Error fetching books for search:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    if (!query) return [];
    const lowercasedQuery = query.toLowerCase();
    return allBooks.filter(book =>
      (book.title?.toLowerCase().includes(lowercasedQuery)) ||
      (book.authors?.some(author => author.toLowerCase().includes(lowercasedQuery))) ||
      (book.isbn?.toLowerCase().includes(lowercasedQuery))
    );
  }, [allBooks, query]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
          Resultados de Búsqueda
        </h1>
        {query && (
          <p className="text-lg text-foreground/80 mt-2">
            Mostrando resultados para: <span className="font-semibold text-foreground">"{query}"</span>
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="text-center py-24">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Buscando libros...</p>
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredBooks.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-headline text-2xl font-semibold text-foreground">No se encontraron libros</h3>
          <p className="text-muted-foreground">Intenta con otros términos de búsqueda.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <SearchResults />
        </Suspense>
    )
}
