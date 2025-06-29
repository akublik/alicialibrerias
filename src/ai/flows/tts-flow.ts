
'use server';
/**
 * @fileOverview A Text-to-Speech (TTS) AI flow.
 *
 * - textToSpeech - A function that converts a string of text into speech audio.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

// Define the Zod schema for the output
const TextToSpeechOutputSchema = z.object({
  media: z.string().describe("A data URI of the generated audio in WAV format."),
});

// Export the TypeScript type inferred from the Zod schema
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;


export async function textToSpeech(text: string): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(text);
}

/**
 * Converts raw PCM audio data into a Base64-encoded WAV format string.
 * This is necessary because the Gemini TTS model returns raw audio data.
 * @param pcmData The raw PCM audio buffer from the TTS model.
 * @param channels The number of audio channels (default: 1).
 * @param rate The sample rate of the audio (default: 24000 for Gemini).
 * @param sampleWidth The width of each audio sample in bytes (default: 2).
 * @returns A promise that resolves to the Base64-encoded WAV string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: z.string(),
    outputSchema: TextToSpeechOutputSchema,
  },
  async (query) => {
    // The Gemini TTS model has an 8192 token limit.
    // Truncate the input to a safe character limit to avoid errors.
    const CHARACTER_LIMIT = 15000; 
    let textToProcess = query;
    if (query.length > CHARACTER_LIMIT) {
      textToProcess = query.substring(0, CHARACTER_LIMIT);
      console.log(`TTS input was too long (${query.length} chars) and has been truncated to ${CHARACTER_LIMIT} characters.`);
    }

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: textToProcess,
    });
    
    if (!media) {
      throw new Error('No audio media was returned from the AI model.');
    }
    
    // The model returns raw PCM data in a data URI. We need to extract it.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    // Convert the raw PCM data to a proper WAV format.
    const wavBase64 = await toWav(audioBuffer);
    
    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
