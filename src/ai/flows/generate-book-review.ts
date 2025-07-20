'use server';

/**
 * @fileOverview Generates a fictional but plausible book review.
 *
 * - generateBookReview - A function that generates a book review.
 * - GenerateBookReviewInput - The input type for the function.
 * - GenerateBookReviewOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateBookReviewInputSchema = z.object({
  title: z.string().describe('The title of the book.'),
  author: z.string().describe('The author of the book.'),
  description: z.string().optional().describe('A brief description or synopsis of the book.'),
});
export type GenerateBookReviewInput = z.infer<typeof GenerateBookReviewInputSchema>;

const GenerateBookReviewOutputSchema = z.object({
  userName: z.string().describe("Un nombre de usuario ficticio y creíble en español (ej. 'LectorApasionado', 'Ana G.', 'Carlos M.')."),
  rating: z.number().min(4).max(5).describe("Una calificación en estrellas para la reseña, entre 4 y 5."),
  reviewText: z.string().describe('El texto de la reseña. Debe ser positivo, atractivo y sonar como si lo hubiera escrito un lector real. No debe ser demasiado largo, entre 2 y 4 frases. El texto debe estar en español.'),
});
export type GenerateBookReviewOutput = z.infer<typeof GenerateBookReviewOutputSchema>;

export async function generateBookReview(input: GenerateBookReviewInput): Promise<GenerateBookReviewOutput> {
  const response = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    prompt: `Eres un generador de reseñas de libros. Tu tarea es crear una reseña de libro ficticia pero convincente para fines de marketing.

La reseña debe ser:
- Positiva y entusiasta.
- Escrita desde la perspectiva de un lector real.
- Breve y al grano (2-4 frases).
- Íntegramente en español.

Genera un nombre de usuario creíble, una calificación entre 4 y 5 estrellas, y el texto de la reseña basado en los siguientes detalles del libro:
- Título: ${input.title}
- Autor: ${input.author}
- Descripción: ${input.description || ''}

Genera solo la reseña, el nombre de usuario y la calificación.`,
    output: {
      schema: GenerateBookReviewOutputSchema,
    },
  });
  
  const output = response.output;
  if (!output) {
    throw new Error("AI did not return a valid response.");
  }
  return output;
}
