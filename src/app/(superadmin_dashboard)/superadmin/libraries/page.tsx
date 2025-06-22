// src/app/(superadmin_dashboard)/superadmin/libraries/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Loader2, Store } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Library } from "@/types";
import Image from "next/image";

export default function ManageLibrariesPage() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    
    const librariesRef = collection(db, "libraries");
    const unsubscribe = onSnapshot(librariesRef, (snapshot) => {
      const allLibraries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Library));
      setLibraries(allLibraries);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching libraries:", error);
      toast({ title: "Error al cargar librerías", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleStatusChange = async (library: Library, newStatus: boolean) => {
    if (!db || !library.id) return;

    setIsUpdating(library.id);
    const libraryRef = doc(db, "libraries", library.id);
    try {
      await updateDoc(libraryRef, { isActive: newStatus });
      toast({
        title: "Estado Actualizado",
        description: `La librería ${library.name} ha sido ${newStatus ? 'activada' : 'desactivada'}.`
      });
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
            <Store className="mr-3 h-8 w-8"/>
            Gestionar Librerías
          </h1>
          <p className="text-lg text-foreground/80">
            Activa o desactiva las librerías que forman parte de la plataforma.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Todas las Librerías</CardTitle>
          <CardDescription>Mostrando {libraries.length} librerías registradas.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Logo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Email de Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {libraries.map(library => (
                  <TableRow key={library.id}>
                    <TableCell>
                       <Image
                            alt={`Logo de ${library.name}`}
                            className="aspect-square rounded-md object-cover"
                            height="40"
                            src={library.imageUrl || 'https://placehold.co/40x40.png'}
                            width="40"
                          />
                    </TableCell>
                    <TableCell className="font-medium">{library.name}</TableCell>
                    <TableCell>{library.location}</TableCell>
                    <TableCell>{library.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {isUpdating === library.id ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                           <Switch
                                checked={library.isActive !== false} // Active if undefined or true
                                onCheckedChange={(newStatus) => handleStatusChange(library, newStatus)}
                                disabled={isUpdating === library.id}
                                aria-label={`Activar o desactivar ${library.name}`}
                            />
                        )}
                        <span className="text-sm text-muted-foreground">{library.isActive !== false ? 'Activa' : 'Inactiva'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
