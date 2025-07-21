// src/ai/flows/converse-with-book.ts
'use server';
/**
 * @fileOverview AI agent that converses as "AlicIA" about a book.
 *
 * - converseWithBook - A function that handles the conversation.
 * - ChatMessage - The type for a single message in the conversation history.
 */

import { ai } from '@/ai/genkit';
import type { GenerateResponseData, Part, Role } from 'genkit/model';

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

export async function converseWithBook(bookTitle: string, history: ChatMessage[]): Promise<string> {
    const systemPrompt = `A partir de ahora, actúa como si fueras AlicIA, una asistente de lectura experta en el libro "${bookTitle}". Responde a mis preguntas y comentarios usando tu conocimiento sobre ese libro. Si te hago preguntas que se salgan del contexto o del enfoque del libro, rechaza la solicitud indicando que solo puedes interactuar como una asistente para ese libro.`;
    
    try {
        const firstUserIndex = history.findIndex(m => m && m.role === 'user');
        
        if (firstUserIndex === -1) {
             return "Por favor, hazme una pregunta para empezar.";
        }

        const validHistory = history
            .slice(firstUserIndex)
            .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string');

        // Construct the history with the correct types expected by ai.generate
        const genkitHistory: Array<{ role: Role; content: Part[] }> = validHistory.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            content: [{ text: msg.content }],
        }));
        
        const response: GenerateResponseData = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: systemPrompt,
            history: genkitHistory,
        });

        // Robust response handling
        const responseText = response?.candidates?.[0]?.message?.content?.[0]?.text;
        if (responseText) {
          return responseText;
        }
        
        // If we reach here, the response was not in the expected format.
        console.error("----------- DETAILED AI CONVERSE WITH BOOK ERROR -----------");
        console.error("Flow: converseWithBook - Response structure was invalid or empty.");
        console.error("Timestamp:", new Date().toISOString());
        console.error("Book Title:", bookTitle);
        console.error("Full AI Response Object:", JSON.stringify(response, null, 2));
        
        let errorMessage = "AlicIA está procesando tu pregunta... pero no ha encontrado una respuesta de texto. Inténtalo de nuevo.";
        if (response?.candidates?.[0]?.finishReason) {
            errorMessage += ` (Razón: ${response.candidates[0].finishReason})`;
        }
        return errorMessage;
        
    } catch (e: any) {
        console.error("----------- DETAILED AI CONVERSE WITH BOOK ERROR -----------");
        console.error("Flow: converseWithBook - Caught exception.");
        console.error("Timestamp:", new Date().toISOString());
        console.error("Book Title:", bookTitle);
        console.error("History from client:", JSON.stringify(history, null, 2));
        console.error("Error Name:", e.name);
        console.error("Error Message:", e.message);
        console.error("Error object:", JSON.stringify(e, null, 2));
        
        if (e.message && e.message.includes('API key')) {
             return "Lo siento, la función de chat sobre el libro no está disponible en este momento por un problema de configuración de la clave API.";
        }

        return `Lo siento, he tenido un problema y no puedo responder ahora mismo. (Error: ${e.message})`;
    }
}
