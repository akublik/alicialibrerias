
'use server';
/**
 * @fileOverview AI agent that converses as "AlicIA" about a book.
 *
 * - converseWithBook - A function that handles the conversation.
 * - ChatMessage - The type for a single message in the conversation history.
 */

import { ai } from '@/ai/genkit';

// Define the message type for the chat history, matching the shopping assistant
export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

export async function converseWithBook(bookTitle: string, history: ChatMessage[]): Promise<string> {
    let genkitHistory: any[] = [];
    try {
        const systemPrompt = `A partir de ahora, actúa como si fueras AlicIA, una asistente de lectura experta en el libro "${bookTitle}". Responde a mis preguntas y comentarios usando tu conocimiento sobre ese libro. Si te hago preguntas que se salgan del contexto o del enfoque del libro, rechaza la solicitud indicando que solo puedes interactuar como una asistente para ese libro.`;
        
        // Step 1: Filter out any invalid or empty messages to prevent errors.
        const validHistory = history.filter(
            (msg) => msg && typeof msg.role === 'string' && typeof msg.content === 'string'
        );

        // Step 2: Find the index of the first message from the 'user'.
        // Genkit requires the conversation history to start with a user message.
        const firstUserIndex = validHistory.findIndex((msg) => msg.role === 'user');

        // Step 3: If no user message is found, there's nothing to process.
        if (firstUserIndex === -1) {
            genkitHistory = [];
        } else {
            // Step 4: Create the final history for Genkit, starting from the first user message.
            // Map 'assistant' role to 'model' as required by Genkit.
            genkitHistory = validHistory.slice(firstUserIndex).map((msg) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                content: [{ text: msg.content }],
            }));
        }

        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: systemPrompt,
            history: genkitHistory,
        });

        const text = response.text;

        if (text) {
          return text;
        }

        console.warn("Assistant response was empty or did not contain text.", JSON.stringify(response, null, 2));
        return "La IA respondió, pero el contenido estaba vacío. Revisa la consola del servidor para ver la respuesta completa de la IA.";

    } catch (error: any) {
        console.error("----------- DETAILED AI CHAT ERROR -----------");
        console.error("Flow: converseWithBook");
        console.error("Timestamp:", new Date().toISOString());
        console.error("Input bookTitle:", bookTitle);
        console.error("Original history from client:", JSON.stringify(history, null, 2));
        console.error("Processed history for Genkit:", JSON.stringify(genkitHistory, null, 2));
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Error object:", JSON.stringify(error, null, 2));
        console.error("----------------------------------------------");

        if (error.message && error.message.includes('GOOGLE_API_KEY')) {
            return error.message;
        }
        
        return `Lo siento, he encontrado un error y no puedo procesar tu solicitud ahora mismo. Revisa la consola del servidor para ver los detalles técnicos. Mensaje: ${error.message}`;
    }
}
