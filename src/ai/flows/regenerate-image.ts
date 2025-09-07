// src/ai/flows/regenerate-image.ts
'use server';
/**
 * @fileOverview An AI flow for regenerating an image based on a prompt.
 *
 * - regenerateImage - Creates a new image for a social media post.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

const RegenerateImageInputSchema = z.object({
  prompt: z.string().describe("The user's original idea or prompt."),
});

const RegenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe("A data URI of the newly generated image in PNG format."),
});

export type RegenerateImageInput = z.infer<typeof RegenerateImageInputSchema>;
export type RegenerateImageOutput = z.infer<typeof RegenerateImageOutputSchema>;

export async function regenerateImage(input: RegenerateImageInput): Promise<RegenerateImageOutput> {
  const imageResponse = await ai.generate({
    model: googleAI.model('imagen-4.0-fast-generate-001'),
    prompt: `Una imagen cinematográfica y atractiva para una publicación de autor. Idea del autor: "${input.prompt}". No incluyas texto en la imagen. Genera una variación diferente a la anterior.`,
  });

  const imageUrl = imageResponse.media?.url;
  if (!imageUrl) {
    throw new Error('La regeneración de la imagen falló.');
  }

  return { imageUrl };
}
