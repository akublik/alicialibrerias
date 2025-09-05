// src/app/(app)/recommendations/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookCard } from "@/components/BookCard";
import type { Book } from "@/types";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { getBookRecommendations, type BookRecommendationsInput, type BookRecommendationsOutput } from "@/ai/flows/book-recommendations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function RecommendationsPage() {
  const [preferences, setPreferences] = useState<string>("");
  const [readingHistory, setReadingHistory] = useState<string[]>(["Cien Años de Soledad"]); // Sample history
  const [foundBooks, setFoundBooks] = useState<Book[]>([]);
  const [newSuggestions, setNewSuggestions] = useState<BookRecommendationsOutput['newSuggestions']>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const fetchBooks = async () => {
        try {
            const booksSnapshot = await getDocs(collection(db, "books"));
            setAllBooks(booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
        } catch (error) {
            console.error("Error fetching all books:", error);
        }
    };
    fetchBooks();
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
    setFoundBooks([]);
    setNewSuggestions([]);

    const input: BookRecommendationsInput = {
      userId: "currentUser123", // Replace with actual user ID
      readingHistory: readingHistory.filter(h => h.trim() !== ''),
      preferences: preferences,
    };

    try {
      const result = await getBookRecommendations(input);
      
      const foundBookDetails = result.foundInInventory
          .map(found => allBooks.find(b => b.id === found.id))
          .filter((b): b is Book => !!b);
      
      setFoundBooks(foundBookDetails);
      setNewSuggestions(result.newSuggestions);

      if (foundBookDetails.length === 0 && result.newSuggestions.length === 0) {
        toast({
            title: "No se encontraron resultados",
            description: "Intenta ser más específico o más general en tus preferencias.",
        });
      }

    } catch (error: any) {
      console.error("Error getting recommendations:", error);
      let toastDescription = "No pudimos generar recomendaciones en este momento. Por favor, inténtalo de nuevo más tarde.";
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('GOOGLE_API_KEY') || error.message.includes('GEMINI_API_KEY'))) {
        toastDescription = "La función de recomendación por IA no está disponible en este momento debido a un problema de configuración. Disculpa las molestias."
      }
      toast({
        title: "Error de Recomendación",
        description: toastDescription,
        variant: "destructive",
        duration: 7000,
      });
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
                onChange={(e) => setReadingHistory(e.target.value.split(",").map(s => s.trim()))}
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

      {isLoading ? (
        <div className="text-center py-12">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Buscando tus próximos libros favoritos...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {foundBooks.length > 0 && (
            <div>
              <h2 className="font-headline text-3xl font-semibold text-center mb-8 text-foreground">
                Encontrado en nuestro catálogo
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {foundBooks.map((book) => (
                  <BookCard key={book.id} book={book} size="small" />
                ))}
              </div>
            </div>
          )}

          {newSuggestions.length > 0 && (
            <div>
              <h2 className="font-headline text-3xl font-semibold text-center mb-8 text-foreground">
                Otras sugerencias para ti
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {newSuggestions.map((suggestion, index) => (
                   <Card key={index} className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="font-headline text-lg text-primary">{suggestion.title}</CardTitle>
                        <CardDescription>por {suggestion.author}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground/80 italic">"{suggestion.rationale}"</p>
                      </CardContent>
                   </Card>
                 ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
