// src/ai/flows/generate-marketing-plan.ts
'use server';
/**
 * @fileOverview AI flow for generating a book marketing plan.
 *
 * - generateMarketingPlan - A function that creates a marketing plan based on book details.
 * - GenerateMarketingPlanInput - The input type for the function.
 * - GenerateMarketingPlanOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AuthorProfileSchema = z.object({
  bio: z.string().optional().describe("La biografía del autor."),
  website: z.string().url().optional().describe("El sitio web del autor."),
  instagram: z.string().url().optional(),
  facebook: z.string().url().optional(),
  x: z.string().url().optional(),
  tiktok: z.string().url().optional(),
  youtube: z.string().url().optional(),
});

const GenerateMarketingPlanInputSchema = z.object({
  title: z.string().describe('El título del libro.'),
  author: z.string().describe('El autor del libro.'),
  synopsis: z.string().describe('La sinopsis o resumen del libro.'),
  targetAudience: z.string().describe('Una descripción del público objetivo del libro.'),
  authorProfile: AuthorProfileSchema.optional().describe("El perfil del autor, incluyendo biografía y redes sociales."),
});
export type GenerateMarketingPlanInput = z.infer<typeof GenerateMarketingPlanInputSchema>;

const GenerateMarketingPlanOutputSchema = z.object({
  slogan: z.string().describe('Un eslogan o tagline corto y atractivo para el libro.'),
  targetAudienceAnalysis: z.string().describe('Un análisis breve del público objetivo, incluyendo dónde encontrarlos y qué les interesa.'),
  socialMediaPosts: z.array(z.string()).length(3).describe('Tres ejemplos de publicaciones para redes sociales (Instagram/Facebook/X) para promocionar el libro. Deben ser atractivos, usar emojis y hashtags relevantes.'),
  launchStrategies: z.array(z.string()).length(3).describe('Tres estrategias de lanzamiento concretas y creativas para el libro.'),
});
export type GenerateMarketingPlanOutput = z.infer<typeof GenerateMarketingPlanOutputSchema>;

export async function generateMarketingPlan(input: GenerateMarketingPlanInput): Promise<GenerateMarketingPlanOutput> {
  const response = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    prompt: `Eres un experto en marketing editorial. Un autor necesita ayuda para lanzar su nuevo libro. Basado en la información proporcionada, crea un plan de marketing conciso y efectivo.

**Detalles del Libro:**
*   **Título:** ${input.title}
*   **Autor:** ${input.author}
*   **Sinopsis:** ${input.synopsis}
*   **Público Objetivo:** ${input.targetAudience}

{{#if authorProfile}}
**Perfil del Autor:**
*   **Biografía:** ${input.authorProfile.bio || 'No proporcionada'}
*   **Sitio Web:** ${input.authorProfile.website || 'No proporcionado'}
*   **Redes Sociales:** {{#if authorProfile.instagram}}Instagram: ${input.authorProfile.instagram} {{/if}}{{#if authorProfile.facebook}}Facebook: ${input.authorProfile.facebook} {{/if}}{{#if authorProfile.x}}X: ${input.authorProfile.x} {{/if}}{{#if authorProfile.tiktok}}TikTok: ${input.authorProfile.tiktok} {{/if}}{{#if authorProfile.youtube}}YouTube: ${input.authorProfile.youtube}{{/if}}
{{/if}}

**Tu Tarea:**
Genera un plan de marketing que incluya un eslogan, un análisis del público, tres ejemplos de publicaciones para redes sociales (mencionando las redes del autor si están disponibles) y tres estrategias de lanzamiento. Responde únicamente en el formato JSON solicitado.`,
    output: {
      schema: GenerateMarketingPlanOutputSchema,
    },
  });

  const output = response.output;
  if (!output) {
    throw new Error("La IA no devolvió una respuesta válida.");
  }
  return output;
}
