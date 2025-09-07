// src/ai/flows/generate-podcast-script.ts
'use server';
/**
 * @fileOverview AI flow for generating a short podcast script and audio about a book.
 *
 * - generatePodcastScript - A function that creates a podcast script and audio.
 * - GeneratePodcastScriptInput - The input type for the function.
 * - GeneratePodcastScriptOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { textToSpeech } from './tts-flow';

const GeneratePodcastScriptInputSchema = z.object({
  bookTitle: z.string().describe("The title of the book to feature."),
  bookContent: z.string().describe("The full content or a detailed summary of the book."),
  authorName: z.string().describe("The name of the book's author."),
  targetAudience: z.string().describe("The target audience for the book (e.g., 'young adults', 'history lovers')."),
  podcastTone: z.enum(['informativo', 'entusiasta', 'reflexivo']).describe("The desired tone for the podcast."),
});
export type GeneratePodcastScriptInput = z.infer<typeof GeneratePodcastScriptInputSchema>;

const GeneratePodcastScriptOutputSchema = z.object({
  title: z.string().describe("A catchy title for the podcast episode."),
  script: z.string().describe("The full script for the podcast episode, approximately 2-3 minutes long."),
  audioUrl: z.string().describe("A data URI for the generated audio of the podcast script."),
});
export type GeneratePodcastScriptOutput = z.infer<typeof GeneratePodcastScriptOutputSchema>;


// Define the Genkit Prompt for the script
const podcastScriptPrompt = ai.definePrompt({
    name: "podcastScriptPrompt",
    model: 'googleai/gemini-1.5-flash',
    input: { schema: GeneratePodcastScriptInputSchema },
    output: { schema: z.object({ title: z.string(), script: z.string() }) },
    prompt: `Eres un guionista y presentador de podcasts literarios. Tu tarea es crear un guion para un episodio corto (2-3 minutos) sobre el libro "{{bookTitle}}" del autor {{authorName}}, basándote en el contenido proporcionado.

**Instrucciones:**
1.  **Título del Episodio:** Crea un título atractivo y breve para el episodio.
2.  **Guion:** Escribe un guion completo que incluya:
    *   Una **introducción** musical y una bienvenida entusiasta.
    *   Un segmento sobre **el libro**: Usa el contenido proporcionado para explicar de qué trata, cuáles son sus temas principales y por qué es una lectura obligada.
    *   Un segmento sobre **el autor**: ¿Quién es {{authorName}}? ¿Cuál es su estilo?
    *   Una **conclusión** y llamada a la acción, invitando a los oyentes a comprar el libro.
3.  **Tono:** Adapta el guion al tono solicitado: **{{podcastTone}}**.
4.  **Público Objetivo:** Asegúrate de que el lenguaje y el contenido sean apropiado para el público objetivo: **{{targetAudience}}**.

**Contenido del Libro para el Análisis:**
---
{{{bookContent}}}
---

Genera solo el título y el guion en el formato JSON solicitado.`,
});

const generatePodcastScriptFlow = ai.defineFlow(
  {
    name: 'generatePodcastScriptFlow',
    inputSchema: GeneratePodcastScriptInputSchema,
    outputSchema: GeneratePodcastScriptOutputSchema,
  },
  async (input: GeneratePodcastScriptInput) => {
    // 1. Generate the script first
    const scriptResponse = await podcastScriptPrompt(input);
    
    // Robust validation: Ensure both title and script are present
    if (!scriptResponse.output?.script || !scriptResponse.output?.title) {
        let missing = [];
        if (!scriptResponse.output?.title) missing.push("título");
        if (!scriptResponse.output?.script) missing.push("guion");
        throw new Error(`La IA no pudo generar un ${missing.join(' y ')} válido para el podcast.`);
    }

    const { script, title } = scriptResponse.output;

    // 2. Generate the audio from the script
    let audioUrl: string | undefined;
    try {
        const audioResponse = await textToSpeech({ text: script, voice: 'Achernar' }); // Using a different voice for variety
        audioUrl = audioResponse.media;
    } catch (ttsError) {
        console.error("Podcast TTS generation failed:", ttsError);
        throw new Error("El guion se generó, pero falló la creación del audio. Inténtalo de nuevo.");
    }

    if (!audioUrl) {
        throw new Error("La generación del audio no produjo un resultado válido.");
    }

    return {
      title,
      script,
      audioUrl,
    };
  }
);


export async function generatePodcastScript(input: GeneratePodcastScriptInput): Promise<GeneratePodcastScriptOutput> {
  return generatePodcastScriptFlow(input);
}
