

// src/app/(library_dashboard)/library-admin/books/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, BookCopy, Loader2, Edit, Trash2, Eye, EyeOff, Star, ShoppingCart, Upload, Download, FileText, Search, ChevronsDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, getDocs, addDoc, serverTimestamp, documentId } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Papa from 'papaparse';
import { ScrollArea } from "@/components/ui/scroll-area";

type Rule = {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt';
  value: any;
};

const ITEMS_PER_LOAD = 20;

const applyRules = (row: Record<string, any>, rules: Rule[]): boolean => {
  if (rules.length === 0) return true;

  for (const rule of rules) {
    const rowValue = row[rule.field];

    if (rowValue === undefined || rowValue === null) {
      if (rule.operator === 'not_equals') continue; 
      return false;
    }
    
    let conditionMet = false;
    const ruleValue = rule.value;

    switch (rule.operator) {
      case 'equals':
        conditionMet = String(rowValue).toLowerCase() === String(ruleValue).toLowerCase();
        break;
      case 'not_equals':
        conditionMet = String(rowValue).toLowerCase() !== String(ruleValue).toLowerCase();
        break;
      case 'contains':
        conditionMet = String(rowValue).toLowerCase().includes(String(ruleValue).toLowerCase());
        break;
      case 'gt':
        conditionMet = Number(rowValue) > Number(ruleValue);
        break;
      case 'lt':
        conditionMet = Number(rowValue) < Number(ruleValue);
        break;
      default:
        conditionMet = false;
    }
    
    if (!conditionMet) {
      return false;
    }
  }

  return true;
};


