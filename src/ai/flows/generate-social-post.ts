'use server';

/**
 * @fileOverview Generates a social media post for a book.
 *
 * - generateSocialPost - A function that generates a social media post.
 * - GenerateSocialPostInput - The input type for the function.
 * - GenerateSocialPostOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialPostInputSchema = z.object({
  title: z.string().describe('The title of the book.'),
  author: z.string().describe('The author of the book.'),
  description: z.string().optional().describe('A brief description or synopsis of the book.'),
  price: z.number().describe('The price of the book.'),
  libraryName: z.string().describe('The name of the bookstore selling the book.'),
});
export type GenerateSocialPostInput = z.infer<typeof GenerateSocialPostInputSchema>;

const GenerateSocialPostOutputSchema = z.object({
  postText: z.string().describe('The generated social media post text, including emojis and relevant hashtags. The tone should be engaging and persuasive. The text must be in Spanish.'),
});
export type GenerateSocialPostOutput = z.infer<typeof GenerateSocialPostOutputSchema>;

export async function generateSocialPost(input: GenerateSocialPostInput): Promise<GenerateSocialPostOutput> {
  return generateSocialPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialPostPrompt',
  model: 'googleai/gemini-2.5-flash-preview',
  input: {schema: GenerateSocialPostInputSchema},
  output: {schema: GenerateSocialPostOutputSchema},
  prompt: `Eres un experto en marketing digital y redes sociales para librerías. Tu tarea es crear una publicación atractiva en español para anunciar un libro.

La publicación debe ser:
- Entusiasta y persuasiva.
- Incluir emojis relevantes para hacerla visualmente atractiva.
- Mencionar el título, el autor y el precio del libro.
- Terminar con hashtags relevantes.

Aquí están los detalles del libro:
- Título: {{{title}}}
- Autor: {{{author}}}
- Descripción (úsala para inspirarte en el tono): {{{description}}}
- Precio: {{{price}}}
- Nombre de la Librería: {{{libraryName}}}

Genera solo el texto de la publicación.`,
});

const generateSocialPostFlow = ai.defineFlow(
  {
    name: 'generateSocialPostFlow',
    inputSchema: GenerateSocialPostInputSchema,
    outputSchema: GenerateSocialPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
