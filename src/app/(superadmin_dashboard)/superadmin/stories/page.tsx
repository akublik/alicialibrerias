// src/app/(superadmin_dashboard)/superadmin/stories/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Loader2, FileText, PackageOpen, MoreHorizontal } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types";

export default function ManageStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    const storiesRef = collection(db, "stories");
    const q = query(storiesRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
      setStories(allStories);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching stories:", error);
      toast({ title: "Error al cargar cuentos", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
            <FileText className="mr-3 h-8 w-8"/>
            Gestionar Cuentos
          </h1>
          <p className="text-lg text-foreground/80">
            Añade, edita o elimina los cuentos de la plataforma.
          </p>
        </div>
        <Button disabled title="Próximamente">
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Cuento
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Cuentos Publicados</CardTitle>
          <CardDescription>
            Mostrando {stories.length} cuentos. La funcionalidad para añadir y editar estará disponible pronto.
          </CardDescription>
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
                  <TableHead>Título</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories.length > 0 ? stories.map((story) => (
                  <TableRow key={story.id}>
                    <TableCell className="font-medium">{story.title}</TableCell>
                    <TableCell>{story.author}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" disabled>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                            <PackageOpen className="h-12 w-12" />
                            <h3 className="font-semibold">No hay cuentos añadidos</h3>
                            <p>Esta sección está en construcción.</p>
                        </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
