
// src/app/(app)/books/[id]/page.tsx
"use client"; 

import { useParams } from 'next/navigation';
import Image from 'next/image';
import type { Book, Review, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star, Tag, BookOpenCheck, Users, MessageSquare, ThumbsUp, ArrowLeft, Loader2, Building2, FileText, BookCopy, Store, Facebook, Twitter, Send } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, query, where, addDoc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';

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
  const { toast } = useToast();
  
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
      const authStatus = localStorage.getItem("isAuthenticated") === "true";
      setIsAuthenticated(authStatus);
      if (authStatus) {
        const userDataString = localStorage.getItem("aliciaLibros_user");
        if(userDataString) setUser(JSON.parse(userDataString));
      }
    }
  }, []);

  useEffect(() => {
    if (!bookId || !db) return;

    // Listener for real-time review updates
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("bookId", "==", bookId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedReviews = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as Review));
        
        // Sort reviews by date on the client side to avoid needing a composite index
        fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setReviews(fetchedReviews);
    });

    return () => unsubscribe();
  }, [bookId]);

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

  const handleReviewSubmit = async () => {
      if (!isAuthenticated || !user) {
          toast({ title: "Debes iniciar sesión", description: "Solo los usuarios registrados pueden dejar reseñas.", variant: "destructive" });
          return;
      }
      if (newReviewRating === 0) {
          toast({ title: "Falta la calificación", description: "Por favor, selecciona de 1 a 5 estrellas.", variant: "destructive" });
          return;
      }
      if (!newReviewText.trim()) {
          toast({ title: "Falta el comentario", description: "Por favor, escribe tu opinión sobre el libro.", variant: "destructive" });
          return;
      }
      if (!db || !book) return;

      // Re-fetch user data from localStorage to ensure it's the latest version
      const userDataString = localStorage.getItem("aliciaLibros_user");
      if (!userDataString) {
          toast({ title: "Error de Sesión", description: "No se encontró tu información de usuario. Por favor, inicia sesión de nuevo.", variant: "destructive" });
          return;
      }
      const liveUser: User = JSON.parse(userDataString);

      setIsSubmittingReview(true);
      try {
          await addDoc(collection(db, "reviews"), {
              bookId,
              bookTitle: book.title,
              userId: liveUser.id,
              userName: liveUser.name,
              avatarUrl: liveUser.avatarUrl || `https://placehold.co/100x100.png?text=${liveUser.name.charAt(0)}`,
              dataAiHint: liveUser.dataAiHint || 'user avatar',
              rating: newReviewRating,
              comment: newReviewText,
              createdAt: serverTimestamp()
          });
          toast({ title: "¡Reseña Publicada!", description: "Gracias por compartir tu opinión." });
          setNewReviewText("");
          setNewReviewRating(0);
      } catch (error: any) {
          toast({ title: "Error al publicar", description: error.message, variant: "destructive" });
      } finally {
          setIsSubmittingReview(false);
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
  
  const shareText = encodeURIComponent(`¡Mira este libro que encontré en Alicia Libros: ${book?.title}!`);
  const encodedUrl = encodeURIComponent(currentUrl);


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
            <StarRating rating={averageRating} />
            <span className="text-sm text-muted-foreground">({reviews.length} reseñas)</span>
          </div>

          <p className="text-2xl font-bold text-accent mb-6">${book.price.toFixed(2)}</p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Button size="lg" className="w-full sm:w-auto font-body text-base shadow-md hover:shadow-lg transition-shadow" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" /> Agregar al Carrito
            </Button>
            
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground sr-only sm:not-sr-only">Compartir</h3>
                <div className="flex space-x-2">
                    <Button asChild variant="outline" size="icon" aria-label="Compartir en Facebook">
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-5 w-5" />
                        </a>
                    </Button>
                    <Button asChild variant="outline" size="icon" aria-label="Compartir en X">
                        <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-5 w-5" />
                        </a>
                    </Button>
                    <Button asChild variant="outline" size="icon" aria-label="Compartir en WhatsApp">
                        <a href={`https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer">
                            <MessageSquare className="h-5 w-5" />
                        </a>
                    </Button>
                </div>
            </div>
          </div>

          {book.description && (
            <div className="mt-8 mb-6">
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
          <div className="space-y-8">
            {isAuthenticated ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Escribe tu Reseña</CardTitle>
                        <CardDescription>Comparte tu opinión sobre este libro con la comunidad.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="font-medium text-sm mb-2 block">Tu Calificación</label>
                            <StarRating rating={newReviewRating} setRating={setNewReviewRating} interactive={true} />
                        </div>
                        <Textarea 
                            value={newReviewText}
                            onChange={(e) => setNewReviewText(e.target.value)}
                            placeholder="¿Qué te pareció el libro?"
                            rows={4}
                        />
                        <Button onClick={handleReviewSubmit} disabled={isSubmittingReview}>
                            {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                            Publicar Reseña
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="text-center">
                    <CardContent className="p-6">
                        <p className="text-muted-foreground">
                            <Link href={`/login?redirect=/books/${bookId}`} className="text-primary hover:underline font-semibold">Inicia sesión</Link> para dejar una reseña.
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start space-x-3 mb-2">
                    <Image 
                      src={review.avatarUrl || `https://placehold.co/100x100.png?text=${review.userName.charAt(0)}`} 
                      alt={review.userName} 
                      width={40} 
                      height={40} 
                      className="rounded-full" 
                      data-ai-hint={review.dataAiHint || 'user avatar'}
                    />
                    <div>
                      <p className="font-semibold text-foreground">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "PPP", { locale: es })}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="text-foreground/90 mt-2 whitespace-pre-wrap">{review.comment}</p>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary mt-2 -ml-2">
                    <ThumbsUp className="mr-2 h-4 w-4" /> Útil (12) {/* Placeholder count */}
                  </Button>
                </div>
              )) : (
                !isLoading && <p className="text-muted-foreground text-center py-4">Aún no hay reseñas para este libro. ¡Sé el primero!</p>
              )}
            </div>
          </div>
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
