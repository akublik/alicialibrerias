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
  rationale: z.string().describe('A short, compelling reason why this book is recommended for the user.'),
});

const BookRecommendationsOutputSchema = z.object({
  foundInInventory: z.array(FoundBookSchema).describe('Books found in our current inventory that match the request.'),
  newSuggestions: z.array(NewSuggestionSchema).describe('New book suggestions that are not in our inventory but fit the user profile.'),
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
  prompt: `You are a world-class librarian and book recommendation expert.
A user has provided their reading history and preferences. You have also been given a JSON string representing our current book inventory.

Your task is to provide two sets of recommendations:
1.  **foundInInventory**: Search through the provided inventory JSON. Find up to 3 books that are the best match for the user's request. For each book you find, return only its 'id' and 'title' from the inventory data. Do not invent books for this list.
2.  **newSuggestions**: Generate a list of 3-5 NEW book suggestions that are NOT in the provided inventory but would be an excellent fit for the user. For each new suggestion, provide a title, an author, and a short, compelling 'rationale' explaining why the user would enjoy it.

User Preferences:
- Reading History: {{readingHistory}}
- Stated Preferences: {{preferences}}

Current Book Inventory (JSON):
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
