// src/app/(app)/games/page.tsx
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Gamepad2, Wand2, Brain, CheckCircle, XCircle, RefreshCw, Trophy, BookText } from "lucide-react";
import { literaryGamesAI, type LiteraryGamesAIInput, type LiteraryGamesAIOutput } from "@/ai/flows/literary-game-ai";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const gameFormSchema = z.object({
  gameType: z.string().min(3, { message: "El tipo de juego debe tener al menos 3 caracteres." }),
  theme: z.string().min(3, { message: "El tema debe tener al menos 3 caracteres." }),
  complexity: z.enum(["easy", "medium", "hard"], { required_error: "Debes seleccionar una complejidad." }),
});

type GameFormValues = z.infer<typeof gameFormSchema>;

type QuizQuestion = LiteraryGamesAIOutput extends { type: 'quiz', questions: Array<infer Q> } ? Q : never;

export default function GamesPage() {
  const [aiResponse, setAiResponse] = useState<LiteraryGamesAIOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      gameType: "Trivia",
      theme: "",
      complexity: undefined,
    },
  });

  const resetGameState = () => {
    setAiResponse(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };
  
  const handleGenerateGame = async (values: GameFormValues) => {
    setIsLoading(true);
    resetGameState();

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
        description: "Tu juego literario está listo para empezar.",
      });
    } catch (error: any) {
      console.error("Error generating literary game:", error);
      let toastDescription = "No pudimos crear tu juego en este momento. Inténtalo de nuevo.";
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('GOOGLE_API_KEY'))) {
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

  const handleAnswerSubmit = (question: QuizQuestion) => {
    if (!selectedAnswer) return;
    setIsAnswered(true);

    if (selectedAnswer === question.correctAnswer) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (aiResponse?.type === 'quiz' && currentQuestionIndex < aiResponse.questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
      } else {
        setQuizFinished(true);
      }
    }, 2000); // Wait 2 seconds before moving to the next question or finishing
  };

  const currentQuestion = useMemo(() => {
    if (aiResponse?.type === 'quiz') {
      return aiResponse.questions[currentQuestionIndex];
    }
    return null;
  }, [aiResponse, currentQuestionIndex]);

  const quizProgress = useMemo(() => {
      if(aiResponse?.type !== 'quiz') return 0;
      return ((currentQuestionIndex) / aiResponse.questions.length) * 100;
  }, [currentQuestionIndex, aiResponse]);
  
  const renderGameContent = () => {
    if (isLoading) {
      return (
        <div className="md:col-span-1 flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md min-h-[300px]">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="font-headline text-xl text-foreground">Creando tu juego...</p>
          <p className="text-muted-foreground">La IA está tejiendo palabras e ideas.</p>
        </div>
      );
    }

    if (!aiResponse) {
       return (
         <div className="md:col-span-1 flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md min-h-[300px]">
            <Gamepad2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-headline text-xl text-foreground">Tu juego aparecerá aquí</p>
            <p className="text-muted-foreground">Completa el formulario para empezar.</p>
        </div>
      );
    }

    if (aiResponse.type === 'text') {
      return (
        <Card className="shadow-lg md:col-span-1 animate-fadeIn">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <BookText className="mr-2 h-6 w-6"/>
              {aiResponse.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-headline text-lg font-semibold text-foreground mb-1">Descripción y Reglas:</h3>
              <p className="text-foreground/80 whitespace-pre-wrap text-sm">{aiResponse.description}</p>
            </div>
            <div>
              <h3 className="font-headline text-lg font-semibold text-foreground mb-1">Instrucciones:</h3>
              <p className="text-foreground/80 whitespace-pre-wrap text-sm">{aiResponse.instructions}</p>
            </div>
          </CardContent>
          <CardFooter>
              <Button onClick={() => form.handleSubmit(handleGenerateGame)()} variant="outline" className="w-full font-body">
                  Crear Otro Juego
              </Button>
          </CardFooter>
        </Card>
      );
    }

    if (aiResponse.type === 'quiz') {
      if (quizFinished) {
         return (
            <Card className="shadow-lg md:col-span-1 animate-fadeIn">
              <CardHeader className="text-center">
                <Trophy className="mx-auto h-12 w-12 text-amber-400 mb-4" />
                <CardTitle className="font-headline text-2xl text-primary">¡Juego Terminado!</CardTitle>
                <CardDescription>Resultado para: {aiResponse.title}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                 <p className="text-4xl font-bold mb-2">{score} <span className="text-lg font-medium text-muted-foreground">/ {aiResponse.questions.length}</span></p>
                 <p className="font-semibold text-xl">Respuestas Correctas</p>
              </CardContent>
              <CardFooter>
                  <Button onClick={() => form.handleSubmit(handleGenerateGame)()} className="w-full font-body">
                      <RefreshCw className="mr-2 h-4 w-4" /> Jugar de Nuevo
                  </Button>
              </CardFooter>
            </Card>
         );
      }
      
      if (currentQuestion) {
        return (
          <Card className="shadow-lg md:col-span-1 animate-fadeIn">
            <CardHeader>
                <Progress value={quizProgress} className="w-full mb-2" />
                <CardTitle className="font-headline text-2xl text-primary pt-2">
                    {aiResponse.title}
                </CardTitle>
                 <CardDescription>Pregunta {currentQuestionIndex + 1} de {aiResponse.questions.length}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-lg font-semibold text-foreground">{currentQuestion.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options.map((option, index) => {
                        const isCorrect = option === currentQuestion.correctAnswer;
                        const isSelected = option === selectedAnswer;

                        return (
                             <Button
                                key={index}
                                variant="outline"
                                className={cn(
                                    "h-auto py-3 text-base justify-start whitespace-normal",
                                    isAnswered && isCorrect && "bg-green-100 border-green-500 text-green-800 hover:bg-green-200",
                                    isAnswered && isSelected && !isCorrect && "bg-red-100 border-red-500 text-red-800 hover:bg-red-200",
                                    isSelected && !isAnswered && "bg-primary/10 border-primary"
                                )}
                                onClick={() => !isAnswered && setSelectedAnswer(option)}
                                disabled={isAnswered}
                            >
                                {option}
                            </Button>
                        )
                    })}
                </div>
                 {isAnswered && (
                    <div className={cn(
                        "p-3 rounded-md animate-fadeIn",
                         selectedAnswer === currentQuestion.correctAnswer ? "bg-green-100" : "bg-red-100"
                    )}>
                        {selectedAnswer === currentQuestion.correctAnswer ? (
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-bold text-green-800">¡Correcto!</p>
                                    {currentQuestion.rationale && <p className="text-sm text-green-700">{currentQuestion.rationale}</p>}
                                </div>
                            </div>
                        ) : (
                             <div className="flex items-start gap-2">
                                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                 <div>
                                    <p className="font-bold text-red-800">Incorrecto.</p>
                                    <p className="text-sm text-red-700">La respuesta correcta era: <strong>{currentQuestion.correctAnswer}</strong></p>
                                     {currentQuestion.rationale && <p className="text-sm text-red-700 mt-1">{currentQuestion.rationale}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={() => handleAnswerSubmit(currentQuestion)} disabled={isAnswered || !selectedAnswer} className="w-full font-body">
                    {isAnswered ? "Siguiente" : "Confirmar Respuesta"}
                </Button>
            </CardFooter>
          </Card>
        );
      }
    }
    
    return null;
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
                      <FormDescription>Prueba con "Trivia" o "Cuestionario" para un juego interactivo.</FormDescription>
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
                <Button type="submit" disabled={isLoading} size="lg" className="w-full font-body">
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
                  {isLoading ? "Generando Juego..." : "Generar Juego Literario"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {renderGameContent()}
      </div>
    </div>
  );
}
