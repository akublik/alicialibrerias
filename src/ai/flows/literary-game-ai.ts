'use server';
/**
 * @fileOverview Literary game AI flow for generating engaging and interactive literary experiences.
 *
 * - literaryGamesAI - A function that generates literary games enhanced with AI.
 * - LiteraryGamesAIInput - The input type for the literaryGamesAI function.
 * - LiteraryGamesAIOutput - The return type for the literaryGamesAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LiteraryGamesAIInputSchema = z.object({
  gameType: z.string().describe('The type of literary game to generate.'),
  theme: z.string().describe('The theme of the literary game.'),
  complexity: z.string().describe('The complexity level of the game (e.g., easy, medium, hard).'),
});
export type LiteraryGamesAIInput = z.infer<typeof LiteraryGamesAIInputSchema>;

// Schema for text-based games
const GameTextSchema = z.object({
    type: z.enum(['text']).describe("El tipo de juego, para juegos basados en texto."),
    title: z.string().describe('El título del juego literario.'),
    description: z.string().describe('Una descripción del juego literario, incluyendo reglas y objetivos.'),
    instructions: z.string().describe('Instrucciones paso a paso sobre cómo jugar.'),
});

// Schema for quiz-based games
const QuizQuestionSchema = z.object({
    question: z.string().describe("El texto de la pregunta de trivia."),
    options: z.array(z.string()).length(4).describe("Un array de 4 posibles respuestas (opciones)."),
    correctAnswer: z.string().describe("La respuesta correcta de entre las opciones."),
    rationale: z.string().optional().describe("Una breve explicación de por qué la respuesta es correcta."),
});

const QuizGameSchema = z.object({
    type: z.enum(['quiz']).describe("El tipo de juego, para juegos de trivia o cuestionarios."),
    title: z.string().describe('El título del juego de trivia.'),
    description: z.string().describe('Una breve introducción o descripción del juego de trivia.'),
    questions: z.array(QuizQuestionSchema).min(3).max(10).describe("Una lista de 3 a 10 preguntas para el juego."),
});

// Discriminated union for the output
const LiteraryGamesAIOutputSchema = z.discriminatedUnion("type", [
    GameTextSchema,
    QuizGameSchema
]);
export type LiteraryGamesAIOutput = z.infer<typeof LiteraryGamesAIOutputSchema>;


export async function literaryGamesAI(input: LiteraryGamesAIInput): Promise<LiteraryGamesAIOutput> {
  return literaryGamesAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'literaryGamesAIPrompt',
  model: 'googleai/gemini-2.5-flash-preview',
  input: {schema: LiteraryGamesAIInputSchema},
  output: {schema: LiteraryGamesAIOutputSchema},
  prompt: `Eres un diseñador de juegos literarios experto. Tu respuesta debe estar completamente en español.

Basado en la siguiente solicitud, genera un juego literario.

Tipo de Juego: {{{gameType}}}
Tema: {{{theme}}}
Complejidad: {{{complexity}}}

- Si el tipo de juego es "Trivia", "Cuestionario", "Quiz" o "Adivinanzas", genera un juego de tipo 'quiz'. Debe tener un título, una descripción y una lista de 5 a 10 preguntas. Cada pregunta debe tener 4 opciones, una respuesta correcta y una explicación breve (rationale) de la respuesta.
- Para cualquier otro tipo de juego, genera un juego de tipo 'text'. Debe tener un título, una descripción con reglas y unas instrucciones.

Asegúrate de que el resultado se ajuste al esquema de salida JSON proporcionado.`,
});

const literaryGamesAIFlow = ai.defineFlow(
  {
    name: 'literaryGamesAIFlow',
    inputSchema: LiteraryGamesAIInputSchema,
    outputSchema: LiteraryGamesAIOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
