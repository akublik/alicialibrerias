// src/app/(app)/community/page.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { placeholderReviews, bookClubs } from "@/lib/placeholders";
import type { Review } from "@/types";
import Image from "next/image";
import { MessageSquare, Users, CalendarDays, Star, ThumbsUp, Send, PlusCircle } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

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
  const [reviews, setReviews] = useState<Review[]>(placeholderReviews);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
   const [activeTab, setActiveTab] = useState("reviews");

  const handlePublishReview = async () => {
    if (!newReviewText.trim() || newReviewRating === 0) {
      alert("Por favor escribe tu reseña y asigna una calificación."); // Replace with toast
      return;
    }
    setIsSubmittingReview(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newReview: Review = {
      id: `review-${Date.now()}`,
      userId: 'currentUser123', // Mock current user
      userName: "Usuario Actual",
      bookId: placeholderReviews[0].bookId, // Mock book ID
      rating: newReviewRating,
      comment: newReviewText,
      date: new Date().toISOString(),
      avatarUrl: 'https://placehold.co/100x100.png',
      dataAiHint: 'user avatar',
    };
    setReviews([newReview, ...reviews]);
    setNewReviewText("");
    setNewReviewRating(0);
    setIsSubmittingReview(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-12 text-center">
        <Users className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
          Comunidad Alicia Lee
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
          <Card className="mb-8 shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Escribe tu Reseña</CardTitle>
              <CardDescription>Comparte tu opinión sobre tu última lectura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* This would ideally be a select for a book */}
              <Input placeholder="Título del libro que estás reseñando (ej: Cien Años de Soledad)" className="text-base md:text-sm"/>
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

          <h2 className="font-headline text-2xl font-semibold mb-6 text-foreground">Últimas Reseñas</h2>
          <div className="space-y-6">
            {reviews.map((review) => (
              <Card key={review.id} className="shadow-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    {review.avatarUrl && 
                      <Image src={review.avatarUrl} alt={review.userName} width={48} height={48} className="rounded-full" data-ai-hint={review.dataAiHint}/>
                    }
                    <div>
                      <CardTitle className="font-headline text-lg">{review.userName}</CardTitle>
                      <CardDescription>
                        Reseña para: <Link href={`/books/${review.bookId}`} className="text-primary hover:underline">{placeholderBooks.find(b => b.id === review.bookId)?.title || "Libro Desconocido"}</Link> <br/>
                        {format(new Date(review.date), "PPP", { locale: es })}
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
          </div>
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


// Placeholder for Loader2
const Loader2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

