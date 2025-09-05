// src/app/(app)/games/page.tsx
"use client";

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Gamepad2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Define the structure for questions and options
interface GameOption {
  texto: string;
  correcta: boolean;
}

interface GameQuestion {
  pregunta: string;
  opciones: GameOption[];
}

type GamePhase = 'setup' | 'loading' | 'playing' | 'results';

export default function GamesPage() {
    const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
    const [gameData, setGameData] = useState<GameQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);

    // Form state
    const [theme, setTheme] = useState('Literatura Universal');
    const [complexity, setComplexity] = useState('Fácil');

    const { toast } = useToast();

    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const startGame = async (e: FormEvent) => {
        e.preventDefault();
        setGamePhase('loading');
        
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            toast({
                title: "Error de Configuración",
                description: "La clave de API de Gemini no está disponible para iniciar el juego.",
                variant: "destructive"
            });
            setGamePhase('setup');
            return;
        }

        try {
            const prompt = `Genera un juego de trivia con 5 preguntas sobre "${theme}" con 4 opciones de respuesta para cada una, donde solo una sea correcta. La dificultad debe ser ${complexity}. Devuelve el resultado en un array de objetos JSON con el siguiente formato, sin ningún texto o formato adicional antes o después del JSON:
            [
                {
                    "pregunta": "...",
                    "opciones": [
                        {"texto": "...", "correcta": false},
                        {"texto": "...", "correcta": true},
                        {"texto": "...", "correcta": false},
                        {"texto": "...", "correcta": false}
                    ]
                },
                ...
            ]`;

            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
            };
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorBody = await response.json();
                console.error("API Error Body:", errorBody);
                throw new Error(`Error en la API: ${response.statusText}`);
            }
            
            const result = await response.json();
            const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!jsonString) {
                 throw new Error('La respuesta de la API no tiene el formato esperado.');
            }

            const parsedGameData: GameQuestion[] = JSON.parse(jsonString);
            
            setGameData(parsedGameData);
            setCurrentQuestionIndex(0);
            setScore(0);
            setSelectedAnswer(null);
            setShowResult(false);
            setGamePhase('playing');

        } catch (error: any) {
            console.error('Error al generar el juego:', error);
            toast({
                title: "Error al generar el juego",
                description: "No se pudieron crear las preguntas. Inténtalo de nuevo.",
                variant: "destructive"
            });
            setGamePhase('setup');
        }
    };
    
    const handleAnswer = (optionIndex: number) => {
        if (showResult) return;
        
        setSelectedAnswer(optionIndex);
        setShowResult(true);

        const correct = gameData[currentQuestionIndex].opciones[optionIndex].correcta;
        if (correct) {
            setScore(prev => prev + 1);
        }

        setTimeout(() => {
            if (currentQuestionIndex < gameData.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setShowResult(false);
            } else {
                setGamePhase('results');
            }
        }, 1200); // Wait 1.2 seconds before moving to the next question
    };

    const getButtonClass = (optionIndex: number) => {
        if (!showResult) return 'option-button-default';
        const isCorrect = gameData[currentQuestionIndex].opciones[optionIndex].correcta;
        if (isCorrect) return 'option-button-correct';
        if (selectedAnswer === optionIndex && !isCorrect) return 'option-button-incorrect';
        return 'option-button-disabled';
    };

    const resetGame = () => {
        setGamePhase('setup');
        setGameData([]);
    }

    const renderContent = () => {
        switch (gamePhase) {
            case 'loading':
                return (
                    <div className='flex flex-col items-center justify-center text-center p-8'>
                        <Loader2 className="h-16 w-16 text-primary animate-spin" />
                        <p className="mt-4 text-muted-foreground">Generando tus preguntas...</p>
                    </div>
                );
            case 'playing':
                const question = gameData[currentQuestionIndex];
                return (
                    <div className="question-card fade-in">
                        <p className="text-lg font-semibold mb-4">{currentQuestionIndex + 1}. {question.pregunta}</p>
                        <div className="w-full space-y-2">
                            {question.opciones.map((option, index) => (
                                <button key={index} onClick={() => handleAnswer(index)} className={cn('option-button', getButtonClass(index))} disabled={showResult}>
                                    {option.texto}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'results':
                return (
                    <div className="result-card fade-in">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">¡Juego terminado!</h3>
                        <p className="text-lg text-gray-700">Has respondido correctamente a <span className="text-primary font-bold">{score} de {gameData.length}</span> preguntas.</p>
                        <Button onClick={resetGame} className="mt-8">Jugar de Nuevo</Button>
                    </div>
                );
            case 'setup':
            default:
                return (
                    <div className='text-center p-8'>
                        <Gamepad2 className="mx-auto h-16 w-16 text-primary mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Tu juego aparecerá aquí</h3>
                        <p className="text-gray-500">Completa el formulario para empezar.</p>
                    </div>
                );
        }
    };


    return (
        <div className="min-h-screen bg-muted/30 p-4 sm:p-8">
            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .option-button {
                    width: 100%;
                    padding: 0.75rem;
                    margin: 0.5rem 0;
                    border-radius: 0.5rem;
                    border: 2px solid transparent;
                    cursor: pointer;
                    transition: all 0.2s ease-in-out;
                    font-weight: 600;
                    text-align: left;
                }
                .option-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                }
                .option-button-default {
                    background-color: hsl(var(--card));
                    border-color: hsl(var(--border));
                }
                .option-button-default:hover {
                     background-color: hsl(var(--accent));
                }
                .option-button-correct {
                    background-color: hsl(var(--primary) / 0.1);
                    border-color: hsl(var(--primary));
                    color: hsl(var(--primary));
                }
                .option-button-incorrect {
                    background-color: hsl(var(--destructive) / 0.1);
                    border-color: hsl(var(--destructive));
                    color: hsl(var(--destructive));
                }
                .option-button-disabled {
                    background-color: hsl(var(--muted));
                    color: hsl(var(--muted-foreground));
                    cursor: not-allowed;
                }
                .question-card, .result-card {
                    width: 100%;
                    max-width: 600px;
                    background-color: hsl(var(--card));
                    padding: 2rem;
                    border-radius: 1rem;
                    border: 1px solid hsl(var(--border));
                    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
            `}</style>
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Juegos Literarios</h1>
                <p className="text-lg text-gray-700">¡Pon a prueba tu ingenio y creatividad! Diseña tu propio juego literario con la ayuda de la IA.</p>
            </header>

            <div className="flex flex-wrap justify-center gap-8">
                <Card className="game-setup w-full max-w-sm flex-shrink-0">
                    <CardHeader>
                        <CardTitle>Crea tu Juego</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={startGame} className="space-y-4">
                            <div>
                                <Label htmlFor='theme'>Tema del Juego</Label>
                                <Input id="theme" value={theme} onChange={(e) => setTheme(e.target.value)} />
                            </div>
                             <div>
                                <Label htmlFor="complexity">Dificultad</Label>
                                <Select value={complexity} onValueChange={setComplexity}>
                                    <SelectTrigger id="complexity">
                                        <SelectValue placeholder="Selecciona dificultad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Fácil">Fácil</SelectItem>
                                        <SelectItem value="Medio">Medio</SelectItem>
                                        <SelectItem value="Difícil">Difícil</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={gamePhase === 'loading'}>
                                {gamePhase === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Generar Juego
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="game-display flex-grow flex items-center justify-center min-h-[300px]">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
