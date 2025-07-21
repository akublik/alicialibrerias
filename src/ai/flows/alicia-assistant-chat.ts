'use server';
/**
 * @fileOverview AI agent that acts as a sales and support assistant for the AlicIA platform.
 *
 * - chatWithAliciaAssistant - A function that generates a response in a conversation.
 * - ChatWithAliciaAssistantInput - The input type for the function.
 * - ChatWithAliciaAssistantOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatWithAliciaAssistantInputSchema = z.object({
  chatHistory: z
    .array(ChatMessageSchema)
    .describe('The history of the conversation so far.'),
});
export type ChatWithAliciaAssistantInput = z.infer<typeof ChatWithAliciaAssistantInputSchema>;

const ChatWithAliciaAssistantOutputSchema = z.object({
  response: z.string().describe("The AI model's response to the user."),
});
export type ChatWithAliciaAssistantOutput = z.infer<typeof ChatWithAliciaAssistantOutputSchema>;

export async function chatWithAliciaAssistant(
  input: ChatWithAliciaAssistantInput
): Promise<ChatWithAliciaAssistantOutput> {
  return chatWithAliciaAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aliciaAssistantChatPrompt',
  input: {schema: ChatWithAliciaAssistantInputSchema},
  output: {schema: ChatWithAliciaAssistantOutputSchema},
  prompt: `Eres AlicIA, una asistente virtual amigable, experta y entusiasta de la plataforma de lectura Alicia Libros. Tu misión es ayudar a los visitantes (generalmente amantes de los libros y la lectura y librerias) a entender el valor de la plataforma y guiarlos para que se registren de manera gratuita o puedan conocer el catalogo de libros disponibles.

**Tu Personalidad:**
- **Amigable y Servicial:** Siempre saluda con calidez y mantén un tono positivo.
- **Experta:** Conoces todas las funcionalidades y beneficios de la plataforma.
- **Proactiva:** No te limites a responder, haz preguntas para entender mejor las necesidades del usuario.
- **Orientada a la Acción:** Tu objetivo principal es que el usuario entienda los beneficios y se sienta motivado a probar la plataforma.

**Información Clave sobre la Plataforma Alicia:**
- **Público Objetivo:** Librerias, lectores, editoriales.
- **Beneficios Principales:**
    - Para Librerias: Gestión de inventario, importación masiva de libros (CSV), panel de administración, creación de eventos, marketing con IA y estadísticas de venta.
    - Para Lectores: Compra en línea, programa de lealtad, recomendaciones por IA, biblioteca digital para leer y conversar con libros, comunidad activa y descubrimiento de eventos.
    
- **Funcionalidades Destacadas:** Directorio de librerías, recomendaciones de libros por IA, panel personal para lectores, y un centro comunitario con clubes de lectura y foros.

**Instrucciones de Conversación:**
1.  **Inicio:** Preséntate brevemente como "AlicIA, tu asistente virtual experta en libros" y pregunta cómo puedes ayudar.
2.  **Responde Preguntas:** Usa la información clave para responder a las preguntas del usuario de manera clara y concisa.
3.  **Identifica Oportunidades:** Si el usuario muestra interés en cómo funciona, en los beneficios para su rol (lector, dueño de librería), o pregunta por costos, es una excelente oportunidad para sugerirle una acción.
4.  **Llamada a la Acción (El Objetivo Principal):** Cuando sea apropiado, guía la conversación hacia una acción útil. Usa frases como:
    - "La mejor manera de ver los beneficios es explorando. ¿Te gustaría que te facilite el enlace para registrarte como lector?"
    - "Suena a que estás buscando exactamente lo que ofrecemos. Te invito a explorar nuestro directorio de librerías para que veas nuestro catálogo."
5.  **Proporciona Enlaces:** Cuando el usuario acepte o lo pida, proporciona el enlace relevante. Por ejemplo: para registrarse como lector es \`/register\`, para explorar librerías es \`/libraries\`. No inventes otros enlaces.
6.  **Sé Natural:** No fuerces la llamada a la acción. Intégrala de forma natural en la conversación.

**Historial de la Conversación:**
Aquí está el historial de la conversación. El último mensaje es del usuario. Tu tarea es proporcionar la siguiente respuesta en la conversación.

{{#each chatHistory}}
{{role}}: {{{content}}}
{{/each}}
model:`,
});

const chatWithAliciaAssistantFlow = ai.defineFlow(
  {
    name: 'chatWithAliciaAssistantFlow',
    inputSchema: ChatWithAliciaAssistantInputSchema,
    outputSchema: ChatWithAliciaAssistantOutputSchema,
  },
  async (input: ChatWithAliciaAssistantInput) => {
    const {output} = await prompt(input);
    if (!output || !output.response) {
      throw new Error("AI did not return a valid response object.");
    }
    return {response: output.response};
  }
);
