// src/ai/flows/book-recommendations.ts
'use server';
/**
 * @fileOverview AI agent that provides personalized book recommendations based on user reading history and preferences.
 *
 * - getBookRecommendations - A function that retrieves book recommendations for a user.
 * - BookRecommendationsInput - The input type for the getBookRecommendations function.
 * - BookRecommendationsOutput - The return type for the getBookRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BookRecommendationsInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom to generate recommendations.'),
  readingHistory: z.array(z.string()).describe('An array of book titles the user has read.'),
  preferences: z.string().describe('The user\u2019s stated preferences, such as preferred genres or authors.'),
});
export type BookRecommendationsInput = z.infer<typeof BookRecommendationsInputSchema>;

const BookRecommendationsOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('An array of book titles recommended for the user.'),
});
export type BookRecommendationsOutput = z.infer<typeof BookRecommendationsOutputSchema>;

export async function getBookRecommendations(input: BookRecommendationsInput): Promise<BookRecommendationsOutput> {
  return bookRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'bookRecommendationsPrompt',
  input: {schema: BookRecommendationsInputSchema},
  output: {schema: BookRecommendationsOutputSchema},
  prompt: `You are a book recommendation expert. Given a user's reading history and preferences, you will provide a list of book recommendations.

Reading History: {{readingHistory}}
Preferences: {{preferences}}

Please provide a list of book recommendations that the user might enjoy. Return only the book titles.`, 
});

const bookRecommendationsFlow = ai.defineFlow(
  {
    name: 'bookRecommendationsFlow',
    inputSchema: BookRecommendationsInputSchema,
    outputSchema: BookRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
