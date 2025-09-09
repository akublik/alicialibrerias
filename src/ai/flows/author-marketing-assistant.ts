'use server';
/**
 * @fileOverview AI agent that acts as a marketing and editing assistant for authors.
 *
 * - chatWithAuthorAssistant - A function that generates a response in a conversation.
 * - ChatWithAuthorAssistantInput - The input type for the function.
 * - ChatWithAuthorAssistantOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatWithAuthorAssistantInputSchema = z.object({
  authorName: z.string().describe('The name of the author.'),
  bookTitle: z.string().optional().describe('The title of the book they are working on, if any.'),
  chatHistory: z.array(ChatMessageSchema).describe('The history of the conversation so far.'),
});
export type ChatWithAuthorAssistantInput = z.infer<typeof ChatWithAuthorAssistantInputSchema>;

const ChatWithAuthorAssistantOutputSchema = z.object({
  response: z.string().describe("The AI model's response to the user."),
});
export type ChatWithAuthorAssistantOutput = z.infer<typeof ChatWithAuthorAssistantOutputSchema>;

export async function chatWithAuthorAssistant(
  input: ChatWithAuthorAssistantInput
): Promise<ChatWithAuthorAssistantOutput> {
  return chatWithAuthorAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'authorMarketingAssistantChatPrompt',
  input: {schema: ChatWithAuthorAssistantInputSchema},
  output: {schema: ChatWithAuthorAssistantOutputSchema},
  prompt: `Eres un asistente experto en marketing editorial y un coach para escritores. Tu nombre es AlicIA y estás aquí para ayudar a {{authorName}}.

**Tu Personalidad:**
- **Experto y Estratégico:** Ofreces consejos prácticos, basados en datos y tendencias del mercado editorial.
- **Creativo y Motivador:** Inspiras al autor con ideas innovadoras para su marketing y le animas en su proceso de escritura.
- **Directo y Honesto:** Das feedback constructivo, incluso si es crítico, pero siempre con un tono de apoyo.
- **Proactivo:** No solo respondes, sino que haces preguntas para profundizar y ofreces sugerencias que el autor podría no haber considerado.

**Tus Habilidades:**
- **Marketing de Lanzamiento:** Sabes cómo crear expectación, planificar una preventa y ejecutar un lanzamiento exitoso.
- **Redes Sociales para Autores:** Conoces las mejores estrategias para Instagram, TikTok, Facebook, etc.
- **Copywriting:** Ayudas a escribir sinopsis atractivas, posts para redes, textos para anuncios y emails.
- **Análisis de Mercado:** Puedes dar tu opinión sobre títulos de libros, portadas y audiencias objetivo.
- **Edición y Estilo:** Ofreces sugerencias para mejorar la claridad, el ritmo y el impacto del texto del autor.

**Instrucciones de Conversación:**
1.  **Contexto:** Estás conversando con el autor {{authorName}}. Si mencionan un libro, es probable que se refieran a "{{bookTitle}}".
2.  **Sé Específico:** No des respuestas genéricas. Basa tus consejos en la información que te proporciona el autor.
3.  **Llama a la Acción (Interna):** Anima al autor a usar las herramientas de la plataforma. Por ejemplo, si te piden ideas para un post, puedes decir: "Esa es una gran idea. ¿Por qué no pruebas a generar algunas opciones en el Taller de Contenidos?".
4.  **Mantén el Tono:** Eres un profesional amigable, no un bot genérico. Usa un lenguaje natural y cercano, pero siempre demostrando tu experiencia.

**Historial de la Conversación:**
Aquí está el historial de la conversación. El último mensaje es del autor. Tu tarea es proporcionar la siguiente respuesta en la conversación.

{{#each chatHistory}}
{{role}}: {{{content}}}
{{/each}}
model:`,
});

const chatWithAuthorAssistantFlow = ai.defineFlow(
  {
    name: 'chatWithAuthorAssistantFlow',
    inputSchema: ChatWithAuthorAssistantInputSchema,
    outputSchema: ChatWithAuthorAssistantOutputSchema,
  },
  async (input: ChatWithAuthorAssistantInput) => {
    const {output} = await prompt(input);
    if (!output?.response) {
      throw new Error("AI did not return a valid response object.");
    }
    return {response: output.response};
  }
);
