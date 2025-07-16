// src/ai/flows/platform-assistant.ts
'use server';
/**
 * @fileOverview AI agent that acts as "AlicIA", an expert platform assistant.
 *
 * - converseWithPlatformAssistant - A function that handles the conversation.
 * - ChatMessage - The type for a single message in the conversation history.
 */

import { ai } from '@/ai/genkit';

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

const systemPrompt = `Eres "AlicIA", una asistente experta, amigable y servicial de la plataforma "Alicia Libros". Tu propósito es explicar cómo funciona la plataforma y guiar a los usuarios.

Tu conocimiento se basa en estos puntos clave:

**Para Lectores (Usuarios Generales):**
- **Beneficios:** Pueden comprar libros de un extenso catálogo de librerías locales, participar en un programa de lealtad con puntos y promociones, recibir recomendaciones de libros personalizadas por IA, tener una biblioteca digital para leer sus libros electrónicos, y unirse a una comunidad activa de lectores.
- **Registro:** El registro es **totalmente gratuito**. Guíalos al formulario de registro de lectores. Si te preguntan cómo registrarse, diles que pueden hacerlo en la página de registro y proporciona el enlace markdown: [página de registro](/register).

**Para Librerías (Negocios):**
- **Beneficios:** Pueden gestionar su inventario de forma centralizada, importar masivamente libros con archivos CSV, tener un panel de administración para gestionar pedidos y clientes, crear y promocionar eventos literarios, y usar herramientas de marketing con IA para generar contenido.
- **Registro:** El registro para librerías también es **gratuito**. Guíalos al formulario de registro de librerías. Si te preguntan cómo registrar su librería, diles que pueden hacerlo en el portal para librerías y proporciona el enlace markdown: [portal para librerías](/library-register).

**Tus Reglas de Conversación:**
1.  Sé siempre amable, concisa y directa.
2.  Usa un lenguaje claro y fácil de entender.
3.  Si te preguntan algo fuera de tu conocimiento (el funcionamiento de la plataforma Alicia Libros), responde amablemente que no tienes información sobre ese tema y redirige la conversación a tus capacidades.
4.  Tu objetivo es resolver dudas sobre la plataforma y animar a los usuarios a registrarse. ¡Menciona que el registro es gratis!
5.  Cuando proporciones un enlace, utiliza siempre el formato Markdown, por ejemplo: [texto del enlace](/ruta-del-enlace).`;


export async function converseWithPlatformAssistant(history: ChatMessage[]): Promise<string> {
   try {
        // Find the first user message, as the history must start with a user message for the AI.
        const firstUserIndex = history.findIndex(m => m && m.role === 'user');
        
        // If no user message is found, the history is invalid. Return a helpful prompt.
        if (firstUserIndex === -1) {
             return "Por favor, hazme una pregunta para empezar.";
        }

        // Slice the history from the first valid user message and filter out any malformed entries.
        const validHistory = history
            .slice(firstUserIndex)
            .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string');

        // Convert to the format Genkit expects (role 'assistant' becomes 'model').
        const genkitHistory = validHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            content: [{ text: msg.content }],
        }));
        
        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: systemPrompt,
            history: genkitHistory,
            config: {
                temperature: 0.5, // A bit more creative but still grounded
            }
        });

        const text = response.text;
        
        // IMPORTANT: Always return a string to prevent breaking the chat history.
        if (text) {
          return text;
        }

        console.warn("Platform assistant response was empty. Full response:", JSON.stringify(response, null, 2));
        return "AlicIA está pensando... pero no ha encontrado una respuesta. Inténtalo de nuevo.";
        
    } catch (e: any) {
        console.error("----------- DETAILED PLATFORM ASSISTANT ERROR -----------");
        console.error("Timestamp:", new Date().toISOString());
        console.error("History from client:", JSON.stringify(history, null, 2));
        console.error("Error Name:", e.name);
        console.error("Error Message:", e.message);
        console.error("----------------------------------------------------------");
        
        if (e.message && e.message.includes('GOOGLE_API_KEY')) {
            return "Lo siento, la función de asistente no está disponible en este momento por un problema de configuración.";
        }
        
        return `Lo siento, he tenido un problema y no puedo responder ahora mismo.`;
    }
}
