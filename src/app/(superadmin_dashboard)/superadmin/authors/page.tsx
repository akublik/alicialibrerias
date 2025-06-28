// src/app/(superadmin_dashboard)/superadmin/authors/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, PenSquare, Loader2, Edit, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Author } from "@/types";

export default function ManageAuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authorToAction, setAuthorToAction] = useState<Author | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    
    const unsubscribe = onSnapshot(collection(db, "authors"), (snapshot) => {
      const authorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Author));
      setAuthors(authorsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching authors:", error);
      toast({ title: "Error al cargar autores", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleDeleteAuthor = async () => {
    if (!authorToAction || !db) return;
    
    try {
      await deleteDoc(doc(db, "authors", authorToAction.id));
      toast({
        title: "Autor Eliminado",
        description: `El autor "${authorToAction.name}" ha sido eliminado.`,
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setAuthorToAction(null);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 animate-fadeIn">
         <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
              <PenSquare className="mr-3 h-8 w-8"/>
              Gestionar Autores
            </h1>
            <p className="text-lg text-foreground/80">
              Añade, edita o elimina los perfiles de los autores.
            </p>
          </div>
          <Link href="/superadmin/authors/new">
              <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Autor
              </Button>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Perfiles de Autores</CardTitle>
            <CardDescription>
              Mostrando {authors.length} autores en la plataforma.
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
                      <TableHead className="w-[80px]">Foto</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Países Visibles</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authors.length > 0 ? authors.map((author) => (
                      <TableRow key={author.id}>
                        <TableCell>
                          <Image
                            alt={`Foto de ${author.name}`}
                            className="aspect-square rounded-full object-cover"
                            height="40"
                            src={author.imageUrl || 'https://placehold.co/40x40.png'}
                            width="40"
                            data-ai-hint={author.dataAiHint || 'author portrait'}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{author.name}</TableCell>
                        <TableCell>{author.countries.join(', ')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/superadmin/authors/edit/${author.id}`}>
                                  <Edit className="mr-2 h-4 w-4" /> Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => {
                                  setAuthorToAction(author);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                       <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                              No has añadido ningún autor todavía.
                          </TableCell>
                       </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este autor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el perfil de "{authorToAction?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAuthorToAction(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAuthor}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sí, eliminar autor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}