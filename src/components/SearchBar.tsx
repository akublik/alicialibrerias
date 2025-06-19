'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ onSearch, placeholder = "Buscar librerías...", className }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSearch} className={`flex w-full items-center space-x-2 ${className}`}>
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="flex-grow text-base md:text-sm"
        aria-label="Campo de búsqueda"
      />
      <Button type="submit" variant="default" size="lg" aria-label="Buscar">
        <Search className="h-5 w-5" />
        <span className="hidden sm:inline ml-2 font-body">Buscar</span>
      </Button>
    </form>
  );
}
