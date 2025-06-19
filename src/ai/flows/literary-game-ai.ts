'use server';
/**
 * @fileOverview Literary game AI flow for generating engaging and interactive literary experiences.
 *
 * - literaryGamesAI - A function that generates literary games enhanced with AI.
 * - LiteraryGamesAIInput - The input type for the literaryGamesAI function.
 * - LiteraryGamesAIOutput - The return type for the literaryGamesAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LiteraryGamesAIInputSchema = z.object({
  gameType: z.string().describe('The type of literary game to generate.'),
  theme: z.string().describe('The theme of the literary game.'),
  complexity: z.string().describe('The complexity level of the game (e.g., easy, medium, hard).'),
});
export type LiteraryGamesAIInput = z.infer<typeof LiteraryGamesAIInputSchema>;

const LiteraryGamesAIOutputSchema = z.object({
  gameTitle: z.string().describe('The title of the generated literary game.'),
  gameDescription: z.string().describe('A description of the literary game, including rules and objectives.'),
  gameInstructions: z.string().describe('Step-by-step instructions on how to play the game.'),
});
export type LiteraryGamesAIOutput = z.infer<typeof LiteraryGamesAIOutputSchema>;

export async function literaryGamesAI(input: LiteraryGamesAIInput): Promise<LiteraryGamesAIOutput> {
  return literaryGamesAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'literaryGamesAIPrompt',
  input: {schema: LiteraryGamesAIInputSchema},
  output: {schema: LiteraryGamesAIOutputSchema},
  prompt: `You are a literary game designer. Generate a literary game based on the following criteria:

Game Type: {{{gameType}}}
Theme: {{{theme}}}
Complexity: {{{complexity}}}

Provide the game title, a description of the game including rules and objectives, and step-by-step instructions on how to play the game.`,
});

const literaryGamesAIFlow = ai.defineFlow(
  {
    name: 'literaryGamesAIFlow',
    inputSchema: LiteraryGamesAIInputSchema,
    outputSchema: LiteraryGamesAIOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
