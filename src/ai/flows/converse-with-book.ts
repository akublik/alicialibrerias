'use server';
/**
 * @fileOverview AI agent that converses as "AlicIA" about a book.
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

    const systemPrompt = `A partir de ahora, actúa como si fueras AlicIA, una asistente de lectura experta en el libro "${bookTitle}". Responde a mis preguntas y comentarios usando tu conocimiento sobre ese libro. Si te hago preguntas que se salgan del contexto o del enfoque del libro, rechaza la solicitud indicando que solo puedes interactuar como una asistente para ese libro.`;
    
    try {
        const response = await ai.generate({
            model: 'google/gemini-1.5-flash',
            system: systemPrompt,
            history: history,
        });

        // Use a more robust way to extract text content from all candidates and parts.
        const text = response.candidates
            .map(c => c.content.map(p => p.text ?? '').join(''))
            .join('');

        if (!text) {
          return "No he podido generar una respuesta en este momento. Inténtalo de nuevo."
        }
        return text;

    } catch (error: any) {
        console.error("----------- DETAILED AI CHAT ERROR -----------");
        console.error("Flow: converseWithBook");
        console.error("Timestamp:", new Date().toISOString());
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Error object:", JSON.stringify(error, null, 2));
        console.error("----------------------------------------------");
        
        // Provide user-friendly error messages
        if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) {
             return "Lo siento, mis circuitos están un poco sobrecargados en este momento. Por favor, inténtalo de nuevo en unos segundos.";
        }
        return "Lo siento, he encontrado un error inesperado y no puedo responder ahora mismo. Por favor, inténtalo de nuevo más tarde.";
    }
}
