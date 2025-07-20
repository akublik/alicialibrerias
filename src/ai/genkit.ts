import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

let ai: any;

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (apiKey) {
  // Initialize Genkit with the Google AI plugin.
  ai = genkit({
    plugins: [googleAI({ apiKey })],
  });
} else {
  console.warn(`
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    !!! ATENCIÓN: CLAVE DE API DE GEMINI NO ENCONTRADA !!!
    
    No se encontró la variable de entorno GEMINI_API_KEY.
    Las funciones de IA generativa estarán deshabilitadas.
    
    Para habilitarlas, obtén una clave de Google AI Studio y
    defínela en tu archivo .env.
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  `);
  
  // Create a mock 'ai' object that will throw clear errors when any AI feature is used.
  const errorMessage = "La funcionalidad de IA está deshabilitada porque falta la clave de API (GEMINI_API_KEY). Por favor, configúrala en el archivo .env.";

  const mockFunc = async () => {
    throw new Error(errorMessage);
  };
  
  ai = new Proxy({}, {
    get(target, prop, receiver) {
      if (['defineFlow', 'definePrompt', 'defineTool', 'generate', 'generateStream', 'embed', 'listModels'].includes(String(prop))) {
        return () => {
          throw new Error(errorMessage);
        };
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

export { ai };
