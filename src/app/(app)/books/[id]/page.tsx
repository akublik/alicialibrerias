// src/app/(app)/books/[id]/page.tsx
"use client"; 
// Marking as client component to use hooks like useParams, though data fetching can be server-side initially.

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { placeholderBooks, placeholderReviews } from '@/lib/placeholders';
import type { Book, Review } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star, Tag, BookOpenCheck, Users, MessageSquare, ThumbsUp, ArrowLeft } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';

const StarRating = ({ rating, interactive = false, setRating }: { rating: number, interactive?: boolean, setRating?: (r:number) => void }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 transition-colors ${
            star <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
          } ${interactive ? "cursor-pointer hover:text-amber-300" : ""}`}
          onClick={() => interactive && setRating && setRating(star)}
        />
      ))}
    </div>
  );
};


export default function BookDetailsPage() {
  const params = useParams();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (bookId) {
      const foundBook = placeholderBooks.find(b => b.id === bookId);
      setBook(foundBook || null);
      if (foundBook) {
        const bookReviews = placeholderReviews.filter(r => r.bookId === bookId);
        setReviews(bookReviews);
        // Simple related books logic: books from same author or category (mocked)
        setRelatedBooks(placeholderBooks.filter(b => b.id !== bookId && (b.authors.some(a => foundBook.authors.includes(a)) || b.categories?.some(c => foundBook.categories?.includes(c)))).slice(0,3)
        .map(b => ({...b, id: b.id + '-related'}))
        );

        if(relatedBooks.length < 3) {
            setRelatedBooks(prev => [...prev, ...placeholderBooks.filter(b => b.id !== bookId && !prev.find(rb => rb.id === b.id + '-related')).slice(0, 3 - prev.length).map(b => ({...b, id: b.id + '-related'}))]);
        }
      }
    }
  }, [bookId]);


  if (!book) {
    return <div className="container mx-auto px-4 py-8 text-center">Cargando libro... o libro no encontrado.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <Link href="/" className="inline-flex items-center text-primary hover:underline mb-6 font-body">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
        <div className="md:col-span-1">
          <Card className="overflow-hidden shadow-xl">
            <Image
              src={book.imageUrl}
              alt={`Portada de ${book.title}`}
              width={600}
              height={900}
              className="w-full h-auto object-cover"
              priority
              data-ai-hint={book.dataAiHint || 'book detail'}
            />
          </Card>
        </div>

        <div className="md:col-span-2">
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-2">{book.title}</h1>
          <p className="text-lg text-foreground/80 mb-4">por <span className="font-semibold">{book.authors.join(', ')}</span></p>
          
          <div className="flex items-center space-x-2 mb-4">
            <StarRating rating={4.5} /> {/* Placeholder rating */}
            <span className="text-sm text-muted-foreground">(123 reseñas)</span>
          </div>

          <p className="text-2xl font-bold text-accent mb-6">${book.price.toFixed(2)}</p>

          <Button size="lg" className="w-full sm:w-auto font-body text-base mb-6 shadow-md hover:shadow-lg transition-shadow">
            <ShoppingCart className="mr-2 h-5 w-5" /> Agregar al Carrito
          </Button>

          {book.description && (
            <div className="mb-6">
              <h2 className="font-headline text-xl font-semibold text-foreground mb-2">Descripción</h2>
              <p className="text-foreground/80 whitespace-pre-line leading-relaxed">{book.description}</p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            {book.isbn && <p><span className="font-semibold text-foreground">ISBN:</span> <span className="text-muted-foreground">{book.isbn}</span></p>}
            {book.categories && book.categories.length > 0 && (
              <p className="flex items-start">
                <BookOpenCheck className="mr-2 h-4 w-4 mt-0.5 text-foreground flex-shrink-0" />
                <span className="font-semibold text-foreground mr-1">Categorías:</span> 
                <span className="text-muted-foreground">{book.categories.join(', ')}</span>
              </p>
            )}
            {book.tags && book.tags.length > 0 && (
               <p className="flex items-start">
                <Tag className="mr-2 h-4 w-4 mt-0.5 text-foreground flex-shrink-0" />
                <span className="font-semibold text-foreground mr-1">Etiquetas:</span> 
                <span className="text-muted-foreground">
                  {book.tags.map(tag => (
                    <span key={tag} className="inline-block bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs mr-1 mb-1">{tag}</span>
                  ))}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-6 bg-muted/50 p-1 h-auto">
          <TabsTrigger value="reviews" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
            <MessageSquare className="mr-2 h-5 w-5" /> Reseñas ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="related" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
            <Users className="mr-2 h-5 w-5" /> Libros Relacionados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl">Opiniones de Lectores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start space-x-3 mb-2">
                    {review.avatarUrl && <Image src={review.avatarUrl} alt={review.userName} width={40} height={40} className="rounded-full" data-ai-hint={review.dataAiHint} />}
                    <div>
                      <p className="font-semibold text-foreground">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(review.date), "PPP", { locale: es })}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="text-foreground/90 mt-2 whitespace-pre-wrap">{review.comment}</p>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary mt-2 -ml-2">
                    <ThumbsUp className="mr-2 h-4 w-4" /> Útil (12) {/* Placeholder count */}
                  </Button>
                </div>
              )) : (
                <p className="text-muted-foreground">Aún no hay reseñas para este libro. ¡Sé el primero!</p>
              )}
              {/* Add review form could be here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl">También te podría interesar</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {relatedBooks.map((relatedBook) => (
                    <BookCard key={relatedBook.id} book={relatedBook} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No encontramos libros relacionados en este momento.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
