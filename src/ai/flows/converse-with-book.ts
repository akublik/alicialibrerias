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
        // Robust validation: Ensure each message is a valid object with the required properties.
        const validHistory = history.filter(
          (m): m is ChatMessage => m && typeof m.role === 'string' && typeof m.content === 'string' && m.content.trim() !== ''
        );

        if (validHistory.length === 0) {
             return "Por favor, hazme una pregunta para empezar.";
        }

        const genkitHistory: Array<{ role: Role; content: Part[] }> = validHistory.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            content: [{ text: msg.content }],
        }));
        
        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: systemPrompt,
            history: genkitHistory,
        });

        // Use the safe .text accessor provided by Genkit v1
        const responseText = response.text;
        
        if (responseText) {
            return responseText;
        }
        
        // If we reach here, the response was empty, likely due to safety settings or other reasons.
        console.error("----------- DETAILED AI CONVERSE WITH BOOK ERROR -----------");
        console.error("Flow: converseWithBook - AI response was valid but contained no text content.");
        console.error("Timestamp:", new Date().toISOString());
        console.error("Book Title:", bookTitle);
        console.error("Full AI Response Object:", JSON.stringify(response, null, 2));
        
        let errorMessage = "AlicIA está procesando tu pregunta... pero no ha encontrado una respuesta de texto. Inténtalo de nuevo.";
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason) {
            errorMessage += ` (Razón: ${finishReason})`;
            if (finishReason === 'SAFETY') {
              errorMessage = "No puedo responder a esa pregunta porque infringe las políticas de seguridad. Por favor, intenta con otra pregunta sobre el libro.";
            }
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
