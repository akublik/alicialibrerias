// src/components/PlatformAssistantTrigger.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X } from 'lucide-react';
import { PlatformAssistantDialog } from './PlatformAssistantDialog';
import { AliciaLogoIcon } from './AliciaLogoIcon';

export function PlatformAssistantTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl z-50 p-0 overflow-hidden flex items-center justify-center transition-transform hover:scale-110"
          aria-label="Abrir chat de ayuda"
        >
          {isOpen ? (
            <X className="h-8 w-8" />
          ) : (
            <AliciaLogoIcon className="h-10 w-10" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-80 md:w-96 h-[70vh] max-h-[600px] p-0 flex flex-col mr-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <PlatformAssistantDialog />
      </PopoverContent>
    </Popover>
  );
}
