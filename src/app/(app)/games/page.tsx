
// src/app/(app)/games/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Gamepad2, Wand2, BookText, Brain } from "lucide-react";
import { literaryGamesAI, type LiteraryGamesAIInput, type LiteraryGamesAIOutput } from "@/ai/flows/literary-game-ai";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const gameFormSchema = z.object({
  gameType: z.string().min(3, { message: "El tipo de juego debe tener al menos 3 caracteres." }),
  theme: z.string().min(3, { message: "El tema debe tener al menos 3 caracteres." }),
  complexity: z.enum(["easy", "medium", "hard"], { required_error: "Debes seleccionar una complejidad." }),
});

type GameFormValues = z.infer<typeof gameFormSchema>;

export default function GamesPage() {
  const [aiResponse, setAiResponse] = useState<LiteraryGamesAIOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      gameType: "",
      theme: "",
      complexity: undefined, // Or "easy" as a default
    },
  });

  const handleGenerateGame = async (values: GameFormValues) => {
    setIsLoading(true);
    setAiResponse(null);

    const input: LiteraryGamesAIInput = {
      gameType: values.gameType,
      theme: values.theme,
      complexity: values.complexity,
    };

    try {
      const result = await literaryGamesAI(input);
      setAiResponse(result);
      toast({
        title: "¡Juego Generado!",
        description: "Tu juego literario está listo.",
      });
    } catch (error: any) {
      console.error("Error generating literary game:", error);
      let toastDescription = "No pudimos crear tu juego en este momento. Inténtalo de nuevo.";
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('GOOGLE_API_KEY'))) {
          console.error("DEVELOPER HINT: The AI feature failed because the GOOGLE_API_KEY is not set in your environment variables.");
          toastDescription = "La función de juegos por IA no está disponible en este momento. Disculpa las molestias."
      }
      toast({
        title: "Error al Generar Juego",
        description: toastDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-12 text-center">
        <Gamepad2 className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
          Juegos Literarios con IA
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          ¡Pon a prueba tu ingenio y creatividad! Diseña tu propio juego literario con la ayuda de nuestra inteligencia artificial.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center">
              <Wand2 className="mr-2 h-6 w-6 text-primary" />
              Crea tu Juego
            </CardTitle>
            <CardDescription>
              Define los parámetros y deja que la IA diseñe una experiencia literaria única para ti.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateGame)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="gameType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Juego</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Trivia, Adivinanzas, Relato interactivo" {...field} className="text-base md:text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tema del Juego</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Realismo mágico, Ciencia ficción ecuatoriana, Poesía modernista" {...field} className="text-base md:text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="complexity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complejidad</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-base md:text-sm">
                            <SelectValue placeholder="Selecciona un nivel de complejidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Fácil</SelectItem>
                          <SelectItem value="medium">Medio</SelectItem>
                          <SelectItem value="hard">Difícil</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full font-body"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Brain className="mr-2 h-5 w-5" />
                  )}
                  {isLoading ? "Generando Juego..." : "Generar Juego Literario"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {isLoading && !aiResponse && (
          <div className="md:col-span-1 flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md min-h-[300px]">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="font-headline text-xl text-foreground">Creando tu juego...</p>
            <p className="text-muted-foreground">La IA está tejiendo palabras e ideas.</p>
          </div>
        )}

        {aiResponse && !isLoading && (
          <Card className="shadow-lg md:col-span-1 animate-fadeIn">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <BookText className="mr-2 h-6 w-6"/>
                {aiResponse.gameTitle || "Tu Juego Literario"}
              </CardTitle>
              <CardDescription>
                ¡Listo para jugar! Aquí tienes los detalles de tu juego generado por IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-headline text-lg font-semibold text-foreground mb-1">Descripción y Reglas:</h3>
                <p className="text-foreground/80 whitespace-pre-wrap text-sm">{aiResponse.gameDescription}</p>
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold text-foreground mb-1">Instrucciones:</h3>
                <p className="text-foreground/80 whitespace-pre-wrap text-sm">{aiResponse.gameInstructions}</p>
              </div>
            </CardContent>
            <CardFooter>
                <Button onClick={() => {
                    setAiResponse(null);
                    form.reset();
                }} variant="outline" className="w-full font-body">
                    Crear Otro Juego
                </Button>
            </CardFooter>
          </Card>
        )}

         {!isLoading && !aiResponse && (
             <div className="md:col-span-1 flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md min-h-[300px]">
                <Gamepad2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-headline text-xl text-foreground">Tu juego aparecerá aquí</p>
                <p className="text-muted-foreground">Completa el formulario para empezar.</p>
            </div>
        )}
      </div>
    </div>
  );
}
