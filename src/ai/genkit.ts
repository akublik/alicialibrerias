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
  
  ai = new Proxy({}, {
    get(target, prop) {
      if (['defineFlow', 'definePrompt', 'defineTool', 'generate', 'generateStream', 'embed', 'listModels'].includes(String(prop))) {
        return () => {
          throw new Error(errorMessage);
        };
      }
      return Reflect.get(target, prop);
    }
  });
}

export { ai };