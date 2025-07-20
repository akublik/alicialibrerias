// src/ai/flows/converse-with-book.ts
'use server';
/**
 * @fileOverview AI agent that converses as "AlicIA" about a book.
 *
 * - converseWithBook - A function that handles the conversation.
 * - ChatMessage - The type for a single message in the conversation history.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Part, Role, UserMessage } from '@genkit-ai/core/lib/model';

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export async function converseWithBook(bookTitle: string, history: ChatMessage[]): Promise<string> {
    const systemPrompt = `A partir de ahora, actúa como si fueras AlicIA, una asistente de lectura experta en el libro "${bookTitle}". Responde a mis preguntas y comentarios usando tu conocimiento sobre ese libro. Si te hago preguntas que se salgan del contexto o del enfoque del libro, rechaza la solicitud indicando que solo puedes interactuar como una asistente para ese libro.`;
    
    try {
        // Find the first user message, as the history must start with a user message.
        const firstUserIndex = history.findIndex(m => m && m.role === 'user');
        
        if (firstUserIndex === -1) {
             return "Por favor, hazme una pregunta para empezar.";
        }

        // Slice the history from the first user message and filter out any invalid messages.
        const validHistory = history
            .slice(firstUserIndex)
            .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string');

        // Convert to the format Genkit expects for history.
        const genkitHistory = validHistory.map((msg): UserMessage => ({
            role: msg.role === 'user' ? 'user' : 'model',
            content: [{ text: msg.content }],
        }));
        
        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: systemPrompt,
            history: genkitHistory as Array<{ role: Role; content: Part[] }>,
        });

        const text = response.text;
        
        if (text) {
          return text;
        }

        console.warn("Converse with book response was empty or did not contain text. Full response:", JSON.stringify(response, null, 2));
        return "AlicIA está procesando tu pregunta... pero no ha encontrado una respuesta de texto. Inténtalo de nuevo.";
        
    } catch (e: any) {
        console.error("----------- DETAILED AI CONVERSE WITH BOOK ERROR -----------");
        console.error("Flow: converseWithBook");
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
