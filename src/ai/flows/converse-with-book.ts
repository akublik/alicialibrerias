
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
    const systemPrompt = `A partir de ahora, actúa como si fueras AlicIA, una asistente de lectura experta en el libro "${bookTitle}". Responde a mis preguntas y comentarios usando tu conocimiento sobre ese libro. Si te hago preguntas que se salgan del contexto o del enfoque del libro, rechaza la solicitud indicando que solo puedes interactuar como una asistente para ese libro.`;
    
    const genkitHistory = [];
    let foundFirstUserMessage = false;

    if (Array.isArray(history)) {
        for (const message of history) {
            // Validate each message thoroughly before processing
            if (message && typeof message.role === 'string' && typeof message.content === 'string') {
                if (message.role === 'user') {
                    foundFirstUserMessage = true;
                }
                
                // Only add messages after the first user message has been found
                if (foundFirstUserMessage) {
                     genkitHistory.push({
                        role: message.role === 'user' ? 'user' : 'model',
                        content: [{ text: message.content }],
                    });
                }
            } else {
                 // Log any invalid message structure to the server console for debugging
                 console.warn("converseWithBook ignored an invalid message in history:", message);
            }
        }
    }

    // If no user message was ever found, we can't proceed.
    if (!foundFirstUserMessage) {
        return "Por favor, hazme una pregunta para empezar.";
    }

    const response = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        system: systemPrompt,
        history: genkitHistory,
    });

    const text = response.text;

    // IMPORTANT: Always return a string to prevent breaking the chat history.
    if (text) {
      return text;
    }

    console.warn("Converse with book response was empty or did not contain text. Full response:", JSON.stringify(response, null, 2));
    return "AlicIA está procesando tu pregunta... pero no ha encontrado una respuesta de texto. Inténtalo de nuevo.";
}
