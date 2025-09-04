// src/ai/flows/market-analysis.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { MarketAnalysisInput, MarketAnalysisOutput } from '@/types';

const MarketAnalysisInputSchema = z.object({
  authorGenre: z.string().describe("El género principal en el que escribe el autor."),
  authorBookTitle: z.string().describe("El título del libro del autor que se usará como referencia."),
});

const MarketAnalysisOutputSchema = z.object({
  marketTrends: z.object({
    growingGenres: z.array(z.string()).describe("Lista de 3 a 5 géneros o subgéneros con potencial de crecimiento, relacionados al género del autor."),
    targetAudienceProfile: z.string().describe("Un perfil detallado del lector ideal para el género del autor, incluyendo demografía, intereses y hábitos de lectura."),
    averagePrice: z.string().describe("Un rango de precios promedio (ej. '$12.00 - $18.00 USD') para libros similares en el mercado."),
  }),
  competitorAnalysis: z.object({
    similarAuthors: z.array(z.string()).describe("Una lista de 3 a 5 autores contemporáneos que escriben en un estilo o género similar."),
    coverAnalysis: z.string().describe("Un análisis de las tendencias visuales en las portadas de los competidores (colores, tipografía, imaginería)."),
    descriptionAnalysis: z.string().describe("Un análisis de las estrategias utilizadas en las sinopsis y descripciones de los libros de la competencia (tono, 'ganchos', llamadas a la acción)."),
    marketingStrategies: z.string().describe("Estrategias de marketing comunes observadas en la competencia (ej. redes sociales, colaboraciones, tipo de contenido)."),
  }),
  aiSuggestions: z.object({
    toneAndStyle: z.string().describe("Sugerencias sobre cómo el autor puede diferenciar su tono y estilo de escritura para destacar."),
    targetAudienceDifferentiation: z.string().describe("Recomendaciones para encontrar un nicho de audiencia o un enfoque único que la competencia no esté cubriendo."),
    visualSuggestions: z.string().describe("Ideas creativas para el diseño de la portada y material visual que rompa con las tendencias dominantes."),
  }),
});

export async function analyzeMarketAndCompetition(input: MarketAnalysisInput): Promise<MarketAnalysisOutput> {
  const response = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    prompt: `Eres un analista de mercado editorial y estratega de marketing de clase mundial. Un autor necesita un análisis completo para posicionar su libro.

**Información del Autor:**
*   **Género Principal:** ${input.authorGenre}
*   **Título de Referencia:** ${input.authorBookTitle}

**Tu Tarea:**
Realiza un análisis exhaustivo del mercado y la competencia. Proporciona información accionable y estratégica. Responde únicamente en el formato JSON solicitado.

**1. Tendencias del Mercado:**
    *   **Géneros en Crecimiento:** Identifica de 3 a 5 subgéneros o nichos relacionados con "${input.authorGenre}" que estén ganando popularidad.
    *   **Perfil del Lector:** Describe detalladamente al lector típico de este género. ¿Qué edad tiene? ¿Qué otros intereses tiene? ¿Dónde consume contenido?
    *   **Precios Promedio:** Investiga y proporciona un rango de precios competitivo para un libro en este género.

**2. Análisis de la Competencia:**
    *   **Autores Similares:** Nombra de 3 a 5 autores exitosos que compitan en el mismo espacio.
    *   **Análisis de Portadas:** ¿Qué patrones visuales (colores, tipografías, imágenes) dominan las portadas de estos autores?
    *   **Análisis de Descripciones:** ¿Qué tono usan en sus sinopsis? ¿Qué "ganchos" utilizan para atraer lectores?
    *   **Estrategias de Marketing:** ¿Qué estrategias de marketing son comunes? (Ej: fuerte presencia en TikTok, colaboraciones con influencers, etc.)

**3. Sugerencias Estratégicas (IA):**
    *   **Tono y Estilo:** Basado en el análisis, ¿cómo puede el autor diferenciar su voz y estilo para no ser uno más del montón?
    *   **Diferenciación de Audiencia:** ¿Hay algún nicho o ángulo de audiencia que la competencia no esté explotando y que el autor podría capturar?
    *   **Sugerencias Visuales:** Propón 2-3 ideas creativas para una portada que destaque y sea memorable, rompiendo con lo convencional pero sin dejar de ser comercial.`,
    output: {
      schema: MarketAnalysisOutputSchema,
    },
  });

  const output = response.output;
  if (!output) {
    throw new Error("La IA no devolvió una respuesta válida.");
  }
  return output;
}
