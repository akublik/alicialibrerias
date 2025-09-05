// src/app/(app)/games/page.tsx

export default function GamesPage() {
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  
  const htmlContent = `
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Juego Literario - AliciaLibros.com</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Alegreya', serif;
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 2rem;
            flex-direction: column;
        }
        h1, h2, h3 { font-family: 'Belleza', sans-serif; }
        .container {
            display: flex;
            gap: 2rem;
            width: 100%;
            max-width: 1200px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .card {
            background-color: hsl(var(--card));
            border-radius: var(--radius);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            padding: 2rem;
            transition: transform 0.3s ease-in-out;
        }
        .card:hover {
            transform: translateY(-5px);
        }
        .game-setup {
            flex: 1;
            min-width: 300px;
        }
        .game-display {
            flex: 2;
            min-width: 400px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
        .game-icon {
            font-size: 4rem;
            color: hsl(var(--primary));
            margin-bottom: 1rem;
        }
        .question-card, .result-card {
            width: 100%;
            max-width: 600px;
            background-color: hsl(var(--card));
            padding: 2rem;
            border-radius: var(--radius);
            border: 2px solid hsl(var(--primary));
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        .option-button {
            width: 100%;
            padding: 0.75rem;
            margin: 0.5rem 0;
            border-radius: var(--radius);
            background-color: hsl(var(--secondary));
            border: 2px solid hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            font-weight: 600;
        }
        .option-button:hover:not(:disabled) {
            background-color: hsl(var(--primary) / 0.2);
            border-color: hsl(var(--primary));
            transform: translateY(-2px);
        }
        .option-button.correct {
            background-color: #d1fae5;
            border-color: #34d399;
            color: #064e3b;
        }
        .option-button.incorrect {
            background-color: #fee2e2;
            border-color: #f87171;
            color: #991b1b;
        }
        .fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="">

    <header class="text-center mb-8">
        <h1 class="text-4xl md:text-5xl font-bold text-[hsl(var(--primary))] mb-2">Alicia Libros</h1>
        <p class="text-lg text-[hsl(var(--muted-foreground))]">¡Pon a prueba tu ingenio y creatividad! Diseña tu propio juego literario con la ayuda de nuestra inteligencia artificial.</p>
    </header>

    <div class="container">
        <!-- Panel de Configuración del Juego -->
        <div class="game-setup card">
            <h2 class="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">Crea tu Juego</h2>
            <p class="text-sm text-[hsl(var(--muted-foreground))] mb-6">Define los parámetros y deja que la IA diseñe una experiencia literaria única para ti.</p>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Tipo de Juego</label>
                    <input type="text" value="Trivia" disabled class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed">
                    <p class="text-xs text-gray-500 mt-1">Prueba con 'Trivia' o 'Cuestionario' para un juego interactivo.</p>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Tema del Juego</label>
                    <input type="text" id="theme" value="Literatura Universal" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition">
                </div>
                
                <div>
                    <label for="complexity" class="block text-sm font-semibold text-gray-700 mb-1">Dificultad</label>
                    <select id="complexity" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent transition">
                        <option value="Fácil">Fácil</option>
                        <option value="Medio">Medio</option>
                        <option value="Difícil">Difícil</option>
                    </select>
                </div>
            </div>
            
            <button id="generate-button" onclick="startGame()" class="mt-8 w-full px-6 py-3 rounded-full text-white font-bold bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] transition shadow-lg hover:shadow-xl">
                Generar Juego
            </button>
        </div>

        <!-- Panel de Visualización del Juego -->
        <div id="game-display" class="game-display card">
            <span class="game-icon">🎮</span>
            <h3 class="text-xl font-bold text-[hsl(var(--foreground))] mb-2">Tu juego aparecerá aquí</h3>
            <p class="text-[hsl(var(--muted-foreground))]">Completa el formulario para empezar.</p>
        </div>
    </div>
    
    <script>
        const apiKey = "${geminiApiKey}"; 
        const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        let currentQuestionIndex = 0;
        let score = 0;
        let gameData = [];
        const gameContainer = document.getElementById('game-display');
        const generateButton = document.getElementById('generate-button');
        let loadingIndicator = null;

        function createLoadingIndicator() {
            const loader = document.createElement('div');
            loader.className = 'flex flex-col items-center justify-center';
            loader.innerHTML = \`
                <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
                <p class="mt-4 text-[hsl(var(--muted-foreground))]">Generando preguntas...</p>
            \`;
            return loader;
        }

        async function startGame() {
             if (!apiKey) {
                gameContainer.innerHTML = '<div class="p-8 text-center"><p class="text-red-500 font-semibold">Error de Configuración</p><p>La clave de API de Gemini no está configurada en el entorno. Por favor, añádela a tus variables de entorno para continuar.</p></div>';
                return;
            }

            const complexity = document.getElementById('complexity').value;
            const theme = document.getElementById('theme').value;

            gameContainer.innerHTML = '';
            loadingIndicator = createLoadingIndicator();
            gameContainer.appendChild(loadingIndicator);
            generateButton.disabled = true;

            try {
                const prompt = \`Genera un juego de trivia con 5 preguntas sobre el tema "${'$'}{theme}" con 4 opciones de respuesta para cada una, donde solo una sea correcta. La dificultad debe ser ${complexity}. Devuelve el resultado en un array de objetos JSON con el siguiente formato, sin ningún texto o formato adicional antes o después del JSON:
                [
                    {
                        "pregunta": "...",
                        "opciones": [
                            {"texto": "...", "correcta": false},
                            {"texto": "...", "correcta": true},
                            {"texto": "...", "correcta": false},
                            {"texto": "...", "correcta": false}
                        ]
                    },
                    ...
                ]\`;

                const payload = {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    },
                };
                
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(\`Error en la API: ${'$'}{response.statusText} - ${'$'}{errorBody}\`);
                }
                
                const result = await response.json();
                
                if (!result.candidates || !result.candidates[0].content || !result.candidates[0].content.parts[0].text) {
                     throw new Error('La respuesta de la API no tiene el formato esperado.');
                }
                const jsonString = result.candidates[0].content.parts[0].text;
                gameData = JSON.parse(jsonString);

                currentQuestionIndex = 0;
                score = 0;
                renderQuestion();

            } catch (error) {
                console.error('Error al generar el juego:', error);
                gameContainer.innerHTML = \`<div class="p-8 text-center"><p class="text-red-500">Ocurrió un error. Por favor, inténtalo de nuevo.</p><p class="text-xs text-gray-500 mt-2">${'$'}{error.message}</p></div>\`;
            } finally {
                generateButton.disabled = false;
            }
        }

        function renderQuestion() {
            if (currentQuestionIndex >= gameData.length) {
                renderResults();
                return;
            }

            const question = gameData[currentQuestionIndex];
            const questionElement = document.createElement('div');
            questionElement.className = 'question-card fade-in';
            questionElement.innerHTML = \`
                <p class="text-lg font-semibold mb-4">${'$'}{currentQuestionIndex + 1}. ${'$'}{question.pregunta}</p>
                <div class="options-container w-full space-y-2">
                    ${'$'}{question.opciones.map((option, index) => \`
                        <button class="option-button" onclick="checkAnswer(${'$'}{index})">${'$'}{option.texto}</button>
                    \`).join('')}
                </div>
            \`;
            
            gameContainer.innerHTML = '';
            gameContainer.appendChild(questionElement);
        }

        function checkAnswer(selectedIndex) {
            const question = gameData[currentQuestionIndex];
            const selectedOption = question.opciones[selectedIndex];
            const optionButtons = gameContainer.querySelectorAll('.option-button');

            optionButtons.forEach((button, index) => {
                button.disabled = true;
                if (question.opciones[index].correcta) {
                    button.classList.add('correct');
                } else if (index === selectedIndex) {
                    button.classList.add('incorrect');
                }
            });

            if (selectedOption.correcta) {
                score++;
            }

            setTimeout(() => {
                currentQuestionIndex++;
                renderQuestion();
            }, 1500);
        }

        function renderResults() {
            const resultElement = document.createElement('div');
            resultElement.className = 'result-card fade-in';
            resultElement.innerHTML = \`
                <h3 class="text-2xl font-bold text-gray-800 mb-4">¡Juego terminado!</h3>
                <p class="text-lg text-gray-700">Has respondido correctamente a <span class="text-[hsl(var(--primary))] font-bold">${'$'}{score} de ${'$'}{gameData.length}</span> preguntas.</p>
                <button onclick="startGame()" class="mt-8 px-6 py-3 rounded-full text-white font-bold bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] transition shadow-lg hover:shadow-xl">
                    Jugar de Nuevo
                </button>
            \`;
            
            gameContainer.innerHTML = '';
            gameContainer.appendChild(resultElement);
        }
    </script>
</body>
</html>
  `;
  
  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}
