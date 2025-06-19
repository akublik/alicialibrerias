'use server';

/**
 * @fileOverview Generates automatic tags for books based on their description.
 *
 * - generateAutomaticTags - A function that generates automatic tags for a book.
 * - GenerateAutomaticTagsInput - The input type for the generateAutomaticTags function.
 * - GenerateAutomaticTagsOutput - The return type for the generateAutomaticTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAutomaticTagsInputSchema = z.object({
  description: z.string().describe('The description of the book.'),
});
export type GenerateAutomaticTagsInput = z.infer<typeof GenerateAutomaticTagsInputSchema>;

const GenerateAutomaticTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of tags for the book.'),
});
export type GenerateAutomaticTagsOutput = z.infer<typeof GenerateAutomaticTagsOutputSchema>;

export async function generateAutomaticTags(input: GenerateAutomaticTagsInput): Promise<GenerateAutomaticTagsOutput> {
  return generateAutomaticTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAutomaticTagsPrompt',
  input: {schema: GenerateAutomaticTagsInputSchema},
  output: {schema: GenerateAutomaticTagsOutputSchema},
  prompt: `You are an expert librarian. Generate 5 relevant tags for the following book description:\n\nDescription: {{{description}}}`,
});

const generateAutomaticTagsFlow = ai.defineFlow(
  {
    name: 'generateAutomaticTagsFlow',
    inputSchema: GenerateAutomaticTagsInputSchema,
    outputSchema: GenerateAutomaticTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
