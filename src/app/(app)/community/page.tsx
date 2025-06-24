// src/app/(app)/community/page.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Review, User } from "@/types";
import Image from "next/image";
import { MessageSquare, Users, CalendarDays, Star, ThumbsUp, Send, PlusCircle, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

// Removed bookClubs and placeholderBooks from here

const StarRating = ({ rating, setRating, interactive = true }: { rating: number, setRating?: (r: number) => void, interactive?: boolean }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            star <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground hover:text-amber-300"
          }`}
          onClick={() => interactive && setRating && setRating(star)}
        />
      ))}
    </div>
  );
};

export default function CommunityPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [newReviewBookTitle, setNewReviewBookTitle] = useState("");
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("reviews");

  useEffect(() => {
      // Auth check
      const authStatus = localStorage.getItem("isAuthenticated") === "true";
      setIsAuthenticated(authStatus);
      if (authStatus) {
          const userDataString = localStorage.getItem("aliciaLibros_user");
          if(userDataString) setUser(JSON.parse(userDataString));
      }

      // Firestore listener
      if (!db) {
          setIsLoading(false);
          return;
      }
      const reviewsQuery = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(20));
      const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
          const fetchedReviews = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
          } as Review));
          setReviews(fetchedReviews);
          setIsLoading(false);
      }, (error) => {
          console.error("Error fetching reviews:", error);
          toast({ title: "Error al cargar reseñas", variant: "destructive" });
          setIsLoading(false);
      });

      return () => unsubscribe();
  }, [toast]);

  const handlePublishReview = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: "Debes iniciar sesión para publicar una reseña.", variant: "destructive" });
      return;
    }
    if (!newReviewBookTitle.trim()) {
        toast({ title: "Falta el título del libro.", description: "Por favor, escribe el título del libro que estás reseñando.", variant: "destructive" });
        return;
    }
    if (newReviewRating === 0) {
        toast({ title: "Falta la calificación.", description: "Por favor, selecciona de 1 a 5 estrellas.", variant: "destructive" });
        return;
    }
    if (!newReviewText.trim()) {
        toast({ title: "Falta el comentario.", description: "Por favor, escribe tu opinión sobre el libro.", variant: "destructive" });
        return;
    }

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
        bookTitle: newReviewBookTitle,
        userId: liveUser.id,
        userName: liveUser.name,
        avatarUrl: liveUser.avatarUrl || `https://placehold.co/100x100.png?text=${liveUser.name.charAt(0)}`,
        dataAiHint: liveUser.dataAiHint || 'user avatar',
        rating: newReviewRating,
        comment: newReviewText,
        createdAt: serverTimestamp()
      });
      toast({ title: "¡Reseña Publicada!", description: "Gracias por tu opinión." });
      setNewReviewBookTitle("");
      setNewReviewText("");
      setNewReviewRating(0);
    } catch (error: any) {
      toast({ title: "Error al publicar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingReview(false);
    }
  };
  
  // Dummy data for book clubs as it's not implemented yet
  const bookClubs = [
    { id: '1', name: 'Club de Realismo Mágico', description: 'Exploramos las obras maestras del realismo mágico latinoamericano.', members: 120, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'fantasy landscape' },
    { id: '2', name: 'Poesía Viva', description: 'Un espacio para leer, compartir y crear poesía.', members: 75, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'quill paper' },
    { id: '3', name: 'Debates Literarios Ecuador', description: 'Discutimos sobre literatura ecuatoriana contemporánea e histórica.', members: 90, imageUrl: 'https://placehold.co/300x200.png', dataAiHint: 'discussion group' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-12 text-center">
        <Users className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
          Comunidad Alicia Libros
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          Conéctate con otros lectores, comparte tus opiniones y descubre nuevas perspectivas literarias.
        </p>
      </header>

      <Tabs defaultValue="reviews" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-8 bg-muted/50 p-1 h-auto">
          <TabsTrigger value="reviews" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
            <MessageSquare className="mr-2 h-5 w-5" /> Reseñas de Libros
          </TabsTrigger>
          <TabsTrigger value="bookClubs" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
            <Users className="mr-2 h-5 w-5" /> Clubes de Lectura
          </TabsTrigger>
          <TabsTrigger value="forums" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
            <CalendarDays className="mr-2 h-5 w-5" /> Foros de Discusión
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          {isAuthenticated ? (
            <Card className="mb-8 shadow-md">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Escribe tu Reseña</CardTitle>
                <CardDescription>Comparte tu opinión sobre tu última lectura.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  placeholder="Título del libro que estás reseñando (ej: Cien Años de Soledad)" 
                  value={newReviewBookTitle}
                  onChange={(e) => setNewReviewBookTitle(e.target.value)}
                  className="text-base md:text-sm"
                />
                <Textarea
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Escribe tu reseña aquí..."
                  rows={4}
                  className="text-base md:text-sm"
                />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                  <StarRating rating={newReviewRating} setRating={setNewReviewRating} />
                  <Button onClick={handlePublishReview} disabled={isSubmittingReview} className="w-full sm:w-auto font-body">
                    {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Publicar Reseña
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
             <Card className="mb-8 shadow-md text-center">
                <CardContent className="p-6">
                    <p className="text-muted-foreground">
                        <Link href="/login?redirect=/community" className="text-primary hover:underline font-semibold">Inicia sesión</Link> para publicar una reseña.
                    </p>
                </CardContent>
            </Card>
          )}

          <h2 className="font-headline text-2xl font-semibold mb-6 text-foreground">Últimas Reseñas</h2>
          {isLoading ? (
             <div className="flex justify-center items-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <Card key={review.id} className="shadow-sm hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <Image 
                          src={review.avatarUrl || `https://placehold.co/100x100.png?text=${review.userName.charAt(0)}`}
                          alt={review.userName} 
                          width={48} 
                          height={48} 
                          className="rounded-full" 
                          data-ai-hint={review.dataAiHint || 'user avatar'}
                      />
                      <div>
                        <CardTitle className="font-headline text-lg">{review.userName}</CardTitle>
                        <CardDescription>
                          Reseña para: {review.bookId ? 
                            <Link href={`/books/${review.bookId}`} className="text-primary hover:underline">{review.bookTitle}</Link>
                            : <span className="text-primary">{review.bookTitle}</span>
                          } <br/>
                          {review.createdAt && format(new Date(review.createdAt), "PPP", { locale: es })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2">
                      <StarRating rating={review.rating} interactive={false}/>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-wrap">{review.comment}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                      <ThumbsUp className="mr-2 h-4 w-4" /> Útil (12) {/* Placeholder count */}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {reviews.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-muted-foreground">Aún no hay reseñas. ¡Sé el primero en compartir tu opinión!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookClubs">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-2xl font-semibold text-foreground">Clubes de Lectura Activos</h2>
            <Button variant="default" className="font-body">
              <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Club
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookClubs.map(club => (
              <Card key={club.id} className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                {club.imageUrl && 
                  <Image src={club.imageUrl} alt={club.name} width={300} height={200} className="w-full h-40 object-cover" data-ai-hint={club.dataAiHint} />
                }
                <CardHeader>
                  <CardTitle className="font-headline text-lg">{club.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{club.description}</p>
                  <p className="text-xs text-primary font-medium">{club.members} miembros</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full font-body">Unirse al Club</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="forums">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Foros de Discusión</CardTitle>
              <CardDescription>Participa en conversaciones sobre tus libros y temas favoritos.</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Los foros de discusión estarán disponibles próximamente. ¡Vuelve pronto!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
