"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Wand2 } from 'lucide-react';
import { ShoppingAssistantDialog } from './ShoppingAssistantDialog';

export function ShoppingAssistantTrigger() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="default"
                    size="lg"
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl z-50 flex items-center justify-center"
                    aria-label="Abrir asistente de compras"
                >
                    <Wand2 className="h-8 w-8" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-[90vw] max-w-md p-0"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <ShoppingAssistantDialog />
            </SheetContent>
        </Sheet>
    );
}
