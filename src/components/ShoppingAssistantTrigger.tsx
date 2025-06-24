"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Wand2 } from 'lucide-react';
import { ShoppingAssistantDialog } from './ShoppingAssistantDialog';
import { AliciaLogoIcon } from './AliciaLogoIcon';

export function ShoppingAssistantTrigger() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="default"
                    size="lg"
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl z-50 flex items-center justify-center p-0"
                    aria-label="Abrir asistente de compras"
                >
                    <AliciaLogoIcon className="h-10 w-10" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-[90vw] max-w-md p-0 flex flex-col"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center">
                        <Wand2 className="h-6 w-6 text-primary mr-3" />
                        <span className="font-headline text-xl text-primary">Asistente de Compras</span>
                    </SheetTitle>
                </SheetHeader>
                <ShoppingAssistantDialog />
            </SheetContent>
        </Sheet>
    );
}
