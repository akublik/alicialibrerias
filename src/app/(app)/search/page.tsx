// src/app/(app)/search/page.tsx
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { BookCard } from '@/components/BookCard';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query } from 'firebase/firestore';
import type { Book } from '@/types';
import { Loader2, SearchX, Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get('q') || '';
  
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [searchTerm, setSearchTerm] = useState(queryParam);

  useEffect(() => {
    setSearchTerm(queryParam);
  }, [queryParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

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

        const booksQuery = query(collection(db, "books"));
        const booksSnapshot = await getDocs(booksQuery);

        const booksData = booksSnapshot.docs.map(doc => {
            const book = { id: doc.id, ...doc.data() } as Book;
            if (book.libraryId && librariesMap.has(book.libraryId)) {
                const libInfo = librariesMap.get(book.libraryId)!;
                return { ...book, libraryName: libInfo.name, libraryLocation: libInfo.location };
            }
            return book;
        });

        // Sort on the client side by creation date, newest first
        booksData.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return dateB - dateA;
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
    if (!queryParam) return allBooks;
    const lowercasedQuery = queryParam.toLowerCase();
    return allBooks.filter(book =>
      (book.title?.toLowerCase().includes(lowercasedQuery)) ||
      (book.authors?.some(author => author.toLowerCase().includes(lowercasedQuery))) ||
      (book.isbn?.toLowerCase().includes(lowercasedQuery))
    );
  }, [allBooks, queryParam]);

  const { currentBooks, totalPages } = useMemo(() => {
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentBooks = filteredBooks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
    return { currentBooks, totalPages };
  }, [filteredBooks, currentPage]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [queryParam]);

  useEffect(() => {
    const logSearch = async () => {
      if (!queryParam || isLoading || !db) return;

      const loggedKey = `search-logged-${queryParam.toLowerCase()}`;
      if (sessionStorage.getItem(loggedKey)) {
        return;
      }
      
      try {
          const searchLogData: {
              query: string;
              resultsCount: number;
              timestamp: any;
              userId?: string;
          } = {
              query: queryParam.toLowerCase(),
              resultsCount: filteredBooks.length,
              timestamp: serverTimestamp(),
          };
          
          const userDataString = localStorage.getItem("aliciaLibros_user");
          if (userDataString) {
              const user = JSON.parse(userDataString);
              if (user.id) {
                searchLogData.userId = user.id;
              }
          }

          await addDoc(collection(db, 'searchLogs'), searchLogData);
          sessionStorage.setItem(loggedKey, 'true');
      } catch (error) {
          console.error("Error logging search:", error);
      }
    };
    
    if (!isLoading) {
      logSearch();
    }
  }, [queryParam, filteredBooks, isLoading]);


  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-8 text-center">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
          {queryParam ? 'Resultados de Búsqueda' : 'Catálogo Completo'}
        </h1>
        {queryParam ? (
          <p className="text-lg text-foreground/80 mt-2">
            Mostrando {filteredBooks.length} resultados para: <span className="font-semibold text-foreground">"{queryParam}"</span>
          </p>
        ) : (
          <p className="text-lg text-foreground/80 mt-2">
            Explora los {allBooks.length} libros disponibles en nuestra red de librerías.
          </p>
        )}
      </header>

      <div className="mb-12">
        <form onSubmit={handleSearch} className="flex max-w-2xl mx-auto gap-2">
            <Input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca de nuevo por título, autor o ISBN..."
                className="h-12 text-lg flex-grow"
                aria-label="Campo de búsqueda"
            />
            <Button type="submit" size="lg" className="h-12 text-base">
                <Search className="h-5 w-5" />
            </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="text-center py-24">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Buscando libros...</p>
        </div>
      ) : currentBooks.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {currentBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination className="mt-12">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink href="#" isActive={currentPage === page} onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}>{page}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-24">
          <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-headline text-2xl font-semibold text-foreground">No se encontraron libros</h3>
          <p className="text-muted-foreground">
             {queryParam
              ? `No hay libros que coincidan con "${queryParam}". Intenta con otros términos.`
              : "Parece que no hay libros en el catálogo en este momento."
            }
          </p>
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
