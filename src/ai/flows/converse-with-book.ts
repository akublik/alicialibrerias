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
// This type is not exported anymore to comply with 'use server'
type ConverseWithBookInput = z.infer<typeof ConverseWithBookInputSchema>;


export async function converseWithBook(input: ConverseWithBookInput): Promise<string> {
    const { bookTitle, history } = input;

    const systemPrompt = `A partir de ahora, actúa como si fueras AlicIA, una asistente de lectura experta en el libro "${bookTitle}". Responde a mis preguntas y comentarios usando tu conocimiento sobre ese libro. Si te hago preguntas que se salgan del contexto o del enfoque del libro, rechaza la solicitud indicando que solo puedes interactuar como una asistente para ese libro.
    
    Diccionario:
    1. Definición Contextual: Al pedir una palabra, el diccionario podría ofrecer definiciones que se ajusten al contexto específico del texto que el usuario está leyendo, evitando definiciones irrelevantes o ambiguas.
    2. Traducciones: Además de definiciones, el diccionario podría ofrecer traducciones inmediatas de palabras o frases, especialmente útil para textos en varios idiomas o para usuarios que están aprendiendo un nuevo idioma.
    3. Sinónimos y Antónimos: Para ayudar a los usuarios a expandir su vocabulario, el diccionario podría mostrar sinónimos y antónimos de las palabras seleccionadas.
    4. Información Gramatical: Ofrecer detalles gramaticales como la categoría gramatical de la palabra (sustantivo, verbo, adjetivo, etc.), conjugaciones verbales, género, número, entre otros.
    5. Ejemplos de Uso: Mostrar ejemplos adicionales de cómo se usa la palabra o frase en diferentes contextos o en otras obras literarias disponibles en la plataforma.
    6. Pronunciación: Incluir una opción para escuchar la pronunciación correcta de las palabras, tanto en el idioma original como en las traducciones.
    7. Vinculación a Notas y Glosarios: Permitir a los usuarios agregar palabras a sus propias listas de vocabulario o glosarios personalizados, así como hacer anotaciones sobre las palabras o frases.
    8. Búsqueda Avanzada: Permitir a los usuarios buscar palabras o frases en todo el contenido de la plataforma Alicia, mostrando dónde más aparecen en otros textos y cómo se usan.
    9. Contexto Cultural e Histórico: Para términos específicos que tengan relevancia cultural o histórica, el diccionario podría proporcionar breves explicaciones o referencias a eventos históricos, personajes, o costumbres.
    10. Integración con Preguntas y Respuestas: El diccionario podría estar integrado con el sistema de preguntas y respuestas de la plataforma, permitiendo que los usuarios pregunten sobre el uso de palabras específicas en el contexto del texto que están leyendo.`;

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
