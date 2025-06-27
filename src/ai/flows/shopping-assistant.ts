'use server';
/**
 * @fileOverview A shopping assistant AI agent that can query the book catalog and library directory.
 *
 * - askShoppingAssistant - A function that handles the conversation with the assistant.
 * - ChatMessage - The type for a single message in the conversation history.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {db} from '@/lib/firebase';
import {collection, query, where, getDocs, limit, type Query} from 'firebase/firestore';
import type {Book, Library} from '@/types';

// Tool 1: Find Books
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

const findBooksInCatalog = ai.defineTool(
  {
    name: 'findBooksInCatalog',
    description: 'Searches the book catalog based on various criteria like title, author, category, price, or city.',
    inputSchema: BookSearchInputSchema,
    outputSchema: BookSearchOutputSchema,
  },
  async (input) => {
    if (!db) throw new Error('Database not available.');
    const booksRef = collection(db, 'books');
    let q: Query = query(booksRef);

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

    q = query(q, limit(10));
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



// Tool 2: Find Libraries
const LibrarySearchInputSchema = z.object({
  city: z.string().describe('The city to search for libraries in.'),
});

const LibrarySearchResultSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
});
const LibrarySearchOutputSchema = z.array(LibrarySearchResultSchema);

const findLibrariesByCity = ai.defineTool(
  {
    name: 'findLibrariesByCity',
    description: 'Searches for libraries in a specific city.',
    inputSchema: LibrarySearchInputSchema,
    outputSchema: LibrarySearchOutputSchema,
  },
  async (input) => {
    if (!db) throw new Error('Database not available.');
    const librariesRef = collection(db, 'libraries');
    
    const q = query(
      librariesRef, 
      where('location', '>=', input.city),
      where('location', '<=', input.city + '\uf8ff'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const libraries: z.infer<typeof LibrarySearchOutputSchema> = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Library;
      if (data.isActive !== false) { // Only show active libraries
        libraries.push({ name: data.name, address: data.address });
      }
    });

    return libraries;
  }
);


// Define the message type for the chat history
export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

// Main Flow
export async function askShoppingAssistant(history: ChatMessage[]): Promise<string> {
    try {
        // Find the first user message, as the history must start with a user message.
        const firstUserIndex = history.findIndex(m => m && m.role === 'user');
        
        // If no user message is found, do not proceed.
        if (firstUserIndex === -1) {
             return "Por favor, hazme una pregunta para empezar.";
        }

        // Slice the history from the first user message and filter out any invalid messages.
        const validHistory = history
            .slice(firstUserIndex)
            .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string');

        // Convert to the format Genkit expects.
        const genkitHistory = validHistory.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            content: [{ text: msg.content }],
        }));
        
        const response = await ai.generate({
            model: 'googleai/gemini-2.5-flash-preview',
            tools: [findBooksInCatalog, findLibrariesByCity],
            history: genkitHistory,
            system: `Eres Alicia, una asistente de compras amigable y experta para la tienda de libros 'Alicia Libros'.
            - Tu objetivo es ayudar a los usuarios a encontrar libros y librerías.
            - Si el usuario pregunta por librerías en una ciudad, utiliza la herramienta 'findLibrariesByCity'.
            - Si el usuario pregunta por libros (por título, autor, género, etc.), utiliza la herramienta 'findBooksInCatalog'.
            - Si encuentras librerías, preséntalas en una lista clara con su nombre y dirección.
            - Si encuentras libros, preséntalos en un formato de lista claro, incluyendo título, autor, precio y de qué librería es.
            - Si una herramienta no devuelve resultados, informa amablemente al usuario.
            - Sé concisa, conversacional y responde siempre en español.
            - No inventes información que no puedas obtener con tus herramientas.
            - Usa el historial de la conversación para entender el contexto. Si un usuario dice "y en quito?" después de preguntar por librerías, asume que también está preguntando por librerías en Quito.`,
        });
        
        const text = response.text;
        
        // IMPORTANT: Always return a string to prevent breaking the chat history.
        if (text) {
            return text;
        }

        console.warn("Shopping assistant response did not contain text. This can happen when a tool is called. Full response:", JSON.stringify(response, null, 2));
        return "Alicia está pensando... parece que ha encontrado algo interesante pero no sabe cómo expresarlo. Intenta preguntarle de otra manera o revisa si tu consulta fue muy específica.";

    } catch (error: any) {
        console.error("----------- DETAILED AI SHOPPING ASSISTANT ERROR -----------");
        console.error("Flow: askShoppingAssistant");
        console.error("Timestamp:", new Date().toISOString());
        console.error("History from client:", JSON.stringify(history, null, 2));
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Error object:", JSON.stringify(error, null, 2));
        console.error("----------------------------------------------------------");
        
        if (error.message && error.message.includes('GOOGLE_API_KEY')) {
            return error.message;
        }

        return `Lo siento, he encontrado un error y no puedo procesar tu solicitud ahora mismo. Revisa la consola del servidor para ver los detalles técnicos. Mensaje: ${error.message}`;
    }
}
