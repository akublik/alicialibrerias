import { genkit, type GenkitError } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

let ai: any;

const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
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
  
  const errorMessage = "La funcionalidad de IA está deshabilitada porque falta la clave de API (GEMINI_API_KEY). Por favor, configúrala en el archivo .env.";
  
  // This proxy will throw a specific, helpful error when any AI function is called without an API key.
  ai = new Proxy({}, {
    get(target, prop) {
      if (['defineFlow', 'definePrompt', 'defineTool', 'generate', 'generateStream', 'embed', 'listModels'].includes(String(prop))) {
        // For functions that return a promise, we must return a function that returns a rejected promise.
        return () => Promise.reject(new Error(errorMessage));
      }
      // For other properties, just return undefined or a specific handler if needed.
      return Reflect.get(target, prop);
    }
  });
}

export { ai };
