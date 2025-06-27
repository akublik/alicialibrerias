
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
    let userMessageFound = false;

    if (Array.isArray(history)) {
        for (const message of history) {
            if (message?.role === 'user') {
                userMessageFound = true;
            }

            if (!userMessageFound) {
                continue;
            }

            if (message && typeof message.role === 'string' && typeof message.content === 'string') {
                genkitHistory.push({
                    role: message.role === 'user' ? 'user' : 'model',
                    content: [{ text: message.content }],
                });
            } else {
                console.warn("Skipping invalid message in converse-with-book history:", message);
            }
        }
    }

    if (!userMessageFound) {
        return "Por favor, hazme una pregunta para empezar.";
    }

    try {
        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: systemPrompt,
            history: genkitHistory,
        });

        const text = response.text;

        if (text) {
          return text;
        }

        console.warn("Converse with book response was empty or did not contain text. Full response:", JSON.stringify(response, null, 2));
        return "AlicIA está procesando tu pregunta... pero no ha encontrado una respuesta de texto. Inténtalo de nuevo.";
        
    } catch (e: any) {
        console.error("Error in converseWithBook during AI generation:", e);
        console.error("History that caused the error:", JSON.stringify(genkitHistory, null, 2));
        return "Lo siento, tuve un problema interno al procesar tu solicitud. Revisa la consola del servidor para detalles.";
    }
}
