'use server';

/**
 * @fileOverview Generates a book description/synopsis using AI.
 *
 * - generateBookDescription - A function that generates a book description.
 * - GenerateBookDescriptionInput - The input type for the function.
 * - GenerateBookDescriptionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBookDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the book.'),
  author: z.string().describe('The author of the book.'),
});
export type GenerateBookDescriptionInput = z.infer<typeof GenerateBookDescriptionInputSchema>;

const GenerateBookDescriptionOutputSchema = z.object({
  description: z.string().describe('A compelling and engaging book description or synopsis, written in Spanish. It should be 2-3 paragraphs long.'),
});
export type GenerateBookDescriptionOutput = z.infer<typeof GenerateBookDescriptionOutputSchema>;

export async function generateBookDescription(input: GenerateBookDescriptionInput): Promise<GenerateBookDescriptionOutput> {
  return generateBookDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBookDescriptionPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: GenerateBookDescriptionInputSchema},
  output: {schema: GenerateBookDescriptionOutputSchema},
  prompt: `Eres un talentoso redactor de marketing y editor de libros. Tu tarea es escribir una descripción (sinopsis) atractiva y convincente para un libro, basándote en su título y autor.

La descripción debe ser:
- Escrita en español.
- Atractiva y que invite a la lectura.
- De 2 a 3 párrafos de longitud.
- No debe incluir spoilers importantes.

Detalles del libro:
- Título: {{{title}}}
- Autor: {{{author}}}

Genera únicamente el texto de la descripción.`,
});

const generateBookDescriptionFlow = ai.defineFlow(
  {
    name: 'generateBookDescriptionFlow',
    inputSchema: GenerateBookDescriptionInputSchema,
    outputSchema: GenerateBookDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
