import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let ai: any;

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.0-flash',
  });
} else {
  console.warn(`
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    !!! ATENCIÓN: CLAVE DE API DE GOOGLE NO ENCONTRADA !!!
    
    No se encontraron las variables de entorno GOOGLE_API_KEY o GEMINI_API_KEY.
    Las funciones de IA generativa estarán deshabilitadas.
    
    Para habilitarlas, define una de estas variables en tu entorno.
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  `);
  
  // Create a mock 'ai' object that will throw clear errors when any AI feature is used.
  const errorMessage = "La funcionalidad de IA está deshabilitada porque falta la clave de API de Google (GOOGLE_API_KEY). Por favor, configúrala en las variables de entorno del servidor.";

  const mockFunc = async () => {
    throw new Error(errorMessage);
  };
  
  ai = {
    defineFlow: () => mockFunc,
    definePrompt: () => mockFunc,
    generate: mockFunc,
  };
}

export { ai };
