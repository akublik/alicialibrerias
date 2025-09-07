// src/ai/flows/generate-video-from-image.ts
'use server';
/**
 * @fileOverview AI flow for generating a short video from an image.
 *
 * - generateVideoFromImage - Creates a video from a source image and a prompt.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';
import { MediaPart } from 'genkit';
import * as fs from 'fs';
import { Readable } from 'stream';

const GenerateVideoInputSchema = z.object({
  imageUrl: z.string().describe("A data URI of the source image."),
  prompt: z.string().describe('A text prompt to guide the video generation.'),
});

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe("A data URI of the generated MP4 video."),
});

export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;


async function downloadVideo(video: MediaPart): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('La clave de API de Gemini (GEMINI_API_KEY) no está configurada en el servidor.');
  }

  const fetch = (await import('node-fetch')).default;
  const videoDownloadUrl = `${video.media!.url}&key=${apiKey}`;

  const videoDownloadResponse = await fetch(videoDownloadUrl);

  if (!videoDownloadResponse || videoDownloadResponse.status !== 200 || !videoDownloadResponse.body) {
    const errorText = await videoDownloadResponse?.text();
    throw new Error(`Fallo al descargar el video. Estado: ${videoDownloadResponse?.status}. Detalles: ${errorText}`);
  }
  
  return videoDownloadResponse.buffer();
}


export async function generateVideoFromImage(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  let { operation } = await ai.generate({
    model: googleAI.model('veo-2.0-generate-001'),
    prompt: [
      { text: `Usando la imagen como referencia, anima una escena cinematográfica y sutil basada en la idea: "${input.prompt}".` },
      { media: { url: input.imageUrl, contentType: 'image/png' } },
    ],
    config: {
      durationSeconds: 5,
      aspectRatio: '16:9',
    },
  });

  if (!operation) {
    throw new Error('El modelo no devolvió una operación para la generación de video.');
  }

  // Poll for completion
  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    operation = await ai.checkOperation(operation);
  }

  if (operation.error) {
    throw new Error(`Fallo al generar el video: ${operation.error.message}`);
  }

  const videoPart = operation.output?.message?.content.find((p) => !!p.media && p.media.contentType === 'video/mp4');
  if (!videoPart || !videoPart.media) {
    throw new Error('No se encontró el video generado en la respuesta de la operación.');
  }
  
  const videoBuffer = await downloadVideo(videoPart);
  const videoDataUri = `data:video/mp4;base64,${videoBuffer.toString('base64')}`;

  return { videoUrl: videoDataUri };
}
