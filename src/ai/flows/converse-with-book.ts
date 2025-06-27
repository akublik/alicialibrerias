
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
    
    // Filter out any invalid or empty messages from history
    const validHistory = history.filter(m => m && m.role && m.content);

    // Find the first user message, as the history must start with a user message.
    const firstUserIndex = validHistory.findIndex(m => m.role === 'user');

    // If no user message is found, do not proceed.
    if (firstUserIndex === -1) {
          return "Por favor, hazme una pregunta para empezar.";
    }

    // Slice the history from the first user message.
    const cleanHistory = validHistory.slice(firstUserIndex);

    // Convert to the format Genkit expects.
    const genkitHistory = cleanHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: [{ text: msg.content }],
    }));

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