export default function LibraryBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [bookToAction, setBookToAction] = useState<Book | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [libraryImportRules, setLibraryImportRules] = useState<Rule[]>([]);

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);


  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    
    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (!userDataString) {
      setIsLoading(false);
      console.warn("User data not found in localStorage.");
      return;
    }
    
    const userData = JSON.parse(userDataString);
    const currentLibraryId = userData.libraryId;
    setLibraryId(currentLibraryId);

    const libraryDataString = localStorage.getItem("aliciaLibros_registeredLibrary");
    if (libraryDataString) {
        try {
            const libraryData = JSON.parse(libraryDataString);
            if (libraryData.importRules) {
                setLibraryImportRules(JSON.parse(libraryData.importRules));
            }
        } catch (e) {
            console.error("Could not parse library import rules", e);
        }
    }
    
    if (!currentLibraryId) {
      setIsLoading(false);
      console.warn("Library ID not found for the current user.");
      return;
    }

    const booksRef = collection(db, "books");
    const q = query(booksRef, where("libraryId", "==", currentLibraryId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const libraryBooks: Book[] = [];
      querySnapshot.forEach((doc) => {
        libraryBooks.push({ id: doc.id, ...doc.data() } as Book);
      });
      setBooks(libraryBooks);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching books: ", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const filteredBooks = useMemo(() => {
    if (!searchTerm) return books;
    const lowercasedTerm = searchTerm.toLowerCase();
    return books.filter(book => 
        book.title.toLowerCase().includes(lowercasedTerm) ||
        book.authors.some(author => author.toLowerCase().includes(lowercasedTerm)) ||
        (book.isbn && book.isbn.toLowerCase().includes(lowercasedTerm))
    );
  }, [books, searchTerm]);
  
  const currentBooks = useMemo(() => {
    return filteredBooks.slice(0, visibleCount);
  }, [filteredBooks, visibleCount]);
  
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchTerm]);


  const handleToggleStatus = async (book: Book) => {
    if (!db) return;
    setIsActionLoading(true);
    setBookToAction(book);
    const newStatus = (book.status ?? 'published') === 'published' ? 'unpublished' : 'published';
    const bookRef = doc(db, "books", book.id);
    try {
      await updateDoc(bookRef, { status: newStatus });
      toast({
        title: "Estado Actualizado",
        description: `El libro "${book.title}" ahora está ${newStatus === 'published' ? 'publicado' : 'no publicado'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setBookToAction(null);
    }
  };

  const handleDeleteBook = async () => {
    if (!bookToAction || !db) return;
    setIsActionLoading(true);
    const bookRef = doc(db, "books", bookToAction.id);
    try {
      await deleteDoc(bookRef);
      toast({
        title: "Libro Eliminado",
        description: `El libro "${bookToAction.title}" ha sido eliminado.`,
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setIsDeleteDialogOpen(false);
      setBookToAction(null);
    }
  };
  
  const handleExportCSV = () => {
    if (books.length === 0) {
      toast({ title: "No hay libros para exportar", variant: "destructive" });
      return;
    }
    const csvData = Papa.unparse(books.map(book => ({
      title: book.title,
      authors: book.authors.join(', '),
      isbn: book.isbn,
      price: book.price,
      stock: book.stock,
      description: book.description,
      categories: book.categories?.join(', '),
      tags: book.tags?.join(', '),
      imageUrl: book.imageUrl,
      isFeatured: book.isFeatured ? "TRUE" : "FALSE",
      pageCount: book.pageCount,
      coverType: book.coverType,
      publisher: book.publisher,
      condition: book.condition,
    })));

    const blob = new Blob([`\uFEFF${csvData}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventario-alicia-libros-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadNewTemplate = () => {
      const header = "pvp,moneda,formato,tipo_notificacion,isbn13,alto,ancho,peso,titulo,edicion,idioma_edicion,paginas,resumen,imagen_tapa,editor,pais_edicion,fecha_publicacion,codigo_bmg,autor,colección,sello,clasificacion";
      const example = `"12.99","USD","Tapa Blanda","Novedad","9780307348129","21","14","0.4","El amor en los tiempos del cólera","1","Español","368","La historia de amor entre...","https://ejemplo.com/tapa.jpg","Debolsillo","ES","1985","12345","Gabriel García Márquez","Contemporánea","Debolsillo","Realismo Mágico"`;
      const csvContent = `${header}\n${example}`;
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "plantilla_formato_b.csv");
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
    if (!db || !libraryId) {
        toast({ title: "Error de conexión o de librería", variant: "destructive" });
        return;
    }

    const libraryDataString = localStorage.getItem("aliciaLibros_registeredLibrary");
    if (!libraryDataString) {
        toast({ title: "Error de librería", description: "No se pudo encontrar la información de la librería registrada.", variant: "destructive" });
        return;
    }
    const libraryData = JSON.parse(libraryDataString);
    const { name: libraryName, location: libraryLocation } = libraryData;

    let rules: Rule[] = [];
    if(libraryData.importRules) {
        try {
            rules = JSON.parse(libraryData.importRules);
        } catch(e) {
             toast({ title: "Error en Reglas", description: "Las reglas de importación tienen un formato JSON inválido. No se aplicará ningún filtro.", variant: "destructive" });
        }
    }

    setIsImporting(true);

    Papa.parse<Record<string, any>>(csvFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase().replace(/"/g, ''),
        complete: async (results) => {
            if (results.errors.length > 0) {
                toast({ title: "Error al leer CSV", description: results.errors.map(e => e.message).join(', '), variant: "destructive" });
                setIsImporting(false);
                return;
            }
            if (!results.meta.fields?.includes('isbn13')) {
                toast({ title: "Formato Incorrecto", description: "El archivo CSV debe contener una columna 'isbn13'.", variant: "destructive" });
                setIsImporting(false);
                return;
            }
            
            try {
                // Fetch all existing books for the library just once
                const existingBooksQuery = query(collection(db, "books"), where("libraryId", "==", libraryId));
                const existingBooksSnapshot = await getDocs(existingBooksQuery);
                const existingBooksMap = new Map<string, { id: string, data: Book }>();
                existingBooksSnapshot.forEach(doc => {
                    const data = doc.data() as Book;
                    if (data.isbn) {
                        existingBooksMap.set(data.isbn, { id: doc.id, data });
                    }
                });

                const batch = writeBatch(db);
                let operationsCount = 0;
                const validationErrors: string[] = [];

                for (const row of results.data) {
                    if (!applyRules(row, rules)) continue;
                    
                    const isbn = row.isbn13 ? String(row.isbn13).trim() : null;
                    if (!isbn) {
                        validationErrors.push(`Una fila fue omitida por no tener ISBN.`);
                        continue;
                    }
                    
                    const formatValue = (row.formato || "").toLowerCase();
                    const bookFormat = formatValue.includes('digital') ? 'Digital' : 'Físico';

                    const bookData = {
                        title: row.titulo || 'Sin Título',
                        authors: (row.autor || "").split(',').map((a: string) => a.trim()).filter(Boolean),
                        price: parseFloat(row.pvp) || 0,
                        stock: row.hasOwnProperty('stock') && !isNaN(parseInt(row.stock, 10)) ? parseInt(row.stock, 10) : 1,
                        isbn: isbn,
                        description: row.resumen || '',
                        categories: (row.clasificacion || "").split(/[,;]/).map((c: string) => c.trim()).filter(Boolean),
                        tags: (row.colección || "").split(/[,;]/).map((t: string) => t.trim()).filter(Boolean),
                        imageUrl: row.imagen_tapa || `https://placehold.co/300x450.png?text=${encodeURIComponent(row.titulo || 'Libro')}`,
                        pageCount: row.paginas ? parseInt(row.paginas, 10) : null,
                        coverType: row.formato || null,
                        publisher: row.editor || row.sello || null,
                        condition: 'Nuevo' as const,
                        format: bookFormat,
                        libraryId: libraryId,
                        libraryName: libraryName,
                        libraryLocation: libraryLocation,
                        status: 'published' as const,
                        updatedAt: serverTimestamp(),
                    };

                    const existingBook = existingBooksMap.get(isbn);
                    if (existingBook) {
                        const bookDocRef = doc(db, "books", existingBook.id);
                        batch.update(bookDocRef, bookData);
                    } else {
                        const newBookRef = doc(collection(db, "books"));
                        batch.set(newBookRef, { ...bookData, createdAt: serverTimestamp() });
                    }
                    operationsCount++;
                }

                if (validationErrors.length > 0) {
                    toast({
                        title: `Avisos de Validación (${validationErrors.length})`,
                        description: "Algunas filas fueron omitidas. Revisa la consola para más detalles.",
                        variant: "destructive",
                    });
                    console.warn("Validation errors during import:", validationErrors);
                }

                if (operationsCount > 0) {
                    await batch.commit();
                    toast({ title: "¡Importación Completada!", description: `Se han procesado ${operationsCount} libros.` });
                    setIsImportDialogOpen(false);
                    setCsvFile(null);
                } else {
                    toast({ title: "Nada que importar", description: "No se encontraron libros nuevos o para actualizar en el archivo que cumplan con las reglas." });
                }
            } catch (e: any) {
                toast({ title: "Error al Procesar", description: `Error al procesar el lote: ${e.message}`, variant: "destructive" });
            } finally {
                setIsImporting(false);
            }
        },
        error: (error: any) => {
            toast({ title: "Error al leer el archivo", description: error.message, variant: "destructive" });
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
              <BookCopy className="mr-3 h-8 w-8"/>
              Mis Libros
            </h1>
            <p className="text-lg text-foreground/80">
              Gestiona el inventario de tu librería.
            </p>
          </div>
          <div className="flex gap-2">
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" /> Importar CSV
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar Libros desde CSV</DialogTitle>
                        <DialogDescription>Sube un archivo CSV para añadir o actualizar libros en tu inventario de forma masiva.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Card>
                            <CardHeader className="p-4"><CardTitle className="text-base">Instrucciones</CardTitle></CardHeader>
                            <CardContent className="p-4 pt-0 text-sm space-y-2">
                                <p>1. La importación **sobrescribirá** los libros existentes que coincidan por **ISBN**. Las filas sin ISBN serán omitidas.</p>
                                <p>2. Se aplicarán las reglas de importación definidas en tu perfil de librería.</p>
                                <div className="flex gap-4">
                                    <Button variant="link" className="p-0 h-auto" onClick={handleDownloadNewTemplate}>
                                        <FileText className="mr-2 h-4 w-4"/> Descargar plantilla (Formato B)
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        <div>
                            <Input
                                id="csv-file" type="file" accept=".csv"
                                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                disabled={isImporting}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsImportDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleImportCSV} disabled={!csvFile || isImporting}>
                            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Importar Libros
                        </Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" /> Exportar a CSV</Button>
              <Link href="/library-admin/books/new">
                  <Button><PlusCircle className="mr-2 h-4 w-4" /> Añadir Libro</Button>
              </Link>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Inventario de Libros ({filteredBooks.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <CardDescription>
                  Busca y gestiona los libros de tu inventario.
                </CardDescription>
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por título, autor, ISBN..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
          </CardHeader>
          <CardContent>
              {isLoading ? (
                  <div className="flex justify-center items-center py-16">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
              ) : (
                <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden w-[100px] sm:table-cell">
                        <span className="sr-only">Imagen</span>
                      </TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Formato</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden md:table-cell">Stock</TableHead>
                      <TableHead className="hidden md:table-cell">Precio</TableHead>
                      <TableHead>
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentBooks.length > 0 ? currentBooks.map((book) => {
                      const status = book.status ?? 'published';
                      return (
                      <TableRow key={book.id}>
                        <TableCell className="hidden sm:table-cell">
                          <Image
                            alt={`Portada de ${book.title}`}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={book.imageUrl}
                            width="64"
                            data-ai-hint={book.dataAiHint || 'book cover'}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {book.isFeatured && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Libro Destacado</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <span>{book.title}</span>
                          </div>
                           <div className="text-xs text-muted-foreground">{book.authors.join(', ')}</div>
                        </TableCell>
                         <TableCell>
                          <Badge variant={book.format === 'Digital' ? 'default' : 'secondary'}>{book.format || 'Físico'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status === 'published' ? "secondary" : "destructive"}>
                            {status === 'published' ? 'Publicado' : 'No Publicado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                           <Badge variant={book.stock && book.stock > 5 ? "secondary" : (book.stock && book.stock > 0 ? "outline" : "destructive")}>
                              {book.stock || 0} en stock
                           </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">${book.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isActionLoading && bookToAction?.id === book.id}>
                                {isActionLoading && bookToAction?.id === book.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/library-admin/books/edit/${book.id}`}>
                                  <Edit className="mr-2 h-4 w-4" /> Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/library-admin/orders?bookId=${book.id}&bookTitle=${encodeURIComponent(book.title)}`}>
                                  <ShoppingCart className="mr-2 h-4 w-4" /> Ver Pedidos
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(book)}>
                                {status === 'published' ? (
                                  <><EyeOff className="mr-2 h-4 w-4" /> Despublicar</>
                                ) : (
                                  <><Eye className="mr-2 h-4 w-4" /> Publicar</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => {
                                  setBookToAction(book);
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
                    )}) : (
                       <TableRow>
                          <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                              {searchTerm ? `No se encontraron libros para "${searchTerm}".` : "No tienes ningún libro en tu inventario todavía."}
                          </TableCell>
                       </TableRow>
                    )}
                  </TableBody>
                </Table>
                {visibleCount < filteredBooks.length && (
                  <div className="text-center mt-6">
                    <Button onClick={() => setVisibleCount(prev => prev + ITEMS_PER_LOAD)}>
                      <ChevronsDown className="mr-2 h-4 w-4" />
                      Ver más ({filteredBooks.length - visibleCount} restantes)
                    </Button>
                  </div>
                )}
                </>
              )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el libro
              "{bookToAction?.title}" de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBookToAction(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBook}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isActionLoading}
            >
              {isActionLoading && bookToAction?.id === bookToAction?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sí, eliminar libro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
