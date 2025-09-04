// src/components/AuthorPageClient.tsx
"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Author, Book } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Loader2, ArrowLeft, BookOpen, User, Instagram, Facebook, Globe, Youtube, Clapperboard, XIcon, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookCard } from '@/components/BookCard';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 8v5a5 5 0 0 1-5 5H8.5a4.5 4.5 0 0 1 0-9H13v5a2 2 0 0 0 2 2h3"></path></svg>
);


interface AuthorPageClientProps {
  slug: string;
}

export default function AuthorPageClient({ slug }: AuthorPageClientProps) {
  const router = useRouter();

  const [author, setAuthor] = useState<Author | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }
      if (!db) {
        console.error("Firestore is not available");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const q = query(collection(db, "authors"), where("slug", "==", slug), limit(1));
        const authorSnapshot = await getDocs(q);

        if (!authorSnapshot.empty) {
          const authorData = { id: authorSnapshot.docs[0].id, ...authorSnapshot.docs[0].data() } as Author;
          setAuthor(authorData);

          // Fetch books by this author
          const booksRef = collection(db, "books");
          const booksQuery = query(booksRef, where("authors", "array-contains", authorData.name));
          const booksSnapshot = await getDocs(booksQuery);
          
          const librariesSnapshot = await getDocs(collection(db, "libraries"));
          const librariesMap = new Map<string, { name: string, location: string }>();
          librariesSnapshot.forEach(doc => {
              const data = doc.data();
              librariesMap.set(doc.id, { name: data.name, location: data.location });
          });
          
          const authorBooks = booksSnapshot.docs.map(bookDoc => {
            const bookData = bookDoc.data();
            const book: Book = { 
                id: bookDoc.id, 
                ...bookData,
                format: bookData.format || 'Físico',
            } as Book;
             if (book.libraryId && librariesMap.has(book.libraryId)) {
                const libInfo = librariesMap.get(book.libraryId)!;
                return { ...book, libraryName: libInfo.name, libraryLocation: libInfo.location };
            }
            return book;
          });

          setBooks(authorBooks);
        } else {
          router.push('/'); 
        }
      } catch (error) {
        console.error("Error fetching author details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthorData();
  }, [slug, router]);
  
  const { currentBooks, totalPages } = useMemo(() => {
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentBooks = books.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(books.length / ITEMS_PER_PAGE);
    return { currentBooks, totalPages };
  }, [books, currentPage]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center flex flex-col justify-center items-center min-h-[60vh]">
        <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-lg text-muted-foreground">Cargando perfil del autor...</p>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Autor no encontrado</h1>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <Link href="/" className="inline-flex items-center text-primary hover:underline mb-8 font-body">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        <div className="md:col-span-1">
          <Card className="shadow-lg sticky top-24">
            <CardHeader className="p-0">
               <div className="relative w-full aspect-square">
                    <Image
                        src={author.imageUrl}
                        alt={`Foto de ${author.name}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-t-lg"
                        data-ai-hint={author.dataAiHint || 'author portrait'}
                    />
               </div>
            </CardHeader>
            <CardContent className="p-6 text-center">
               <h1 className="font-headline text-3xl font-bold text-primary">{author.name}</h1>
            </CardContent>
             {(author.instagram || author.facebook || author.x || author.tiktok || author.youtube || author.website) && (
              <>
                <Separator />
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-center text-muted-foreground mb-3">Sigue al Autor</h3>
                  <div className="flex justify-center flex-wrap gap-2">
                    {author.website && <Button asChild variant="outline" size="icon"><a href={author.website} target="_blank" rel="noopener noreferrer"><Globe className="h-5 w-5" /></a></Button>}
                    {author.instagram && <Button asChild variant="outline" size="icon"><a href={author.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5" /></a></Button>}
                    {author.facebook && <Button asChild variant="outline" size="icon"><a href={author.facebook} target="_blank" rel="noopener noreferrer"><Facebook className="h-5 w-5" /></a></Button>}
                    {author.x && <Button asChild variant="outline" size="icon"><a href={author.x} target="_blank" rel="noopener noreferrer"><XIcon className="h-5 w-5" /></a></Button>}
                    {author.tiktok && <Button asChild variant="outline" size="icon"><a href={author.tiktok} target="_blank" rel="noopener noreferrer"><TikTokIcon className="h-5 w-5" /></a></Button>}
                    {author.youtube && <Button asChild variant="outline" size="icon"><a href={author.youtube} target="_blank" rel="noopener noreferrer"><Youtube className="h-5 w-5" /></a></Button>}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
        
        <div className="md:col-span-2 space-y-12">
           <Card>
                <CardHeader>
                   <CardTitle className="font-headline text-2xl flex items-center gap-3"><User className="h-6 w-6 text-primary" />Biografía</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground/80 whitespace-pre-line leading-relaxed">{author.bio}</p>
                </CardContent>
           </Card>

           <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-3"><BookOpen className="h-6 w-6 text-primary" />Libros de {author.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    {currentBooks.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentBooks.map(book => (
                                <BookCard key={book.id} book={book} />
                            ))}
                        </div>
                        {totalPages > 1 && (
                          <Pagination className="mt-8">
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
                        <p className="text-muted-foreground">No hay libros de este autor en nuestro catálogo por el momento.</p>
                    )}
                </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
