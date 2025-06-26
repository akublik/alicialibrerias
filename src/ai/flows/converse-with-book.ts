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
    
    // Map frontend roles to Genkit roles ('assistant' -> 'model')
    const genkitHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model' as 'user' | 'model',
        content: [{ text: msg.content }]
    }));
    
    try {
        const response = await ai.generate({
            model: 'google/gemini-1.5-flash',
            system: systemPrompt,
            history: genkitHistory,
        });

        const text = response.candidates
            .map(c => c.content.map(p => p.text ?? '').join(''))
            .join('');

        if (!text) {
          return "No he podido generar una respuesta en este momento. Inténtalo de nuevo."
        }
        return text;

    } catch (error: any) {
        console.error("----------- DETAILED AI CHAT ERROR -----------");
        console.error("Flow: converseWithBook");
        console.error("Timestamp:", new Date().toISOString());
        console.error("Input bookTitle:", bookTitle);
        console.error("Input history:", JSON.stringify(history, null, 2));
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Error object:", JSON.stringify(error, null, 2));
        console.error("----------------------------------------------");
        
        if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) {
             return "Lo siento, mis circuitos están un poco sobrecargados en este momento. Por favor, inténtalo de nuevo en unos segundos.";
        }
        return "Lo siento, he encontrado un error inesperado y no puedo responder ahora mismo. Por favor, inténtalo de nuevo más tarde.";
    }
}
