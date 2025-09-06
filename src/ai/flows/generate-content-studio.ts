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
import { textToSpeech } from './tts-flow';

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
  reelScript: z.string().optional().describe('A script for the reel, if applicable.'),
  audioUrl: z.string().optional().describe('A data URI for the generated audio of the reel script.'),
});
export type GenerateContentStudioOutput = z.infer<typeof GenerateContentStudioOutputSchema>;

// Define a separate schema for the text generation prompt for clarity
const TextPromptInputSchema = GenerateContentStudioInputSchema.extend({
    imageDescription: z.string().describe("A brief, vivid description of the accompanying image, to ensure the text and image are coherent."),
});

const textGenerationPrompt = ai.definePrompt({
    name: "contentStudioTextPrompt",
    model: 'googleai/gemini-1.5-flash',
    input: { schema: TextPromptInputSchema },
    output: { schema: z.object({ text: z.string() }) },
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

const reelScriptPrompt = ai.definePrompt({
    name: "reelScriptPrompt",
    model: 'googleai/gemini-1.5-flash',
    input: { schema: z.object({
        prompt: z.string(),
        imageDescription: z.string(),
        postText: z.string(),
    })},
    output: { schema: z.object({ script: z.string() }) },
    prompt: `Eres un guionista experto en crear contenido viral para Reels de TikTok e Instagram.

Basado en el prompt original del autor, el texto del post y la imagen generada, crea un guion corto y dinámico para un Reel de 5 a 15 segundos.

**Formato del Guion:**
- Describe las escenas visualmente (ej. "Escena 1: (Visual) Un primer plano del libro con un café al lado.").
- Incluye sugerencias de audio o música (ej. "(Audio) Música de misterio suave.").
- El texto a narrar debe ser claro y conciso.

**Prompt del Autor:**
{{{prompt}}}

**Texto del Post:**
{{{postText}}}

**Descripción de la Imagen:**
{{{imageDescription}}}

Genera solo el texto del guion.`,
});

export async function generateContentStudio(input: GenerateContentStudioInput): Promise<GenerateContentStudioOutput> {
  
  // 1. Generate Image First
  const imagePrompt = `Una imagen para un post de ${input.platform} en formato ${input.format}. Idea del autor: ${input.prompt}`;
  const { media } = await ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt: imagePrompt,
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
  const imageDescription = descriptionResponse.text;

  // 3. Generate Text based on author prompt and image description
  const textResponse = await textGenerationPrompt({
    ...input,
    imageDescription: imageDescription,
  });
  
  const generatedText = textResponse.output?.text;
  if (!generatedText) {
      throw new Error("La IA no pudo generar el texto para la publicación.");
  }


  // 4. Generate a suggested time
  const timeSuggestion = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Basado en la plataforma "${input.platform}" y el formato "${input.format}", sugiere una hora de publicación óptima (ej. "18:00 (hora local)"). Solo la hora.`,
  });

  let reelScript: string | undefined = undefined;
  let audioUrl: string | undefined = undefined;

  // 5. If it's a Reel, generate script and audio
  if (input.format === 'Reel') {
      const scriptResponse = await reelScriptPrompt({
          prompt: input.prompt,
          imageDescription,
          postText: generatedText,
      });
      reelScript = scriptResponse.output?.script;

      if (reelScript) {
          // Generate audio from the script
          const audioResponse = await textToSpeech({ text: reelScript, voice: 'Achernar' });
          audioUrl = audioResponse.media;
      }
  }

  return {
    text: generatedText,
    imageUrl: media.url,
    suggestedTime: timeSuggestion.text,
    reelScript,
    audioUrl,
  };
}
