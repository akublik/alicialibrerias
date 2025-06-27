
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
    let genkitHistory;
    try {
        const systemPrompt = `A partir de ahora, actúa como si fueras AlicIA, una asistente de lectura experta en el libro "${bookTitle}". Responde a mis preguntas y comentarios usando tu conocimiento sobre ese libro. Si te hago preguntas que se salgan del contexto o del enfoque del libro, rechaza la solicitud indicando que solo puedes interactuar como una asistente para ese libro.`;
        
        // --- START OF NEW ROBUST HISTORY PROCESSING ---
        // 1. Sanitize the entire history array first to remove any invalid entries.
        const sanitizedHistory = Array.isArray(history) 
            ? history.filter(msg => msg && typeof msg.role === 'string' && typeof msg.content === 'string') 
            : [];

        // 2. Find the first user message in the sanitized history. Genkit requires history to start with a 'user' role.
        const firstUserIndex = sanitizedHistory.findIndex(msg => msg.role === 'user');

        // 3. Slice the array from the first user message onwards. If no user message, history is empty.
        const historyToSend = firstUserIndex !== -1 ? sanitizedHistory.slice(firstUserIndex) : [];

        // 4. Map the valid, sliced history to the format Genkit expects.
        genkitHistory = historyToSend.map(msg => ({
            role: msg.role === 'user' ? ('user' as const) : ('model' as const),
            content: [{ text: msg.content }],
        }));
        // --- END OF NEW ROBUST HISTORY PROCESSING ---

        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: systemPrompt,
            history: genkitHistory,
        });

        const text = response.text;

        if (!text) {
          console.warn("Assistant response was empty or did not contain text.", JSON.stringify(response, null, 2));
          return "La IA respondió, pero el contenido estaba vacío. Revisa la consola del servidor para ver la respuesta completa de la IA.";
        }
        return text;

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
