// src/app/(superadmin_dashboard)/superadmin/stories/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, FileText, Loader2, Edit, Trash2, PackageOpen, Upload, Download } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, writeBatch, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Papa from 'papaparse';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ManageStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storyToAction, setStoryToAction] = useState<Story | null>(null);
  const { toast } = useToast();

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleDeleteStory = async (storyId: string, storyTitle: string) => {
    if (!db) return;
    
    try {
      await deleteDoc(doc(db, "stories", storyId));
      toast({
        title: "Cuento Eliminado",
        description: `El cuento "${storyTitle}" ha sido eliminado.`,
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = () => {
      const header = "title,author,category,country,years,content";
      const example = `"El Aleph","Jorge Luis Borges","Ficción Fantástica","Argentina","1945","El universo cabe en el sótano de una casa de Buenos Aires..."`;
      const csvContent = `${header}\n${example}`;
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "plantilla_importacion_cuentos.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      toast({ title: "No se ha seleccionado ningún archivo", variant: "destructive" });
      return;
    }
    if (!db) {
      toast({ title: "Error de conexión", variant: "destructive" });
      return;
    }

    setIsImporting(true);

    Papa.parse<Record<string, string>>(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
           toast({ title: "Error al leer CSV", description: results.errors.map(e => e.message).join(', '), variant: "destructive" });
           setIsImporting(false);
           return;
        }

        const batch = writeBatch(db);
        const storiesCollection = collection(db, "stories");
        let storiesAdded = 0;
        const validationErrors: string[] = [];

        results.data.forEach((row, index) => {
          if (!row.title || !row.author || !row.content) {
            validationErrors.push(`Fila ${index + 2}: Faltan columnas requeridas (title, author, content).`);
            return;
          }

          const newStoryData = {
              title: row.title,
              author: row.author,
              country: row.country || "",
              years: row.years || "",
              category: row.category || "",
              content: row.content,
              createdAt: serverTimestamp(),
          };

          const newStoryRef = doc(storiesCollection);
          batch.set(newStoryRef, newStoryData);
          storiesAdded++;
        });

        if (validationErrors.length > 0) {
          toast({
            title: `Errores en el archivo CSV (${validationErrors.length})`,
            description: (
              <ScrollArea className="h-40"><ul className="list-disc list-inside">{validationErrors.map((e, i) => <li key={i}>{e}</li>)}</ul></ScrollArea>
            ),
            variant: "destructive",
            duration: 10000,
          });
          setIsImporting(false);
          return;
        }
        
        if (storiesAdded > 0) {
          try {
            await batch.commit();
            toast({ title: "¡Importación Exitosa!", description: `Se han añadido ${storiesAdded} cuentos.` });
            setIsImportDialogOpen(false);
            setCsvFile(null);
          } catch (e: any) {
            toast({ title: "Error al guardar en la base de datos", description: e.message, variant: "destructive" });
          }
        } else {
           toast({ title: "Nada que importar", description: "El archivo CSV estaba vacío o no contenía datos válidos." });
        }
        setIsImporting(false);
      },
      error: (error: any) => {
          toast({ title: "Error al leer el archivo CSV", description: error.message, variant: "destructive" });
          setIsImporting(false);
      }
    });
  };

  return (
    <>
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
          <div className="flex gap-2">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                  <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Importar CSV</Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Importar Cuentos desde CSV</DialogTitle>
                      <DialogDescription>Sube un archivo CSV para añadir cuentos de forma masiva.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                      <Card><CardHeader className="p-4"><CardTitle className="text-base">Instrucciones</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-sm space-y-2">
                          <p>1. Descarga la plantilla para asegurar que el formato es correcto.</p>
                          <p>2. Las columnas <strong>title, author, y content</strong> son obligatorias.</p>
                          <Button variant="link" className="p-0 h-auto" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4"/> Descargar plantilla CSV</Button>
                      </CardContent></Card>
                      <div><Input id="csv-file" type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} disabled={isImporting} /></div>
                  </div>
                  <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsImportDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleImportCSV} disabled={!csvFile || isImporting}>
                          {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Importar Cuentos
                      </Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>
            <Link href="/superadmin/stories/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Cuento
              </Button>
            </Link>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Cuentos Publicados</CardTitle>
            <CardDescription>Mostrando {stories.length} cuentos.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Años</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stories.length > 0 ? stories.map((story) => (
                    <TableRow key={story.id}>
                      <TableCell className="font-medium">{story.title}</TableCell>
                      <TableCell>{story.author}</TableCell>
                      <TableCell>{story.category}</TableCell>
                      <TableCell>{story.country}</TableCell>
                      <TableCell>{story.years}</TableCell>
                      <TableCell className="text-right">
                         <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Menú</span></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem asChild><Link href={`/superadmin/stories/edit/${story.id}`}><Edit className="mr-2 h-4 w-4" /> Editar</Link></DropdownMenuItem>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro de eliminar este cuento?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Esta acción es irreversible. Se eliminará "{story.title}" de la base de datos.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteStory(story.id, story.title)} className="bg-destructive hover:bg-destructive/90">
                                    Sí, eliminar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                              <PackageOpen className="h-12 w-12" />
                              <h3 className="font-semibold">No hay cuentos añadidos</h3>
                              <p>Añade tu primer cuento manualmente o importa un archivo CSV.</p>
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
    </>
  );
}