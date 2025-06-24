// src/app/(app)/books/[id]/page.tsx
"use client"; 

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { placeholderReviews } from '@/lib/placeholders';
import type { Book, Review } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star, Tag, BookOpenCheck, Users, MessageSquare, ThumbsUp, ArrowLeft, Loader2, Building2, FileText, BookCopy, Store } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';

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
  const { addToCart } = useCart();
  
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!bookId || !db) return;

    const fetchBookData = async () => {
      setIsLoading(true);
      try {
        const bookRef = doc(db, "books", bookId);
        const bookSnap = await getDoc(bookRef);

        if (bookSnap.exists()) {
          let foundBook = { id: bookSnap.id, ...bookSnap.data() } as Book;

          let libraryName, libraryLocation;
          if (foundBook.libraryId) {
            const libraryRef = doc(db, "libraries", foundBook.libraryId);
            const librarySnap = await getDoc(libraryRef);
            if (librarySnap.exists()) {
              const libraryData = librarySnap.data();
              libraryName = libraryData.name;
              libraryLocation = libraryData.location;
              foundBook.libraryName = libraryName;
              foundBook.libraryLocation = libraryLocation;
            }
          }

          setBook(foundBook);

          // Mock reviews for now
          const bookReviews = placeholderReviews.filter(r => r.bookId === bookId || r.bookId === '1' || r.bookId === '2');
          setReviews(bookReviews);
          
          // Fetch related books from the same library or category
          if (foundBook.libraryId) {
             const booksRef = collection(db, "books");
             const q = query(
                booksRef, 
                where("libraryId", "==", foundBook.libraryId), 
                where("__name__", "!=", bookId), 
                limit(3)
            );
             const relatedSnaps = await getDocs(q);
             const fetchedRelatedBooks = relatedSnaps.docs.map(doc => ({
                 id: doc.id,
                 ...doc.data(),
                 libraryName,
                 libraryLocation,
             } as Book));
             setRelatedBooks(fetchedRelatedBooks);
          }
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching book:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookData();

  }, [bookId]);

  const handleAddToCart = () => {
    if (book) {
      addToCart(book);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center flex flex-col justify-center items-center min-h-[60vh]">
        <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-lg text-muted-foreground">Cargando libro...</p>
      </div>
    );
  }

  if (!book) {
    return <div className="container mx-auto px-4 py-8 text-center">Libro no encontrado.</div>;
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
          <p className="text-lg text-foreground/80 mb-2">por <span className="font-semibold">{book.authors.join(', ')}</span></p>

          {book.libraryName && (
            <Link href={`/libraries/${book.libraryId}`} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center mb-4">
              <Store className="mr-2 h-4 w-4" />
              Vendido por {book.libraryName}
            </Link>
          )}
          
          <div className="flex items-center space-x-2 mb-4">
            <StarRating rating={4.5} /> {/* Placeholder rating */}
            <span className="text-sm text-muted-foreground">(123 reseñas)</span>
          </div>

          <p className="text-2xl font-bold text-accent mb-6">${book.price.toFixed(2)}</p>

          <Button size="lg" className="w-full sm:w-auto font-body text-base mb-6 shadow-md hover:shadow-lg transition-shadow" onClick={handleAddToCart}>
            <ShoppingCart className="mr-2 h-5 w-5" /> Agregar al Carrito
          </Button>

          {book.description && (
            <div className="mb-6">
              <h2 className="font-headline text-xl font-semibold text-foreground mb-2">Descripción</h2>
              <p className="text-foreground/80 whitespace-pre-line leading-relaxed">{book.description}</p>
            </div>
          )}

          <Separator className="my-4" />
          <h3 className="font-headline text-xl font-semibold text-foreground mb-3">Ficha Técnica</h3>
          <div className="space-y-2 text-sm">
             {book.publisher && (
              <p className="flex items-center">
                <Building2 className="mr-2 h-4 w-4 text-foreground flex-shrink-0" />
                <span className="font-semibold text-foreground mr-1">Editorial:</span>
                <span className="text-muted-foreground">{book.publisher}</span>
              </p>
            )}
             {book.coverType && (
              <p className="flex items-center">
                <BookCopy className="mr-2 h-4 w-4 text-foreground flex-shrink-0" />
                <span className="font-semibold text-foreground mr-1">Tapa:</span>
                <span className="text-muted-foreground">{book.coverType}</span>
              </p>
            )}
            {book.pageCount && (
              <p className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-foreground flex-shrink-0" />
                <span className="font-semibold text-foreground mr-1">Páginas:</span>
                <span className="text-muted-foreground">{book.pageCount}</span>
              </p>
            )}
             {book.isbn && (
              <p className="flex items-center">
                <span className="font-mono text-xs mr-2 h-4 w-4 flex items-center justify-center text-foreground flex-shrink-0">#</span>
                <span className="font-semibold text-foreground mr-1">ISBN:</span>
                <span className="text-muted-foreground">{book.isbn}</span>
              </p>
            )}
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
            <CardContent className="pt-6 space-y-6">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start space-x-3 mb-2">
                    {review.avatarUrl && <Image src={review.avatarUrl} alt={review.userName} width={40} height={40} className="rounded-full" data-ai-hint={review.dataAiHint}/>}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related">
          <Card>
            <CardContent className="pt-6">
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
