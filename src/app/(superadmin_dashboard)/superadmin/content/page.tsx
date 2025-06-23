
// src/app/(superadmin_dashboard)/superadmin/content/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FilePenLine, Save, PlusCircle, Edit, Trash2 } from "lucide-react";
import Image from 'next/image';
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, onSnapshot } from "firebase/firestore";
import type { Book } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect, type Option as MultiSelectOption } from "@/components/ui/multi-select";
import { Separator } from "@/components/ui/separator";

// Schemas
const secondaryBannerSlideSchema = z.object({
  imageUrl: z.string().url({ message: "URL de imagen no válida." }).optional().or(z.literal('')),
  title: z.string().min(3, { message: "El título es requerido." }),
  subtitle: z.string().min(10, { message: "El subtítulo es requerido." }),
  linkUrl: z.string().url({ message: "URL de enlace no válida." }).optional().or(z.literal('')),
});

const homepageContentFormSchema = z.object({
  bannerTitle: z.string().min(3, "El título es requerido."),
  bannerSubtitle: z.string().min(10, "El subtítulo es requerido."),
  bannerImageUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')),
  featuredBookIds: z.array(z.string()).max(5, "Puedes seleccionar hasta 5 libros.").optional(),
  secondaryBannerSlides: z.array(secondaryBannerSlideSchema).max(4, "Puedes tener hasta 4 slides.").optional(),
  nationalSectionTitle: z.string().optional(),
  nationalBookIds: z.array(z.string()).max(10, "Puedes seleccionar hasta 10 libros.").optional(),
});
type HomepageContentFormValues = z.infer<typeof homepageContentFormSchema>;

const contentDocRef = doc(db, "homepage_content", "sections");

