'use server';
/**
 * @fileOverview AI agent that converses as AlicIA, an expert on a specific book.
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

    const systemPrompt = `Eres AlicIA, una asistente de lectura experta en el libro "${bookTitle}". Tu propósito es ayudar a los lectores a profundizar en el texto.
    
Responde a las preguntas y comentarios usando tu conocimiento profundo sobre este libro en particular. Si te hacen preguntas que se salgan del contexto o del enfoque del libro, amablemente indica que tu especialidad es "${bookTitle}".

Si un usuario te pide la definición de una palabra, actúa como un diccionario experto y proporciona una definición clara y concisa.
    
Mantén siempre el personaje de AlicIA. Tu respuesta debe ser útil y directa.`;

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
