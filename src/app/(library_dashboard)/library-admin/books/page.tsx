// src/app/(library_dashboard)/library-admin/books/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, BookCopy, Loader2, Edit, Trash2, Eye, EyeOff, Star, ShoppingCart, Upload, Download, FileText } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Papa from 'papaparse';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LibraryBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [bookToAction, setBookToAction] = useState<Book | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);


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
    const libraryId = userData.libraryId;
    
    if (!libraryId) {
      setIsLoading(false);
      console.warn("Library ID not found for the current user.");
      return;
    }

    const booksRef = collection(db, "books");
    const q = query(booksRef, where("libraryId", "==", libraryId));

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

  const handleDownloadTemplate = () => {
      const header = "title,authors,isbn,price,stock,description,categories,tags,isFeatured,pageCount,coverType,publisher,condition";
      const example = `"Cien Años de Soledad","Gabriel García Márquez",9780307474728,15.99,25,"La novela narra...","Realismo Mágico,Novela","Clásico,Colombia",TRUE,417,"Tapa Blanda",Sudamericana,"Nuevo"`;
      const csvContent = `${header}\n${example}`;
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "plantilla_importacion_libros.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };
  
  const handleDownloadNewTemplate = () => {
      const header = "pvp,moneda,formato,tipo_notificacion,isbn13,alto,ancho,peso,titulo,edicion,idioma_edicion,paginas,resumen,imagen_tapa,editor,pais_edicion,fecha_publicacion,codigo_bmg,autor,colección,sello,clasificacion";
      const example = `"12.99","USD","Tapa Blanda","Novedad","9780307348129","21","14","0.4","El amor en los tiempos del cólera","1","Español","368","La historia de amor entre...","https://ejemplo.com/tapa.jpg","Debolsillo","Colombia","1985","12345","Gabriel García Márquez","Contemporánea","Debolsillo","Realismo Mágico"`;
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
    if (!db) {
      toast({ title: "Error de conexión", variant: "destructive" });
      return;
    }

    const libraryDataString = localStorage.getItem("aliciaLibros_registeredLibrary");
    if (!libraryDataString) {
      toast({ title: "Error de librería", description: "No se pudo encontrar la información de la librería registrada.", variant: "destructive" });
      return;
    }
    const libraryData = JSON.parse(libraryDataString);
    const { id: libraryId, name: libraryName, location: libraryLocation } = libraryData;

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
        
        const headers = results.meta.fields;
        if (!headers) {
          toast({ title: "Error de CSV", description: "El archivo no tiene encabezados.", variant: "destructive" });
          setIsImporting(false);
          return;
        }

        const isNewFormat = headers.includes('pvp');
        const isOldFormat = headers.includes('title');

        if (!isNewFormat && !isOldFormat) {
          toast({ title: "Formato de CSV no reconocido", description: "Las columnas no coinciden con ninguna de las plantillas. Descargue una de las plantillas para ver el formato correcto.", variant: "destructive", duration: 10000 });
          setIsImporting(false);
          return;
        }

        const batch = writeBatch(db);
        const booksCollection = collection(db, "books");
        let booksAdded = 0;
        const validationErrors: string[] = [];

        results.data.forEach((row, index) => {
          let bookData: Partial<Book>;

          if (isNewFormat) {
            if (!row.titulo || !row.autor || !row.pvp) {
              validationErrors.push(`Fila ${index + 2}: Faltan columnas requeridas (titulo, autor, pvp).`);
              return;
            }
            const price = parseFloat(row.pvp);
            const pageCount = row.paginas ? parseInt(row.paginas, 10) : null;
            if (isNaN(price)) {
              validationErrors.push(`Fila ${index + 2}: La columna 'pvp' debe ser un número.`);
              return;
            }
             if (row.paginas && isNaN(pageCount!)) {
              validationErrors.push(`Fila ${index + 2}: La columna 'paginas' debe ser un número.`);
              return;
            }

            bookData = {
              title: row.titulo,
              authors: (row.autor || "").split(',').map((a: string) => a.trim()),
              price,
              stock: row.hasOwnProperty('stock') && !isNaN(parseInt(row.stock, 10)) ? parseInt(row.stock, 10) : 0, // Default stock to 0 if not present
              isbn: row.isbn13 || '',
              description: row.resumen || '',
              categories: (row.clasificacion || "").split(/[,;]/).map((c: string) => c.trim()).filter(Boolean),
              tags: (row.colección || "").split(/[,;]/).map((t: string) => t.trim()).filter(Boolean),
              imageUrl: row.imagen_tapa,
              pageCount,
              coverType: row.formato || null,
              publisher: row.editor || row.sello || null,
              condition: 'Nuevo',
            };

          } else { // Old format
            if (!row.title || !row.authors || !row.price || !row.stock) {
              validationErrors.push(`Fila ${index + 2}: Faltan columnas requeridas (title, authors, price, stock).`);
              return;
            }
            const price = parseFloat(row.price);
            const stock = parseInt(row.stock, 10);
            const pageCount = row.pageCount ? parseInt(row.pageCount, 10) : null;
            if (isNaN(price) || isNaN(stock) || (row.pageCount && isNaN(pageCount!))) {
              validationErrors.push(`Fila ${index + 2}: 'price', 'stock', y 'pageCount' deben ser números.`);
              return;
            }

            bookData = {
              title: row.title,
              authors: (row.authors || "").split(',').map((a: string) => a.trim()),
              price,
              stock,
              isbn: row.isbn || '',
              description: row.description || '',
              categories: (row.categories || "").split(',').map((c: string) => c.trim()).filter(Boolean),
              tags: (row.tags || "").split(',').map((t: string) => t.trim()).filter(Boolean),
              imageUrl: row.imageUrl,
              isFeatured: (row.isFeatured || 'false').toUpperCase() === 'TRUE',
              pageCount,
              coverType: row.coverType || null,
              publisher: row.publisher || null,
              condition: row.condition === 'Usado' ? 'Usado' : 'Nuevo',
            };
          }

          const newBookData = {
            ...bookData,
            dataAiHint: 'book cover',
            libraryId,
            libraryName,
            libraryLocation,
            status: 'published' as const,
            format: 'Físico' as const, // Assuming all imported books are physical for now
          };
          
          if (!newBookData.imageUrl) {
            newBookData.imageUrl = `https://placehold.co/300x450.png?text=${encodeURIComponent(newBookData.title as string)}`;
          }

          const newBookRef = doc(booksCollection);
          batch.set(newBookRef, newBookData);
          booksAdded++;
        });

        if (validationErrors.length > 0) {
          toast({
            title: `Errores en el archivo CSV (${validationErrors.length})`,
            description: ( <ScrollArea className="h-40"><ul className="list-disc list-inside">{validationErrors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}</ul></ScrollArea>),
            variant: "destructive",
            duration: 10000,
          });
          setIsImporting(false);
          return;
        }
        
        if (booksAdded > 0) {
          try {
            await batch.commit();
            toast({ title: "¡Importación Exitosa!", description: `Se han añadido ${booksAdded} libros.` });
            setIsImportDialogOpen(false);
            setCsvFile(null);
          } catch (e: any) {
            toast({ title: "Error al guardar", description: e.message, variant: "destructive" });
          }
        } else {
           toast({ title: "Nada que importar", description: "El archivo CSV estaba vacío o no contenía datos válidos." });
        }
        setIsImporting(false);
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
                        <DialogDescription>Sube un archivo CSV para añadir libros a tu inventario de forma masiva.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Card>
                            <CardHeader className="p-4"><CardTitle className="text-base">Instrucciones</CardTitle></CardHeader>
                            <CardContent className="p-4 pt-0 text-sm space-y-2">
                                <p>Sube un archivo CSV para añadir libros. La importación ahora es compatible con múltiples formatos.</p>
                                <p>Asegúrate de que tu archivo CSV tenga los encabezados correctos. Puedes descargar nuestras plantillas como guía:</p>
                                <div className="flex gap-4">
                                    <Button variant="link" className="p-0 h-auto" onClick={handleDownloadTemplate}>
                                        <FileText className="mr-2 h-4 w-4"/> Plantilla Estándar
                                    </Button>
                                    <Button variant="link" className="p-0 h-auto" onClick={handleDownloadNewTemplate}>
                                        <FileText className="mr-2 h-4 w-4"/> Plantilla Formato B
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
            <CardTitle>Inventario de Libros</CardTitle>
            <CardDescription>
              Mostrando {books.length} libros en tu inventario.
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
                    {books.length > 0 ? books.map((book) => {
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
                          <Badge variant="outline">{book.format || 'Físico'}</Badge>
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
                              No tienes ningún libro en tu inventario todavía.
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
