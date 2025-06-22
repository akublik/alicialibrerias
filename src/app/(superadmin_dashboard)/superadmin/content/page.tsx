// src/app/(superadmin_dashboard)/superadmin/content/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FilePenLine, Save, ImagePlus, PlusCircle, Edit, Trash2, AlertTriangle, ExternalLink } from "lucide-react";
import Image from 'next/image';
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, addDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import type { Author, Book } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect, type Option as MultiSelectOption } from "@/components/ui/multi-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Schemas
const homepageContentFormSchema = z.object({
  bannerTitle: z.string().min(3, "El título es requerido."),
  bannerSubtitle: z.string().min(10, "El subtítulo es requerido."),
  bannerImage: z.any().optional(),
  featuredBookIds: z.array(z.string()).max(4, "Puedes seleccionar hasta 4 libros.").optional(),
});
type HomepageContentFormValues = z.infer<typeof homepageContentFormSchema>;

const authorFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  bio: z.string().min(10, "La biografía es requerida."),
  authorImage: z.any().optional(),
});
type AuthorFormValues = z.infer<typeof authorFormSchema>;

const contentDocRef = doc(db, "homepage_content", "sections");

// Helper function to add a timeout to a promise
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        clearTimeout(timeoutId);
      });
  });
}


export default function ManageContentPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingHomepage, setIsSavingHomepage] = useState(false);
    const [isSavingAuthor, setIsSavingAuthor] = useState(false);
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [currentBannerImageUrl, setCurrentBannerImageUrl] = useState<string>('');
    const [isAuthorDialogOpen, setIsAuthorDialogOpen] = useState(false);
    const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);
    const [isTestingWrite, setIsTestingWrite] = useState(false);
    const [testWriteResult, setTestWriteResult] = useState<string | null>(null);

    const { toast } = useToast();

    const homepageForm = useForm<HomepageContentFormValues>({
        resolver: zodResolver(homepageContentFormSchema),
        defaultValues: {
            bannerTitle: "",
            bannerSubtitle: "",
            featuredBookIds: [],
        }
    });
    const authorForm = useForm<AuthorFormValues>({
        resolver: zodResolver(authorFormSchema),
        defaultValues: {
            name: "",
            bio: "",
        }
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                // Fetch homepage content
                const contentSnap = await getDoc(contentDocRef);
                if (contentSnap.exists()) {
                    const data = contentSnap.data();
                    homepageForm.reset({
                        bannerTitle: data.bannerTitle || "",
                        bannerSubtitle: data.bannerSubtitle || "",
                        featuredBookIds: data.featuredBookIds || [],
                    });
                    setCurrentBannerImageUrl(data.bannerImageUrl || "");
                }

                // Fetch all books for multiselect
                const booksUnsub = onSnapshot(collection(db, "books"), (snapshot) => {
                    setAllBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
                });

                // Fetch authors
                const authorsUnsub = onSnapshot(collection(db, "authors"), (snapshot) => {
                    setAuthors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Author)));
                });
                
                return () => {
                    booksUnsub();
                    authorsUnsub();
                };

            } catch (error: any) {
                toast({ title: "Error al cargar datos", description: error.message, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [homepageForm, toast]);

    const bookOptions = useMemo<MultiSelectOption[]>(() => {
        return allBooks.map(book => ({ value: book.id, label: book.title }));
    }, [allBooks]);

    const testHomepageContentWrite = async () => {
        if (!db) {
            toast({ title: "Error", description: "Conexión a Firestore no disponible.", variant: "destructive"});
            return;
        }
        setIsTestingWrite(true);
        setTestWriteResult(null);

        const testData = { testField: `test_write_${Date.now()}` };
        try {
            await withTimeout(setDoc(contentDocRef, testData, { merge: true }), 8000, "La prueba de escritura tardó demasiado (timeout).");
            const successMsg = "¡Prueba de escritura exitosa! Tu configuración y reglas de Firestore permiten escribir en el documento de la homepage. Si el guardado principal falla, el problema probablemente esté en la subida de la imagen a Firebase Storage.";
            setTestWriteResult(successMsg);
            toast({ title: "Prueba Exitosa", description: "Se pudo escribir en Firestore."});
        } catch (error: any) {
            let errorMessage = `Falló la prueba de escritura. Error: ${error.message}.`;
            if (error.code === 'permission-denied' || error.message.includes('permission-denied')) {
                errorMessage = "¡Permiso Denegado! Revisa tus reglas de seguridad de Firestore. Deben permitir la escritura en la ruta `homepage_content/sections` para el usuario autenticado (superadmin). Error completo: " + error.message;
            }
            setTestWriteResult(errorMessage);
            toast({ title: "Error en la Prueba de Escritura", description: errorMessage, variant: "destructive", duration: 15000 });
        } finally {
            setIsTestingWrite(false);
        }
    };

    const onHomepageSubmit = async (values: HomepageContentFormValues) => {
        setIsSavingHomepage(true);
        if (!db || !storage) {
            toast({
                title: "Error de Conexión",
                description: "La conexión con Firebase no está disponible. Revisa la configuración en src/lib/firebase.ts y tus variables de entorno.",
                variant: "destructive",
                duration: 10000,
            });
            setIsSavingHomepage(false);
            return;
        }

        try {
            let imageUrl = currentBannerImageUrl;
            const imageFile = values.bannerImage?.[0];

            if (imageFile) {
                const imageRef = ref(storage, `homepage/banner/${uuidv4()}`);
                const uploadPromise = uploadBytes(imageRef, imageFile);
                await withTimeout(uploadPromise, 15000, "La subida de la imagen tardó demasiado. Verifica tu conexión y las reglas de almacenamiento de Firebase.");
                
                imageUrl = await getDownloadURL(imageRef);
                setCurrentBannerImageUrl(imageUrl);
            }

            const dataToSave = {
                bannerTitle: values.bannerTitle,
                bannerSubtitle: values.bannerSubtitle,
                bannerImageUrl: imageUrl,
                featuredBookIds: values.featuredBookIds || [],
            };
            
            const setDocPromise = setDoc(contentDocRef, dataToSave, { merge: true });
            await withTimeout(setDocPromise, 8000, "La escritura en la base de datos tardó demasiado. Verifica tus reglas de seguridad de Firestore.");

            toast({ title: "Contenido de Homepage Guardado" });
        } catch (error: any) {
            let description = `No se pudo guardar. Error: ${error.message}`;
            if (error.code === 'storage/unauthorized' || error.message.includes('permission-denied')) {
              description = "Permiso denegado. Revisa tus reglas de seguridad de Firebase Storage/Firestore.";
            } else if (error.message.includes('timeout')) {
                description = error.message;
            }
            toast({ title: "Error al guardar", description: description, variant: "destructive", duration: 10000 });
        } finally {
            setIsSavingHomepage(false);
        }
    };
    
    const openAuthorDialog = (author: Author | null) => {
        setEditingAuthor(author);
        if (author) {
            authorForm.reset({ name: author.name, bio: author.bio, authorImage: undefined });
        } else {
            authorForm.reset({ name: "", bio: "", authorImage: undefined });
        }
        setIsAuthorDialogOpen(true);
    };

    const onAuthorSubmit = async (values: AuthorFormValues) => {
        setIsSavingAuthor(true);
        try {
            let imageUrl = editingAuthor?.imageUrl || "";
            const imageFile = values.authorImage?.[0];

            if (imageFile) {
                const imageRef = ref(storage, `authors/${uuidv4()}`);
                await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(imageRef);
            }
            
            const authorData = {
                name: values.name,
                bio: values.bio,
                imageUrl,
                dataAiHint: "author portrait"
            };
            
            if (editingAuthor) {
                await updateDoc(doc(db, "authors", editingAuthor.id), authorData);
                toast({ title: "Autor actualizado" });
            } else {
                await addDoc(collection(db, "authors"), authorData);
                toast({ title: "Autor añadido" });
            }

            setIsAuthorDialogOpen(false);
            setEditingAuthor(null);

        } catch (error: any) {
            toast({ title: "Error al guardar autor", description: error.message, variant: "destructive" });
        } finally {
            setIsSavingAuthor(false);
        }
    };

    const confirmDeleteAuthor = (author: Author) => {
        setAuthorToDelete(author);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteAuthor = async () => {
        if (!authorToDelete) return;
        try {
            if (authorToDelete.imageUrl) {
                try {
                    const imageRef = ref(storage, authorToDelete.imageUrl);
                    await deleteObject(imageRef);
                } catch (storageError: any) {
                    if (storageError.code !== 'storage/object-not-found') {
                        console.warn("Could not delete author image from storage:", storageError);
                    }
                }
            }
            await deleteDoc(doc(db, "authors", authorToDelete.id));
            toast({ title: "Autor eliminado" });
        } catch (error: any) {
            toast({ title: "Error al eliminar autor", description: error.message, variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setAuthorToDelete(null);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center py-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 animate-fadeIn">
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center mb-8">
                <FilePenLine className="mr-3 h-8 w-8" />
                Gestionar Contenido de Homepage
            </h1>

            <Tabs defaultValue="banner">
                <TabsList className="mb-4">
                    <TabsTrigger value="banner">Banner</TabsTrigger>
                    <TabsTrigger value="featured-books">Libros Destacados</TabsTrigger>
                    <TabsTrigger value="authors">Autores</TabsTrigger>
                    <TabsTrigger value="community" disabled>Comunidad (Próximamente)</TabsTrigger>
                    <TabsTrigger value="games" disabled>Juegos (Próximamente)</TabsTrigger>
                </TabsList>
                
                <Form {...homepageForm}>
                    <form onSubmit={homepageForm.handleSubmit(onHomepageSubmit)} className="space-y-6">
                        <TabsContent value="banner">
                            <Card>
                                <CardHeader><CardTitle>Banner Principal</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={homepageForm.control} name="bannerTitle" render={({ field }) => ( <FormItem><FormLabel>Título del Banner</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={homepageForm.control} name="bannerSubtitle" render={({ field }) => ( <FormItem><FormLabel>Subtítulo del Banner</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    {currentBannerImageUrl && <div className="relative w-full aspect-video rounded-md overflow-hidden border"><Image src={currentBannerImageUrl} alt="Banner actual" layout="fill" objectFit="cover" /></div>}
                                    <FormField control={homepageForm.control} name="bannerImage" render={({ field }) => ( <FormItem><FormLabel>Cambiar Imagen del Banner</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem> )} />
                                </CardContent>
                            </Card>

                            <Card className="mt-6 bg-yellow-50 border-yellow-300">
                                <CardHeader className="flex-row items-center gap-4 space-y-0">
                                    <AlertTriangle className="w-10 h-10 text-yellow-600 flex-shrink-0" />
                                    <div>
                                    <CardTitle className="text-lg font-headline text-yellow-800">Diagnóstico de Guardado</CardTitle>
                                    <CardDescription className="text-yellow-700 text-xs">
                                        Si los cambios no se guardan, el problema suele ser la configuración de Firebase (Reglas de Seguridad). Usa este botón para diagnosticar el problema de escritura.
                                    </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button type="button" variant="outline" className="w-full bg-white" onClick={testHomepageContentWrite} disabled={isTestingWrite}>
                                        {isTestingWrite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Probar Escritura en 'homepage_content'
                                    </Button>
                                    {testWriteResult && (
                                        <div className={`mt-4 text-sm p-3 rounded-md whitespace-pre-wrap ${testWriteResult.toLowerCase().includes('exitosa') ? 'bg-green-100 text-green-900 border border-green-200' : 'bg-red-100 text-red-900 border border-red-200'}`}>
                                            <p className="font-bold">{testWriteResult.toLowerCase().includes('exitosa') ? 'Resultado: Éxito' : 'Resultado: Error'}</p>
                                            <p>{testWriteResult}</p>
                                            {!testWriteResult.toLowerCase().includes('exitosa') && (
                                                <a href="https://firebase.google.com/docs/firestore/security/get-started?hl=es-419" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-2 inline-flex items-center font-semibold">
                                                Ver documentación de Reglas de Seguridad <ExternalLink className="ml-1 h-4 w-4"/>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="featured-books">
                            <Card>
                                <CardHeader><CardTitle>Libros Destacados</CardTitle><CardDescription>Selecciona hasta 4 libros para mostrar en la sección de destacados.</CardDescription></CardHeader>
                                <CardContent>
                                    <FormField
                                        control={homepageForm.control}
                                        name="featuredBookIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Libros</FormLabel>
                                                <FormControl>
                                                    <MultiSelect
                                                        placeholder="Selecciona libros..."
                                                        options={bookOptions}
                                                        value={field.value || []}
                                                        onChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <Button type="submit" disabled={isSavingHomepage}>
                            {isSavingHomepage ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Guardar Cambios de Homepage
                        </Button>
                    </form>
                </Form>

                <TabsContent value="authors">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Autores Destacados</CardTitle>
                                    <CardDescription>Gestiona la lista de autores que aparecen en la homepage.</CardDescription>
                                </div>
                                <Button onClick={() => openAuthorDialog(null)}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Autor</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>Autor</TableHead><TableHead>Biografía</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {authors.map(author => (
                                        <TableRow key={author.id}>
                                            <TableCell className="flex items-center gap-4">
                                                <Image src={author.imageUrl} alt={author.name} width={40} height={40} className="rounded-full object-cover"/>
                                                <span className="font-medium">{author.name}</span>
                                            </TableCell>
                                            <TableCell className="line-clamp-2">{author.bio}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openAuthorDialog(author)}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirmDeleteAuthor(author)}><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <Dialog open={isAuthorDialogOpen} onOpenChange={setIsAuthorDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAuthor ? "Editar Autor" : "Añadir Nuevo Autor"}</DialogTitle>
                        <DialogDescription>Completa los detalles del autor.</DialogDescription>
                    </DialogHeader>
                    <Form {...authorForm}>
                        <form onSubmit={authorForm.handleSubmit(onAuthorSubmit)} className="space-y-4">
                            <FormField control={authorForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={authorForm.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Biografía</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                            {editingAuthor?.imageUrl && <div className="relative w-24 h-24 rounded-full overflow-hidden border"><Image src={editingAuthor.imageUrl} alt="Imagen actual" layout="fill" objectFit="cover" /></div>}
                            <FormField control={authorForm.control} name="authorImage" render={({ field }) => ( <FormItem><FormLabel>{editingAuthor ? 'Cambiar Imagen' : 'Imagen'}</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem> )} />
                            <DialogFooter>
                                <Button type="submit" disabled={isSavingAuthor}>
                                    {isSavingAuthor ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Guardar Autor
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción es permanente y eliminará al autor "{authorToDelete?.name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAuthor} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
