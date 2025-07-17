# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Enabling Generative AI

This starter uses Google's Gemini models via Genkit. To enable the AI features (like recommendations, content generation, and chat assistants), you need to provide a Gemini API key.

1.  **Get an API Key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to generate a free API key.
2.  **Set the Environment Variable**: Open the `.env` file in the root of this project.
3.  **Add Your Key**: Paste your key into the file like this:

    ```
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

4.  The app will automatically detect the key and enable all AI functionalities.
