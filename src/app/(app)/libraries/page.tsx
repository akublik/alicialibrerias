// src/app/(app)/libraries/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { LibraryCard } from "@/components/LibraryCard";
import { placeholderLibraries } from "@/lib/placeholders";
import type { Library } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const locations = ["Todas", "Quito", "Guayaquil", "Cuenca", "Bogotá", "Lima"]; 

const NEW_LIBRARY_ID = "newly-registered-library";

// Helper function to load initial libraries including the one from localStorage
const getInitialLibraries = (): Library[] => {
  let initialLibs = [...placeholderLibraries]; // Start with placeholders
  if (typeof window !== "undefined") {
    const storedLibraryData = localStorage.getItem("aliciaLibros_registeredLibrary");
    if (storedLibraryData) {
      try {
        const newLibrary: Library = JSON.parse(storedLibraryData);
        console.log("Found new library in localStorage on LibrariesPage:", newLibrary);
        // Remove any existing library with the same ID (e.g., if it was a placeholder or stale entry)
        initialLibs = initialLibs.filter(lib => lib.id !== newLibrary.id);
        // Add the new library to the beginning of the list
        initialLibs = [newLibrary, ...initialLibs];
      } catch (e) {
        console.error("Error parsing registered library data for initial list:", e);
      }
    }
  }
  console.log("Initial libraries for LibrariesPage:", initialLibs);
  return initialLibs;
};


export default function LibrariesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Todas");
  // Initialize allLibraries using the helper function
  const [allLibraries, setAllLibraries] = useState<Library[]>(getInitialLibraries);

  // This useEffect can be used if we need to react to storage changes dynamically,
  // but for initial load, getInitialLibraries handles it.
  useEffect(() => {
     // If you need to listen for storage events or re-fetch, you can do it here.
     // For now, we ensure the list is up-to-date on mount by using getInitialLibraries in useState.
     // To force re-fetch if localStorage might change while page is open (e.g. via another tab),
     // you could add a listener or a button to refresh.
     // For simplicity, we assume navigation will cause a re-mount or this initial load is sufficient.
  }, []);


  const handleSearch = (term: string) => {
    setSearchTerm(term.toLowerCase());
  };

  const filteredLibraries = useMemo(() => {
    return allLibraries.filter((library) => {
      const matchesSearchTerm =
        library.name.toLowerCase().includes(searchTerm) ||
        (library.description && library.description.toLowerCase().includes(searchTerm)) ||
        library.location.toLowerCase().includes(searchTerm);
      const matchesLocation =
        selectedLocation === "Todas" || library.location.includes(selectedLocation);
      return matchesSearchTerm && matchesLocation;
    });
  }, [searchTerm, selectedLocation, allLibraries]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-12 text-center">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
          Directorio de Librerías
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          Explora nuestra red de librerías independientes en Ecuador y Latinoamérica. Encuentra tu próximo tesoro literario.
        </p>
      </header>

      <div className="mb-8 p-6 bg-card rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="search-library" className="block text-sm font-medium text-foreground mb-1">Buscar por nombre o palabra clave</label>
             <div className="flex w-full items-center space-x-2">
              <Input
                id="search-library"
                type="text"
                placeholder="Ej: El Gato Lector, libros infantiles..."
                value={searchTerm} // Controlled input
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-grow text-base md:text-sm"
                aria-label="Buscar librería"
              />
              {/* Removed the explicit search button, search is now on type */}
            </div>
          </div>
          <div>
            <label htmlFor="filter-location" className="block text-sm font-medium text-foreground mb-1">Filtrar por ubicación</label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger id="filter-location" className="w-full text-base md:text-sm" aria-label="Seleccionar ubicación">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Seleccionar ubicación" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location} className="font-body">
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredLibraries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredLibraries.map((library) => (
            <LibraryCard key={library.id} library={library} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-headline text-2xl font-semibold text-foreground mb-2">No se encontraron librerías</h3>
          <p className="text-muted-foreground">
            Intenta ajustar tus filtros o ampliar tu búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