export default function ManageContentPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingHomepage, setIsSavingHomepage] = useState(false);
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    
    const { toast } = useToast();

    const homepageForm = useForm<HomepageContentFormValues>({
        resolver: zodResolver(homepageContentFormSchema),
        defaultValues: {
            bannerTitle: "",
            bannerSubtitle: "",
            bannerImageUrl: "",
            featuredBookIds: [],
            secondaryBannerSlides: [],
            nationalSectionTitle: "Libros Ecuatorianos",
            nationalBookIds: [],
        }
    });

    const { fields: secondaryBannerFields, append: appendSecondaryBanner, remove: removeSecondaryBanner } = useFieldArray({
        control: homepageForm.control,
        name: "secondaryBannerSlides"
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!db) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                // Fetch homepage content
                const contentSnap = await getDoc(contentDocRef);
                if (contentSnap.exists()) {
                    const data = contentSnap.data();
                    homepageForm.reset({
                        bannerTitle: data.bannerTitle || "",
                        bannerSubtitle: data.bannerSubtitle || "",
                        bannerImageUrl: data.bannerImageUrl || "",
                        featuredBookIds: data.featuredBookIds || [],
                        secondaryBannerSlides: data.secondaryBannerSlides || [],
                        nationalSectionTitle: data.nationalSectionTitle || "Libros Ecuatorianos",
                        nationalBookIds: data.nationalBookIds || [],
                    });
                }

                // Fetch all books for multiselect
                const booksUnsub = onSnapshot(collection(db, "books"), (snapshot) => {
                    setAllBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
                });

                return () => {
                    booksUnsub();
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
    
    const onHomepageSubmit = async (values: HomepageContentFormValues) => {
        if (!db) {
             toast({ title: "Error de conexión", variant: "destructive" });
             return;
        }
        setIsSavingHomepage(true);

        try {
            const dataToSave = {
                bannerTitle: values.bannerTitle,
                bannerSubtitle: values.bannerSubtitle,
                bannerImageUrl: values.bannerImageUrl,
                featuredBookIds: values.featuredBookIds || [],
                secondaryBannerSlides: values.secondaryBannerSlides || [],
                nationalSectionTitle: values.nationalSectionTitle || "",
                nationalBookIds: values.nationalBookIds || [],
            };
            
            await setDoc(contentDocRef, dataToSave, { merge: true });

            toast({ title: "Contenido de Homepage Guardado" });
        } catch (error: any) {
            toast({ title: "Error al guardar", description: error.message, variant: "destructive", duration: 10000 });
        } finally {
            setIsSavingHomepage(false);
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

            <Form {...homepageForm}>
                <form onSubmit={homepageForm.handleSubmit(onHomepageSubmit)} className="space-y-6">
                    <Tabs defaultValue="banner">
                        <TabsList className="mb-4 grid w-full grid-cols-4">
                            <TabsTrigger value="banner">Banner Principal</TabsTrigger>
                            <TabsTrigger value="secondary-banner">Banner Secundario</TabsTrigger>
                            <TabsTrigger value="featured-books">Libros Destacados</TabsTrigger>
                             <TabsTrigger value="national-section">Sección Nacional</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="banner">
                            <Card>
                                <CardHeader><CardTitle>Banner Principal</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={homepageForm.control} name="bannerTitle" render={({ field }) => ( <FormItem><FormLabel>Título del Banner</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={homepageForm.control} name="bannerSubtitle" render={({ field }) => ( <FormItem><FormLabel>Subtítulo del Banner</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    {homepageForm.watch('bannerImageUrl') && <div className="relative w-full aspect-video rounded-md overflow-hidden border"><Image src={homepageForm.watch('bannerImageUrl')!} alt="Banner actual" layout="fill" objectFit="cover" /></div>}
                                    <FormField control={homepageForm.control} name="bannerImageUrl" render={({ field }) => ( <FormItem><FormLabel>URL de la Imagen del Banner</FormLabel><FormControl><Input type="url" placeholder="https://ejemplo.com/imagen.png" {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem> )} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="secondary-banner">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Banner Secundario (Carrusel)</CardTitle>
                                    <CardDescription>Gestiona las diapositivas del carrusel. Máximo 4.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {secondaryBannerFields.map((field, index) => (
                                        <div key={field.id} className="p-4 border rounded-md relative space-y-3">
                                            <h4 className="font-medium">Diapositiva {index + 1}</h4>
                                             <FormField control={homepageForm.control} name={`secondaryBannerSlides.${index}.imageUrl`} render={({ field }) => ( <FormItem><FormLabel>URL de Imagen</FormLabel><FormControl><Input {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem> )} />
                                             <FormField control={homepageForm.control} name={`secondaryBannerSlides.${index}.title`} render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                             <FormField control={homepageForm.control} name={`secondaryBannerSlides.${index}.subtitle`} render={({ field }) => ( <FormItem><FormLabel>Subtítulo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                             <FormField control={homepageForm.control} name={`secondaryBannerSlides.${index}.linkUrl`} render={({ field }) => ( <FormItem><FormLabel>Enlace (URL)</FormLabel><FormControl><Input {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem> )} />
                                            <Button type="button" variant="destructive" size="sm" onClick={() => removeSecondaryBanner(index)} className="absolute top-2 right-2">
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                    {secondaryBannerFields.length < 4 && (
                                        <Button type="button" variant="outline" onClick={() => appendSecondaryBanner({ imageUrl: '', title: '', subtitle: '', linkUrl: '' })}>
                                            <PlusCircle className="mr-2 h-4 w-4"/> Añadir Diapositiva
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="featured-books">
                            <Card>
                                <CardHeader><CardTitle>Libros Destacados</CardTitle><CardDescription>Selecciona hasta 5 libros para mostrar en la sección de destacados de la página principal.</CardDescription></CardHeader>
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

                        <TabsContent value="national-section">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sección de Libros Nacionales</CardTitle>
                                    <CardDescription>Configura la sección que destaca libros de una región o tema específico (ej. "Joyas Ecuatorianas").</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <FormField
                                        control={homepageForm.control}
                                        name="nationalSectionTitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Título de la Sección</FormLabel>
                                                <FormControl><Input placeholder="Libros Ecuatorianos" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={homepageForm.control}
                                        name="nationalBookIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Libros para la Sección Nacional</FormLabel>
                                                <FormControl>
                                                    <MultiSelect
                                                        placeholder="Selecciona hasta 10 libros..."
                                                        options={bookOptions}
                                                        value={field.value || []}
                                                        onChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Selecciona los libros que aparecerán en esta sección.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>

                    <Separator className="my-6"/>
                    
                    <Button type="submit" disabled={isSavingHomepage} size="lg">
                        {isSavingHomepage ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Guardar Contenido de Homepage
                    </Button>
                </form>
            </Form>
        </div>
    );
}
