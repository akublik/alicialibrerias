// src/components/ConverseWithBookDialog.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { converseWithBook } from '@/ai/flows/converse-with-book';
import { cn } from '@/lib/utils';

type Message = {
    role: 'user' | 'model';
    content: { text: string }[];
};

interface ConverseWithBookDialogProps {
    bookTitle: string;
}

export function ConverseWithBookDialog({ bookTitle }: ConverseWithBookDialogProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            content: [{ text: `¡Hola! Soy AlicIA, tu asistente de lectura. ¿Sobre qué te gustaría conversar del libro "${bookTitle}"?` }]
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: [{ text: input }] };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const assistantResponse = await converseWithBook({
                bookTitle,
                history: newMessages,
            });
            const assistantMessage: Message = { role: 'model', content: [{ text: assistantResponse }] };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error conversing with book:", error);
            const errorMessage: Message = { role: 'model', content: [{ text: 'Lo siento, he tenido un problema y no puedo responder ahora mismo.' }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
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
                           {message.role === 'model' && (
                               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                   <Bot className="w-5 h-5 text-primary" />
                               </div>
                           )}
                           <div className={cn(
                               "p-3 rounded-lg max-w-[80%] text-sm whitespace-pre-wrap",
                               message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                           )}>
                               {message.content[0].text}
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
                        placeholder="Pregúntale algo al libro..."
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