// src/ai/flows/generate-content-studio.ts
'use server';
/**
 * @fileOverview AI flow for generating social media content (text and image) for authors.
 *
 * - generateContentStudio - A function that creates content based on a prompt and format.
 * - GenerateContentStudioInput - The input type for the function.
 * - GenerateContentStudioOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

const GenerateContentStudioInputSchema = z.object({
  prompt: z.string().describe('The author\'s high-level idea or goal for the post.'),
  platform: z.enum(['Instagram', 'TikTok', 'Facebook']).describe('The target social media platform.'),
  format: z.enum(['Post', 'Story', 'Reel']).describe('The desired content format.'),
});
export type GenerateContentStudioInput = z.infer<typeof GenerateContentStudioInputSchema>;

const GenerateContentStudioOutputSchema = z.object({
  text: z.string().describe('The generated text content for the social media post, including emojis and relevant hashtags.'),
  imageUrl: z.string().describe('A data URI of the generated image in PNG format.'),
  suggestedTime: z.string().describe('A suggested time to publish the content for maximum engagement.'),
});
export type GenerateContentStudioOutput = z.infer<typeof GenerateContentStudioOutputSchema>;

// Define a separate schema for the text generation prompt for clarity
const TextPromptInputSchema = GenerateContentStudioInputSchema.extend({
    imageDescription: z.string().describe("A brief, vivid description of the accompanying image, to ensure the text and image are coherent."),
});


const textGenerationPrompt = ai.definePrompt({
    name: "contentStudioTextPrompt",
    input: { schema: TextPromptInputSchema },
    prompt: `Eres un experto en marketing de redes sociales para autores. Tu tarea es generar el texto para una publicación en redes sociales.

**Instrucciones:**
1.  **Adapta el Tono:** El tono debe ser apropiado para la plataforma seleccionada ({{platform}}) y el formato ({{format}}).
2.  **Sé Creativo:** Usa el prompt del autor como inspiración, pero siéntete libre de proponer un ángulo creativo.
3.  **Coherencia Visual:** Asegúrate de que el texto complemente la imagen descrita a continuación.
4.  **Llamada a la Acción:** Incluye una llamada a la acción clara (ej. "¡Resérvalo ahora!", "¡Comenta tu opinión!", "¡Link en la bio!").
5.  **Hashtags y Emojis:** Usa emojis relevantes y de 3 a 5 hashtags populares y específicos.
6.  **Formato:** Para un Reel de TikTok/Instagram, el texto puede ser más corto o incluso un guion simple. Para un Post, puede ser más largo y descriptivo.

**Prompt del Autor:**
{{{prompt}}}

**Descripción de la Imagen Generada:**
{{{imageDescription}}}

Genera solo el texto para la publicación.`,
});

const imageGenerationPrompt = ai.definePrompt({
    name: "contentStudioImagePrompt",
    input: { schema: z.string() },
    prompt: `Genera una imagen cinematográfica, vibrante y de alta calidad basada en la siguiente descripción. La imagen debe ser visualmente impactante y adecuada para una campaña de marketing en redes sociales. Estilo: Fotorrealista, emocional, con iluminación dramática.

Descripción: {{{input}}}`,
});

export async function generateContentStudio(input: GenerateContentStudioInput): Promise<GenerateContentStudioOutput> {
  
  // 1. Generate Image First
  const imagePrompt = `Una imagen para un post de ${input.platform} en formato ${input.format}. Idea del autor: ${input.prompt}`;
  const { media } = await ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt: await imageGenerationPrompt(imagePrompt),
  });

  if (!media?.url) {
    throw new Error('La generación de la imagen falló.');
  }

  // 2. Generate a simple description of the image for the text prompt
  const descriptionResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Describe la siguiente imagen en una frase corta y vívida para un prompt de texto. Imagen: {{media url=imageUrl}}`,
      context: { imageUrl: media.url },
  });
  const imageDescription = descriptionResponse.text();

  // 3. Generate Text based on author prompt and image description
  const textResponse = await textGenerationPrompt({
    ...input,
    imageDescription: imageDescription,
  });

  // 4. Generate a suggested time
  const timeSuggestion = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Basado en la plataforma "${input.platform}" y el formato "${input.format}", sugiere una hora de publicación óptima (ej. "18:00 (hora local)"). Solo la hora.`,
  });

  return {
    text: textResponse.output() as string,
    imageUrl: media.url,
    suggestedTime: timeSuggestion.text(),
  };
}
