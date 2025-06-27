
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
    console.log("converseWithBook received raw history:", JSON.stringify(history, null, 2));
    
    let genkitHistory: any[] = [];
    try {
        const systemPrompt = `A partir de ahora, actúa como si fueras AlicIA, una asistente de lectura experta en el libro "${bookTitle}". Responde a mis preguntas y comentarios usando tu conocimiento sobre ese libro. Si te hago preguntas que se salgan del contexto o del enfoque del libro, rechaza la solicitud indicando que solo puedes interactuar como una asistente para ese libro.`;
        
        const validHistory = history.filter(
            (msg) => msg && typeof msg.role === 'string' && typeof msg.content === 'string'
        );

        const firstUserIndex = validHistory.findIndex((msg) => msg.role === 'user');

        if (firstUserIndex === -1) {
            genkitHistory = [];
        } else {
            const historyToProcess = validHistory.slice(firstUserIndex);
            console.log("converseWithBook will process this history slice:", JSON.stringify(historyToProcess, null, 2));
            genkitHistory = historyToProcess.map((msg) => ({
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

        console.warn("Assistant response was empty or did not contain text. Full response:", JSON.stringify(response, null, 2));
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
