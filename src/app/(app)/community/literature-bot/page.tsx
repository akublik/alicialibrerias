// src/app/(app)/community/literature-bot/page.tsx
import LiteratureBot from "@/components/LiteratureBot";
import { Bot } from "lucide-react";

export default function LiteratureBotPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
       <header className="mb-12 text-center">
        <Bot className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
          Asistente Experto en Literatura
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          Conversa con nuestro bot experto sobre grandes obras, autores y movimientos literarios de la historia.
        </p>
      </header>
      <main className="flex justify-center">
        <div className="w-full max-w-2xl">
          <LiteratureBot />
        </div>
      </main>
    </div>
  );
}
