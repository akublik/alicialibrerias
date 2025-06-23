// src/ai/flows/book-recommendations.ts
'use server';
/**
 * @fileOverview AI agent that provides personalized book recommendations based on user reading history and preferences.
 * It searches the existing inventory and also suggests new books.
 *
 * - getBookRecommendations - A function that retrieves book recommendations for a user.
 * - BookRecommendationsInput - The input type for the getBookRecommendations function.
 * - BookRecommendationsOutput - The return type for the getBookRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Book } from '@/types';

// The input for the flow only requires user data.
const BookRecommendationsInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom to generate recommendations.'),
  readingHistory: z.array(z.string()).describe('An array of book titles the user has read.'),
  preferences: z.string().describe('The user\u2019s stated preferences, such as preferred genres or authors.'),
});
export type BookRecommendationsInput = z.infer<typeof BookRecommendationsInputSchema>;

// The output schema is now richer, separating found books from new ideas.
const FoundBookSchema = z.object({
  id: z.string().describe('The unique ID of the book from the inventory.'),
  title: z.string().describe('The title of the book.'),
});

const NewSuggestionSchema = z.object({
  title: z.string().describe('The title for a new book suggestion.'),
  author: z.string().describe('The author for the new book suggestion.'),
  rationale: z.string().describe('Una razón breve y convincente en español de por qué este libro se recomienda al usuario.'),
});

const BookRecommendationsOutputSchema = z.object({
  foundInInventory: z.array(FoundBookSchema).describe('Libros encontrados en nuestro inventario actual que coinciden con la solicitud.'),
  newSuggestions: z.array(NewSuggestionSchema).describe('Nuevas sugerencias de libros que no están en nuestro inventario pero que se ajustan al perfil del usuario.'),
});
export type BookRecommendationsOutput = z.infer<typeof BookRecommendationsOutputSchema>;

export async function getBookRecommendations(input: BookRecommendationsInput): Promise<BookRecommendationsOutput> {
  return bookRecommendationsFlow(input);
}

// The prompt's input needs the user data AND the inventory.
const PromptInputSchema = BookRecommendationsInputSchema.extend({
  inventory: z.string().describe('A JSON string of available books in the store.'),
});

const prompt = ai.definePrompt({
  name: 'bookRecommendationsPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: BookRecommendationsOutputSchema},
  prompt: `Eres un bibliotecario de clase mundial y experto en recomendaciones de libros.
Un usuario ha proporcionado su historial de lectura y sus preferencias. También se te ha dado una cadena JSON que representa nuestro inventario de libros actual.

Tu tarea es proporcionar dos conjuntos de recomendaciones:
1.  **foundInInventory**: Busca en el JSON de inventario proporcionado. Encuentra hasta 3 libros que mejor coincidan con la solicitud del usuario. Para cada libro que encuentres, devuelve solo su 'id' y 'title' de los datos del inventario. No inventes libros para esta lista.
2.  **newSuggestions**: Genera una lista de hasta 10 NUEVAS sugerencias de libros que NO estén en el inventario proporcionado pero que sean una excelente opción para el usuario. Para cada nueva sugerencia, proporciona un título, un autor y una 'rationale' (razón) breve y convincente en español que explique por qué el usuario disfrutaría de este libro.

Preferencias del Usuario:
- Historial de Lectura: {{readingHistory}}
- Preferencias Declaradas: {{preferences}}

Inventario de Libros Actual (JSON):
{{{inventory}}}
`,
});

const bookRecommendationsFlow = ai.defineFlow(
  {
    name: 'bookRecommendationsFlow',
    inputSchema: BookRecommendationsInputSchema,
    outputSchema: BookRecommendationsOutputSchema,
  },
  async (input) => {
    if (!db) throw new Error("Database connection not available");
    
    // 1. Fetch all books from Firestore to create the inventory.
    const booksSnapshot = await getDocs(collection(db, "books"));
    const inventoryList = booksSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            authors: data.authors,
            categories: data.categories || [],
            tags: data.tags || []
        };
    });
    const inventoryJson = JSON.stringify(inventoryList);

    // 2. Call the prompt with the user's input and the fetched inventory.
    const {output} = await prompt({
      ...input,
      inventory: inventoryJson,
    });
    return output!;
  }
);
