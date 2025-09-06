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

// A simpler, more robust text generation prompt.
const textGenerationPrompt = ai.definePrompt({
    name: "contentStudioTextPrompt",
    model: 'googleai/gemini-1.5-flash',
    input: { schema: GenerateContentStudioInputSchema },
    output: { schema: z.object({ text: z.string(), suggestedTime: z.string() }) },
    prompt: `Eres un experto en marketing de redes sociales para autores. Tu tarea es generar el texto para una publicación en {{platform}} con formato {{format}}.

**Prompt del Autor:**
{{{prompt}}}

**Instrucciones:**
1.  **Texto del Post:** Escribe un texto atractivo y coherente. Incluye emojis relevantes y de 3 a 5 hashtags populares. Adapta el tono a la plataforma y formato.
2.  **Hora Sugerida:** Sugiere una hora de publicación óptima (ej. "18:00 (hora local)").

Genera solo el texto del post y la hora sugerida.`,
});

const reelScriptPrompt = ai.definePrompt({
    name: "reelScriptPrompt",
    model: 'googleai/gemini-1.5-flash',
    input: { schema: z.object({ postText: z.string() })},
    output: { schema: z.object({ script: z.string() }) },
    prompt: `Eres un guionista experto en crear contenido viral para Reels de TikTok e Instagram.

Basado en el siguiente texto de una publicación, crea un guion corto y dinámico para un Reel de 5 a 15 segundos. El guion debe ser solo el texto a narrar o mostrar en pantalla, de forma concisa y clara.

**Texto del Post:**
{{{postText}}}

Genera solo el texto del guion para la narración del Reel.`,
});


export async function generateContentStudio(input: GenerateContentStudioInput): Promise<GenerateContentStudioOutput> {
  
  // 1. Generate Image and Text/Time in Parallel
  const imagePromise = ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt: `Una imagen cinematográfica y atractiva para una publicación de autor. Idea del autor: "${input.prompt}". No incluyas texto en la imagen.`,
  });

  const textPromise = textGenerationPrompt(input);

  const [imageResponse, textResponse] = await Promise.all([imagePromise, textPromise]);
  
  const imageUrl = imageResponse.media?.url;
  if (!imageUrl) {
    throw new Error('La generación de la imagen falló.');
  }
  
  const generatedText = textResponse.output?.text;
  if (!generatedText) {
      throw new Error("La IA no pudo generar el texto para la publicación.");
  }
  
  const suggestedTime = textResponse.output?.suggestedTime || "19:00 (hora local)";


  // 2. If it's a Reel, generate script and audio based on the generated text
  let reelScript: string | undefined = undefined;
  let audioUrl: string | undefined = undefined;

  if (input.format === 'Reel') {
      const scriptResponse = await reelScriptPrompt({
          postText: generatedText,
      });
      reelScript = scriptResponse.output?.script;

      if (reelScript) {
          try {
              const audioResponse = await textToSpeech({ text: reelScript, voice: 'Achernar' });
              audioUrl = audioResponse.media;
          } catch (ttsError) {
              console.error("TTS generation failed:", ttsError);
              // Fail gracefully: we can still return the script without audio.
              audioUrl = undefined;
          }
      }
  }

  return {
    text: generatedText,
    imageUrl: imageUrl,
    suggestedTime: suggestedTime,
    reelScript,
    audioUrl,
  };
}
