'use server';
/**
 * @fileOverview AI agent that converses as the book's author.
 *
 * - converseWithBook - A function that handles the conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConverseWithBookInputSchema = z.object({
  bookTitle: z.string().describe('The title of the book.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).describe('The chat history between the user and the AI.'),
});
type ConverseWithBookInput = z.infer<typeof ConverseWithBookInputSchema>;


export async function converseWithBook(input: ConverseWithBookInput): Promise<string> {
    const { bookTitle, history } = input;

    const systemPrompt = `Eres el autor del libro "${bookTitle}". Responde a mis preguntas y comentarios usando tu estilo, conocimientos y perspectiva en relación a ese libro.
    Si te hago preguntas que se salgan del contexto o del enfoque del libro, rechaza la solicitud indicando que solo puedes interactuar como el autor de ese libro.`;

    try {
        const response = await ai.generate({
            system: systemPrompt,
            history: history,
        });

        const text = response.text;
        if (!text) {
          return "No he podido generar una respuesta en este momento. Inténtalo de nuevo."
        }
        return text;

    } catch (error) {
        console.error("Error in converseWithBook flow:", error);
        return "Lo siento, he encontrado un error y no puedo procesar tu solicitud ahora mismo.";
    }
}
