"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { askShoppingAssistant } from '@/ai/flows/shopping-assistant';
import { cn } from '@/lib/utils';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function ShoppingAssistantDialog() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '¡Hola! Soy Alicia, tu asistente de compras. ¿Qué libro te apetece leer hoy? Puedes preguntarme sobre títulos, autores, o si tenemos algo en tu ciudad.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const assistantResponse = await askShoppingAssistant(input);
            const assistantMessage: Message = { role: 'assistant', content: assistantResponse };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error calling shopping assistant:", error);
            const errorMessage: Message = { role: 'assistant', content: 'Lo siento, he tenido un problema y no puedo responder ahora mismo.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        // Scroll to bottom when new messages are added
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages]);

    return (
        <>
            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                <div className="space-y-6">
                    {messages.map((message, index) => (
                        <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                           {message.role === 'assistant' && (
                               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                   <Bot className="w-5 h-5 text-primary" />
                               </div>
                           )}
                           <div className={cn(
                               "p-3 rounded-lg max-w-[80%] text-sm whitespace-pre-wrap",
                               message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                           )}>
                               {message.content}
                           </div>
                           {message.role === 'user' && (
                               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                   <User className="w-5 h-5 text-muted-foreground" />
                               </div>
                           )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div className="p-3 rounded-lg bg-muted flex items-center">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pregúntame algo..."
                        disabled={isLoading}
                        autoComplete="off"
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </>
    );
}
