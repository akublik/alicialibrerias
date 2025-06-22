// src/app/(app)/recommendations/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookCard } from "@/components/BookCard";
import { placeholderBooks } from "@/lib/placeholders"; // Using placeholders for now
import type { Book } from "@/types";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { getBookRecommendations, type BookRecommendationsInput } from "@/ai/flows/book-recommendations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function RecommendationsPage() {
  const [preferences, setPreferences] = useState<string>("");
  const [readingHistory, setReadingHistory] = useState<string[]>(["Cien Años de Soledad", "Don Quijote"]); // Sample history
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Effect to load some initial placeholder recommendations or featured books
  useEffect(() => {
    setRecommendations(placeholderBooks.slice(0,3).map(book => ({...book, id: book.id + '-initial'})));
  }, []);

  const handleGetRecommendations = async () => {
    if (!preferences.trim() && readingHistory.length === 0) {
      toast({
        title: "Información Insuficiente",
        description: "Por favor, ingresa tus preferencias o asegúrate de tener un historial de lectura.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRecommendations([]); // Clear previous recommendations

    const input: BookRecommendationsInput = {
      userId: "currentUser123", // Replace with actual user ID
      readingHistory: readingHistory,
      preferences: preferences,
    };

    try {
      const result = await getBookRecommendations(input);
      // For now, we're getting titles. We'll map them to placeholderBooks or fetch details.
      // This is a simplified mapping. In a real app, you'd fetch book details based on titles.
      const recommendedBooks = result.recommendations.map((title, index) => {
        const existingBook = placeholderBooks.find(b => b.title.toLowerCase() === title.toLowerCase());
        if (existingBook) return {...existingBook, id: existingBook.id + `-${index}`};
        return {
          id: `rec-${index}-${Date.now()}`,
          title,
          authors: ["Autor Desconocido"],
          price: Math.floor(Math.random() * 10) + 10, // Random price
          imageUrl: `https://placehold.co/300x450.png`,
          dataAiHint: "recommended book"
        } as Book;
      }).slice(0, 6); // Limit to 6 recommendations for display
      
      setRecommendations(recommendedBooks);
    } catch (error: any) {
      console.error("Error getting recommendations:", error);
      let errorMessage = "No pudimos generar recomendaciones en este momento. Inténtalo de nuevo.";
      // Check for the specific API key error message
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('GOOGLE_API_KEY'))) {
        errorMessage = "La clave de API para la IA no está configurada. Por favor, asegúrate de que la variable de entorno GOOGLE_API_KEY esté definida en el servidor.";
      }
      toast({
        title: "Error de Recomendación",
        description: errorMessage,
        variant: "destructive",
        duration: 9000,
      });
      // Fallback to placeholders if AI fails
      setRecommendations(placeholderBooks.sort(() => 0.5 - Math.random()).slice(0,3).map(book => ({...book, id: book.id + '-fallback'})));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-12 text-center">
        <Sparkles className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
          Recomendaciones Personalizadas
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          Descubre tu próxima lectura con la ayuda de nuestra inteligencia artificial. Cuéntanos sobre tus gustos y te sorprenderemos.
        </p>
      </header>

      <Card className="mb-12 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <Wand2 className="mr-2 h-6 w-6 text-primary"/>
            Ajusta tus Preferencias
          </CardTitle>
          <CardDescription>
            Ingresa géneros, autores, temas que te interesan o libros que te hayan gustado. Mientras más detalles, ¡mejores serán las recomendaciones!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label htmlFor="preferences" className="block text-sm font-medium text-foreground mb-1">
                Tus preferencias literarias:
              </label>
              <Textarea
                id="preferences"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Ej: Me gustan las novelas de ciencia ficción con protagonistas femeninas fuertes, o libros similares a 'Dune' y 'Fundación'. También disfruto la poesía de Borges."
                rows={4}
                className="text-base md:text-sm"
              />
            </div>
            <div>
              <label htmlFor="history" className="block text-sm font-medium text-foreground mb-1">
                Tu historial de lectura (separado por comas):
              </label>
              <Textarea
                id="history"
                value={readingHistory.join(", ")}
                onChange={(e) => setReadingHistory(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                placeholder="Ej: Cien Años de Soledad, El Hobbit, 1984"
                rows={2}
                className="text-base md:text-sm"
              />
            </div>
            <Button
              onClick={handleGetRecommendations}
              disabled={isLoading}
              size="lg"
              className="w-full md:w-auto font-body"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {isLoading ? "Generando..." : "Obtener Recomendaciones"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <div>
          <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">
            {isLoading ? "Buscando tus próximos libros favoritos..." : "Libros Recomendados para Ti"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {recommendations.map((book) => (
              <BookCard key={book.id} book={book} size="small" />
            ))}
          </div>
        </div>
      )}
       { !isLoading && recommendations.length === 0 && preferences && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hemos encontrado recomendaciones con estos criterios. Intenta ser más específico o más general.</p>
        </div>
      )}
    </div>
  );
}
