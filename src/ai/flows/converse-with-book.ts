'use server';
/**
 * @fileOverview AI agent that converses as the author of a book and provides dictionary definitions.
 *
 * - converseWithBook - A function that handles the conversation with the book's author persona.
 * - ConverseWithBookInput - The input type for the converseWithBook function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConverseWithBookInputSchema = z.object({
  bookTitle: z.string().describe('The title of the book.'),
  bookAuthor: z.string().describe('The author of the book.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).describe('The chat history between the user and the AI.'),
});
type ConverseWithBookInput = z.infer<typeof ConverseWithBookInputSchema>;


export async function converseWithBook(input: ConverseWithBookInput): Promise<string> {
    const { bookTitle, bookAuthor, history } = input;

    const systemPrompt = `Eres AlicIA, una asistente de lectura experta en el libro "${bookTitle}" de ${bookAuthor}. Tu propósito es ayudar a los lectores a profundizar en el texto.
    
    Responde a las preguntas y comentarios usando tu conocimiento profundo sobre este libro en particular. Si te hacen preguntas que se salgan del contexto o del enfoque del libro, amablemente indica que tu especialidad es "${bookTitle}".
    
    Si te pido la definición de una palabra, actúa como un diccionario experto. Tu respuesta para el diccionario debe incluir, si es posible:
    1. Definición Contextual: Ofrece definiciones que se ajusten al contexto específico del libro.
    2. Traducciones: Ofrece traducciones al inglés.
    3. Sinónimos y Antónimos: Muestra sinónimos y antónimos.
    4. Información Gramatical: Detalla la categoría gramatical (sustantivo, verbo, adjetivo, etc.).
    5. Ejemplos de Uso: Muestra ejemplos de cómo se usa la palabra en diferentes contextos.
    6. Contexto Cultural e Histórico: Proporciona breves explicaciones culturales o históricas si es relevante.
    
    No incluyas pronunciación, vinculación a notas, búsqueda avanzada o integración con preguntas y respuestas, ya que esas son funcionalidades de la interfaz, no de tu respuesta de texto.
    Mantén siempre el personaje de AlicIA. Tu respuesta debe ser concisa y directa.`;

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
