// src/app/(app)/authors/dashboard/page.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Wand2, Bot, Download, LogOut, Link as LinkIcon, BookOpen, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateMarketingPlan, type GenerateMarketingPlanOutput } from '@/ai/flows/generate-marketing-plan';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import type { User, Author, Book } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';
import { BookCard } from '@/components/BookCard';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { slugify } from '@/lib/utils';

const marketingPlanFormSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  author: z.string().min(2, "El autor es requerido."),
  synopsis: z.string().min(20, "La sinopsis debe tener al menos 20 caracteres."),
  targetAudience: z.string().min(10, "Describe tu público objetivo."),
});
type MarketingPlanFormValues = z.infer<typeof marketingPlanFormSchema>;

const authorProfileFormSchema = z.object({
    bio: z.string().min(10, { message: "La biografía debe tener al menos 10 caracteres." }),
    imageUrl: z.string().url({ message: "Debe ser una URL de imagen válida." }).optional().or(z.literal('')),
});
type AuthorProfileFormValues = z.infer<typeof authorProfileFormSchema>;


export default function AuthorDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [marketingPlan, setMarketingPlan] = useState<GenerateMarketingPlanOutput | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authorProfile, setAuthorProfile] = useState<Author | null>(null);
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);

  const { toast } = useToast();
  const router = useRouter();
  const planContentRef = useRef<HTMLDivElement>(null);

  const marketingForm = useForm<MarketingPlanFormValues>({
    resolver: zodResolver(marketingPlanFormSchema),
    defaultValues: { title: "", author: "", synopsis: "", targetAudience: "" },
  });

  const profileForm = useForm<AuthorProfileFormValues>({
      resolver: zodResolver(authorProfileFormSchema),
      defaultValues: { bio: "", imageUrl: "" },
  });
  
  const fetchAuthorData = async (userData: User) => {
      if (db) {
          const q = query(collection(db, "authors"), where("name", "==", userData.name), limit(1));
          const authorSnapshot = await getDocs(q);
          if (!authorSnapshot.empty) {
              const authorData = {id: authorSnapshot.docs[0].id, ...authorSnapshot.docs[0].data()} as Author;
              setAuthorProfile(authorData);
              
              const booksQuery = query(collection(db, "books"), where("authors", "array-contains", authorData.name));
              const booksSnapshot = await getDocs(booksQuery);
              setAuthorBooks(booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
          } else {
              setAuthorProfile(null);
          }
      }
  }

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
        const authStatus = localStorage.getItem("isAuthenticated") === "true";
        if (!authStatus) {
          router.push("/author-login");
          return;
        }
        
        const userDataString = localStorage.getItem("aliciaLibros_user");
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            if (userData.role !== 'author') {
                router.push("/author-login");
                return;
            }
            setUser(userData);
            marketingForm.setValue("author", userData.name);
            await fetchAuthorData(userData);

        } else {
            router.push("/author-login");
        }
    };
    checkAuthAndFetchData();
  }, [router, marketingForm]);

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("aliciaLibros_user");
    router.push("/author-login");
    toast({ title: "Sesión Cerrada" });
  };

  const onSubmitMarketingPlan = async (values: MarketingPlanFormValues) => {
    setIsLoading(true);
    setMarketingPlan(null);
    try {
      const result = await generateMarketingPlan(values);
      setMarketingPlan(result);
      toast({ title: "¡Plan de Marketing Generado!", description: "Tu plan personalizado está listo." });
    } catch (error: any) {
      toast({ title: "Error al generar el plan", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmitAuthorProfile = async (values: AuthorProfileFormValues) => {
    if (!user || !db) return;
    setIsCreatingProfile(true);
    try {
        await addDoc(collection(db, "authors"), {
            name: user.name,
            bio: values.bio,
            imageUrl: values.imageUrl || `https://placehold.co/200x200.png?text=${user.name.charAt(0)}`,
            slug: slugify(user.name),
            countries: [],
            createdAt: serverTimestamp(),
        });
        toast({ title: "¡Perfil Creado!", description: "Tu perfil de autor ahora es público." });
        await fetchAuthorData(user); // Re-fetch author data to update UI
    } catch (error: any) {
        toast({ title: "Error al crear perfil", description: error.message, variant: "destructive" });
    } finally {
        setIsCreatingProfile(false);
    }
  }

  const handleDownloadPdf = async () => {
    if (!planContentRef.current || !marketingPlan) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(planContentRef.current, { scale: 2, backgroundColor: null, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const imgWidth = pdfWidth;
      const imgHeight = imgWidth / ratio;
      
      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const title = marketingForm.getValues('title').replace(/ /g, '_');
      pdf.save(`Plan_Marketing_${title}.pdf`);
    } catch (error) {
        console.error("Error creating PDF:", error);
        toast({ title: "Error al descargar PDF", description: "No se pudo generar el archivo PDF.", variant: "destructive" });
    } finally {
        setIsDownloading(false);
    }
  };

  if (!user) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
            Panel de Autor
          </h1>
          <p className="text-lg text-foreground/80">
            Bienvenido/a, {user.name}.
          </p>
        </div>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </header>

      <Tabs defaultValue="marketing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="marketing">Plan de Marketing</TabsTrigger>
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="marketing" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                   <Card className="sticky top-24 shadow-lg">
                    <CardHeader>
                      <CardTitle className="font-headline text-2xl flex items-center"><Wand2 className="mr-2 h-6 w-6 text-primary" />Crea tu Plan de Marketing</CardTitle>
                      <CardDescription>Ingresa los detalles de tu libro y la IA creará un plan de lanzamiento a tu medida.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...marketingForm}>
                        <form onSubmit={marketingForm.handleSubmit(onSubmitMarketingPlan)} className="space-y-4">
                          <FormField control={marketingForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título del Libro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={marketingForm.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Autor del Libro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={marketingForm.control} name="synopsis" render={({ field }) => ( <FormItem><FormLabel>Sinopsis</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={marketingForm.control} name="targetAudience" render={({ field }) => ( <FormItem><FormLabel>Público Objetivo</FormLabel><FormControl><Textarea {...field} placeholder="Ej: Jóvenes adultos, amantes de la fantasía..." rows={3} /></FormControl><FormMessage /></FormItem> )} />
                          <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Generando...' : 'Generar Plan'}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>
                <div className="lg:col-span-2">
                    {isLoading && ( <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md min-h-[50vh]"><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><p className="font-headline text-xl text-foreground">Creando tu plan...</p><p className="text-muted-foreground">La IA está analizando tu libro.</p></div> )}
                    {!isLoading && !marketingPlan && ( <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md min-h-[50vh]"><Bot className="h-12 w-12 text-muted-foreground mb-4" /><p className="font-headline text-xl text-foreground">Tu plan de marketing aparecerá aquí</p><p className="text-muted-foreground">Completa el formulario para empezar.</p></div> )}
                    {marketingPlan && (
                      <div className="space-y-6">
                        <div ref={planContentRef} className="bg-background p-8 rounded-lg">
                            <div className="text-center mb-8"><h2 className="font-headline text-3xl font-bold text-primary">Plan de Marketing para:</h2><h3 className="text-2xl font-semibold text-foreground">{marketingForm.getValues('title')}</h3><p className="text-muted-foreground">por {marketingForm.getValues('author')}</p></div>
                            <div className="space-y-6">
                                <Card className="shadow-md"><CardHeader><CardTitle className="font-headline text-xl">Slogan Sugerido</CardTitle></CardHeader><CardContent><blockquote className="border-l-4 border-primary pl-4 text-lg italic text-foreground">{marketingPlan.slogan}</blockquote></CardContent></Card>
                                <Card className="shadow-md"><CardHeader><CardTitle className="font-headline text-xl">Análisis de Público Objetivo</CardTitle></CardHeader><CardContent className="text-muted-foreground whitespace-pre-wrap">{marketingPlan.targetAudienceAnalysis}</CardContent></Card>
                                <Card className="shadow-md"><CardHeader><CardTitle className="font-headline text-xl">Estrategias de Lanzamiento</CardTitle></CardHeader><CardContent className="space-y-3">{marketingPlan.launchStrategies.map((strategy, index) => (<p key={index} className="text-muted-foreground">{index + 1}. {strategy}</p>))}</CardContent></Card>
                                <Card className="shadow-md"><CardHeader><CardTitle className="font-headline text-xl">Ejemplos de Publicaciones para Redes Sociales</CardTitle></CardHeader><CardContent className="space-y-6">{marketingPlan.socialMediaPosts.map((post, index) => (<div key={index}><p className="text-foreground bg-muted p-4 rounded-md whitespace-pre-wrap">{post}</p>{index < marketingPlan.socialMediaPosts.length - 1 && <Separator className="mt-6" />}</div>))}</CardContent></Card>
                            </div>
                        </div>
                        <Button onClick={handleDownloadPdf} disabled={isDownloading} className="w-full mt-4">
                          {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                          {isDownloading ? 'Descargando PDF...' : 'Descargar como PDF'}
                        </Button>
                      </div>
                    )}
                </div>
            </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-1">
                   {authorProfile ? (
                       <Card className="shadow-lg">
                           <CardHeader className="p-0">
                               <div className="relative aspect-square">
                                   <Image src={authorProfile.imageUrl} alt={authorProfile.name} layout="fill" objectFit="cover" className="rounded-t-lg"/>
                               </div>
                           </CardHeader>
                           <CardContent className="p-4 text-center">
                               <h2 className="font-headline text-2xl font-bold">{authorProfile.name}</h2>
                               <p className="text-sm text-muted-foreground mt-2">{authorProfile.bio.substring(0, 150)}...</p>
                           </CardContent>
                           <CardFooter>
                               <Button variant="outline" className="w-full" disabled>Editar Perfil (Próximamente)</Button>
                           </CardFooter>
                       </Card>
                   ) : (
                       <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Crea tu Perfil de Autor</CardTitle>
                                <CardDescription>Este perfil será público. ¡Haz que sea genial!</CardDescription>
                            </CardHeader>
                           <CardContent>
                               <Form {...profileForm}>
                                   <form onSubmit={profileForm.handleSubmit(onSubmitAuthorProfile)} className="space-y-4">
                                        <FormField control={profileForm.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Biografía</FormLabel><FormControl><Textarea {...field} rows={5} placeholder="Cuéntanos sobre ti, tu estilo de escritura, tus inspiraciones..."/></FormControl><FormMessage /></FormItem> )}/>
                                        <FormField control={profileForm.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>URL de tu foto de perfil</FormLabel><FormControl><Input {...field} placeholder="https://ejemplo.com/tu-foto.jpg"/></FormControl><FormMessage /></FormItem> )}/>
                                        <Button type="submit" className="w-full" disabled={isCreatingProfile}>
                                            {isCreatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                            {isCreatingProfile ? "Creando Perfil..." : "Crear Perfil"}
                                        </Button>
                                   </form>
                               </Form>
                           </CardContent>
                       </Card>
                   )}
                   <Card className="mt-8 shadow-lg">
                       <CardHeader><CardTitle className="font-headline text-lg flex items-center"><LinkIcon className="mr-2 h-5 w-5"/>Enlaces Públicos</CardTitle></CardHeader>
                       <CardContent className="space-y-2 text-sm">
                           <p className="text-muted-foreground">Aquí aparecerán tus enlaces a redes sociales, web, etc. (Próximamente)</p>
                       </CardContent>
                   </Card>
               </div>
               <div className="md:col-span-2">
                   <Card className="shadow-lg">
                       <CardHeader><CardTitle className="font-headline text-lg flex items-center"><BookOpen className="mr-2 h-5 w-5"/>Tus Libros Publicados</CardTitle></CardHeader>
                       <CardContent>
                           {authorBooks.length > 0 ? (
                               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                   {authorBooks.map(book => <BookCard key={book.id} book={book} size="small" />)}
                               </div>
                           ) : (
                               <p className="text-muted-foreground text-center py-8">Aún no tienes libros publicados en la plataforma.</p>
                           )}
                       </CardContent>
                   </Card>
               </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```
  </change>
  <change>
    <file>/src/lib/utils.ts</file>
    <content><![CDATA[import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
}
