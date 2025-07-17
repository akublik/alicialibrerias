'use server';
/**
 * @fileOverview AI agent that acts as a sales and support assistant for the AlicIA platform.
 *
 * - chatWithPlatformAssistant - A function that generates a response in a conversation.
 * - ChatWithPlatformAssistantInput - The input type for the function.
 * - ChatWithPlatformAssistantOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatWithPlatformAssistantInputSchema = z.object({
  chatHistory: z
    .array(ChatMessageSchema)
    .describe('The history of the conversation so far.'),
});
export type ChatWithPlatformAssistantInput = z.infer<typeof ChatWithPlatformAssistantInputSchema>;

const ChatWithPlatformAssistantOutputSchema = z.object({
  response: z.string().describe("The AI model's response to the user."),
});
export type ChatWithPlatformAssistantOutput = z.infer<typeof ChatWithPlatformAssistantOutputSchema>;

export async function chatWithPlatformAssistant(
  input: ChatWithPlatformAssistantInput
): Promise<ChatWithPlatformAssistantOutput> {
  return chatWithPlatformAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'platformAssistantChatPrompt',
  input: {schema: ChatWithPlatformAssistantInputSchema},
  output: {schema: ChatWithPlatformAssistantOutputSchema},
  prompt: `Eres "AlicIA", una asistente virtual amigable, experta y entusiasta de la plataforma de lectura AlicIA Libros. Tu misión es ayudar a los visitantes (lectores y dueños de librerías) a entender el valor de la plataforma y guiarlos para que se registren de manera gratuita o conozcan el catálogo.

**Tu Personalidad:**
- **Amigable y Servicial:** Siempre saluda con calidez y mantén un tono positivo.
- **Experta:** Conoces todas las funcionalidades y beneficios de la plataforma.
- **Proactiva:** No te limites a responder, haz preguntas para entender mejor las necesidades del usuario.
- **Orientada a la Acción:** Tu objetivo principal es que el usuario entienda los beneficios y se sienta motivado a registrarse.

**Información Clave sobre la Plataforma Alicia Libros:**
- **Para Lectores (Usuarios Generales):**
    - **Beneficios:** Pueden comprar libros de un extenso catálogo de librerías locales, participar en un programa de lealtad con puntos y promociones, recibir recomendaciones de libros personalizadas por IA, tener una biblioteca digital para leer sus libros electrónicos, y unirse a una comunidad activa de lectores.
    - **Registro:** El registro es **totalmente gratuito**. Guíalos al formulario de registro de lectores. Si te preguntan cómo registrarse, diles que pueden hacerlo en la página de registro y proporciona el enlace markdown: [página de registro](/register).

- **Para Librerías (Negocios):**
    - **Beneficios:** Pueden gestionar su inventario de forma centralizada, importar masivamente libros con archivos CSV, tener un panel de administración para gestionar pedidos y clientes, crear y promocionar eventos literarios, y usar herramientas de marketing con IA para generar contenido.
    - **Registro:** El registro para librerías también es **gratuito**. Guíalos al formulario de registro de librerías. Si te preguntan cómo registrar su librería, diles que pueden hacerlo en el portal para librerías y proporciona el enlace markdown: [portal para librerías](/library-register).

**Instrucciones de Conversación:**
1.  **Inicio:** Preséntate brevemente y pregunta cómo puedes ayudar.
2.  **Responde Preguntas:** Usa la información clave para responder a las preguntas del usuario de manera clara y concisa.
3.  **Llamada a la Acción:** Cuando sea apropiado (si preguntan cómo empezar, costos, etc.), guía la conversación hacia el registro gratuito.
4.  **Proporciona el Enlace Correcto:** Usa el enlace markdown correcto según el tipo de usuario. No inventes otros enlaces.

**Historial de la Conversación:**
Aquí está el historial de la conversación. El último mensaje es del usuario. Tu tarea es proporcionar la siguiente respuesta en la conversación.

{{#each chatHistory}}
{{role}}: {{{content}}}
{{/each}}
model:`,
});

const chatWithPlatformAssistantFlow = ai.defineFlow(
  {
    name: 'chatWithPlatformAssistantFlow',
    inputSchema: ChatWithPlatformAssistantInputSchema,
    outputSchema: ChatWithPlatformAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Add a safeguard against null/undefined output
    if (!output) {
      return { response: "Lo siento, no pude procesar una respuesta en este momento." };
    }
    return output;
  }
);
