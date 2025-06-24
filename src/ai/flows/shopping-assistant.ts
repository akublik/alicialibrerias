'use server';
/**
 * @fileOverview A shopping assistant AI agent that can query the book catalog.
 *
 * - askShoppingAssistant - A function that handles the conversation with the assistant.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {db} from '@/lib/firebase';
import {collection, query, where, getDocs, limit, type Query} from 'firebase/firestore';
import type {Book} from '@/types';

// Tool Input and Output Schemas
const BookSearchInputSchema = z.object({
  title: z.string().optional().describe('The title of the book to search for. Can be a partial match.'),
  author: z.string().optional().describe('The name of the author to search for.'),
  category: z.string().optional().describe('A category or genre to filter by. Must be an exact match from the available categories.'),
  tag: z.string().optional().describe('A tag to filter by. Must be an exact match from the available tags.'),
  maxPrice: z.number().optional().describe('The maximum price for the book.'),
  city: z.string().optional().describe('The city where the bookstore is located to filter results.'),
});

const BookSearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  price: z.number(),
  libraryName: z.string().optional(),
});
const BookSearchOutputSchema = z.array(BookSearchResultSchema);

// Tool Definition
const findBooksInCatalog = ai.defineTool(
  {
    name: 'findBooksInCatalog',
    description: 'Searches the book catalog based on various criteria. Use the most specific criteria available from the user\'s query. If the user asks about availability in a city, use the city parameter.',
    inputSchema: BookSearchInputSchema,
    outputSchema: BookSearchOutputSchema,
  },
  async (input) => {
    if (!db) {
      throw new Error('Database not available.');
    }
    const booksRef = collection(db, 'books');
    let q: Query = query(booksRef);

    // To avoid needing complex composite indexes in Firestore, we apply only the most specific filter provided.
    // This makes the tool slightly less powerful (e.g., can't search by author AND category) but ensures it works without manual index configuration.
    if (input.title) {
        const endTitle = input.title.slice(0, -1) + String.fromCharCode(input.title.charCodeAt(input.title.length - 1) + 1);
        q = query(q, where('title', '>=', input.title), where('title', '<', endTitle));
    } else if (input.author) {
      q = query(q, where('authors', 'array-contains', input.author));
    } else if (input.category) {
      q = query(q, where('categories', 'array-contains', input.category));
    } else if (input.tag) {
      q = query(q, where('tags', 'array-contains', input.tag));
    } else if (input.maxPrice) {
      q = query(q, where('price', '<=', input.maxPrice));
    } else if (input.city) {
      const endCity = input.city.slice(0, -1) + String.fromCharCode(input.city.charCodeAt(input.city.length - 1) + 1);
      q = query(q, where('libraryLocation', '>=', input.city), where('libraryLocation', '<', endCity));
    }

    q = query(q, limit(10)); // Limit results to 10 to keep responses concise.
    const querySnapshot = await getDocs(q);
    const books: z.infer<typeof BookSearchOutputSchema> = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Book;
      books.push({
        id: doc.id,
        title: data.title,
        authors: data.authors,
        price: data.price,
        libraryName: data.libraryName,
      });
    });
    
    return books;
  }
);

// Main Flow
const shoppingAssistantPrompt = ai.definePrompt({
    name: 'shoppingAssistantPrompt',
    tools: [findBooksInCatalog],
    system: `Eres Alicia, una asistente de compras amigable y experta para la tienda de libros 'Alicia Libros'.
    - Tu objetivo es ayudar a los usuarios a encontrar libros respondiendo a sus preguntas.
    - Utiliza la herramienta 'findBooksInCatalog' para buscar en la base de datos cuando el usuario pregunte sobre libros, precios, autores, disponibilidad o ubicación.
    - Sé concisa y conversacional.
    - Si encuentras libros, preséntalos en un formato claro de lista. Para cada libro, incluye el título, el autor, el precio y de qué librería es.
    - Si no encuentras resultados, informa amablemente al usuario y sugiérele probar con otros términos.
    - No inventes información que no puedas obtener con las herramientas.
    - Responde siempre en español.`,
    prompt: `{{{query}}}`
});

export async function askShoppingAssistant(userQuery: string): Promise<string> {
    const response = await shoppingAssistantPrompt({query: userQuery});
    const text = response?.text;

    if (text) {
        return text;
    }
    
    console.warn("Assistant response was empty or did not contain text.", response);
    return "Estoy procesando tu solicitud. Un momento...";
}
