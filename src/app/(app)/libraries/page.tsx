// src/app/(app)/libraries/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { LibraryCard } from "@/components/LibraryCard";
import type { Library } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";

export default function LibrariesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Todas");
  const [allLibraries, setAllLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [locations, setLocations] = useState<string[]>(["Todas"]);

  useEffect(() => {
    const fetchLibraries = async () => {
        if (!db) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const librariesRef = collection(db, "libraries");
            const q = query(librariesRef);
            const querySnapshot = await getDocs(q);
            const libraries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Library));
            setAllLibraries(libraries);

            // Dynamically generate location list
            const uniqueLocations = new Set<string>();
            libraries.forEach(lib => {
                if (lib.location) {
                    const city = lib.location.split(',')[0].trim();
                    if (city) {
                       uniqueLocations.add(city);
                    }
                }
            });
            setLocations(["Todas", ...Array.from(uniqueLocations).sort()]);

        } catch (error) {
            console.error("Error fetching libraries:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchLibraries();
  }, []);

  const filteredLibraries = useMemo(() => {
    const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
    
    return allLibraries.filter((library) => {
      const searchableText = [
        library.name,
        library.description,
        library.location
      ].join(' ').toLowerCase();

      const matchesSearchTerm = searchWords.length > 0
        ? searchWords.every(word => searchableText.includes(word))
        : true;
      
      const matchesLocation =
        selectedLocation === "Todas" || (library.location || "").includes(selectedLocation);
      
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow text-base md:text-sm"
                aria-label="Buscar librería"
              />
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
      
      {isLoading ? (
        <div className="container mx-auto px-4 py-8 md:py-12 text-center flex flex-col justify-center items-center min-h-[40vh]">
            <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
            <p className="mt-4 text-lg text-muted-foreground">Cargando librerías...</p>
        </div>
      ) : filteredLibraries.length > 0 ? (
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
            No hay librerías que coincidan con tus filtros. Intenta con otros términos.
          </p>
        </div>
      )}
    </div>
  );
}
