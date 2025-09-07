// src/app/(app)/authors/dashboard/page.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Wand2, Bot, Download, LogOut, Link as LinkIcon, BookOpen, Save, ImagePlus, Globe, Facebook, Instagram, BarChart2, Rocket, ChevronRight, User, Heart, QrCode, Lightbulb, Star, Copy, Image as ImageIcon, Video, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateMarketingPlan, type GenerateMarketingPlanOutput } from '@/ai/flows/generate-marketing-plan';
import { analyzeMarketAndCompetition, type MarketAnalysisOutput } from '@/ai/flows/market-analysis';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import type { User, Author, Book } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';
import { BookCard } from '@/components/BookCard';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { slugify } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bookCategories } from '@/lib/options';
import { QRCodeSVG } from 'qrcode.react';
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { generateContentStudio, type GenerateContentStudioOutput } from '@/ai/flows/generate-content-studio';
import { regenerateImage } from '@/ai/flows/regenerate-image';


const marketingPlanFormSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  author: z.string().min(2, "El autor es requerido."),
  synopsis: z.string().min(20, "La sinopsis debe tener al menos 20 caracteres."),
  targetAudience: z.string().min(10, "Describe tu público objetivo."),
});
type MarketingPlanFormValues = z.infer<typeof marketingPlanFormSchema>;

const authorProfileFormSchema = z.object({
    bio: z.string().min(10, { message: "La biografía debe tener al menos 10 caracteres." }),
    website: z.string().url({ message: "URL de sitio web no válida." }).optional().or(z.literal('')),
    instagram: z.string().url({ message: "URL de Instagram no válida." }).optional().or(z.literal('')),
    facebook: z.string().url({ message: "URL de Facebook no válida." }).optional().or(z.literal('')),
    x: z.string().url({ message: "URL de X (Twitter) no válida." }).optional().or(z.literal('')),
    tiktok: z.string().url({ message: "URL de TikTok no válida." }).optional().or(z.literal('')),
    youtube: z.string().url({ message: "URL de YouTube no válida." }).optional().or(z.literal('')),
});
type AuthorProfileFormValues = z.infer<typeof authorProfileFormSchema>;

const marketAnalysisFormSchema = z.object({
    authorGenre: z.string().min(1, { message: "Debes seleccionar un género." }),
    authorBookTitle: z.string().min(3, { message: "El título de referencia es requerido." }),
});
type MarketAnalysisFormValues = z.infer<typeof marketAnalysisFormSchema>;

const contentStudioFormSchema = z.object({
  prompt: z.string().min(10, { message: "La idea debe tener al menos 10 caracteres." }),
  platform: z.enum(['Instagram', 'TikTok', 'Facebook']),
  format: z.enum(['Post', 'Story', 'Reel']),
});
type ContentStudioFormValues = z.infer<typeof contentStudioFormSchema>;

// Dummy data for followers
const placeholderFollowers: User[] = [
    { id: '1', name: 'Lector Apasionado', email: 'lector1@email.com', role: 'reader' },
    { id: '2', name: 'Ana Reseñas', email: 'ana.r@email.com', role: 'reader' },
    { id: '3', name: 'Carlos Libros', email: 'carlos.libros@email.com', role: 'reader' },
];

const StatCard = ({ title, value, icon: Icon, isLoading, description }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean, description?: string }) => {
    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="pt-2"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              <div className="text-2xl font-bold">{value}</div>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </>
          )}
        </CardContent>
      </Card>
    );
};

const marketingTips = [
  { title: "1. Crea expectativa antes del lanzamiento", points: ["Empieza a hablar del libro 30 a 60 días antes.", "Publica frases, fragmentos o citas llamativas.", "Usa el concepto de “coming soon” (ej. portada borrosa y revelar después)."] },
  { title: "2. Usa un Booktrailer", points: ["Un video corto (30–60 seg.) con música + imágenes + texto impactante.", "Ideal para Instagram Reels, TikTok y YouTube Shorts.", "En Alicia puedes generar un guion y assets automáticamente."] },
  { title: "3. Activa la preventa", points: ["Permite comprar el libro antes del lanzamiento.", "Ofrece beneficios:", "Firma digital o física.", "Descuento en preventa.", "Acceso a un capítulo exclusivo."] },
  { title: "4. Haz de tu portada tu mejor campaña", points: ["Una portada llamativa multiplica las posibilidades de compra.", "Muestra varias opciones y haz una encuesta en redes para que los lectores participen."] },
  { title: "5. Crea comunidad en redes sociales", points: ["Comparte tu proceso de escritura, anécdotas, fotos del “detrás de cámaras”.", "Usa hashtags específicos (#LecturaJuvenil #RomanceHistórico, etc.).", "Interactúa: responde comentarios, pregunta opiniones, genera cercanía."] },
  { title: "6. Conecta con bookstagrammers, booktokers y bloggers", points: ["Regala copias digitales para que hagan reseñas honestas.", "Un buen review en redes puede tener más impacto que una publicidad pagada."] },
  { title: "7. Organiza un evento de lanzamiento (online o físico)", points: ["Firma de libros en una librería asociada.", "Transmisión en vivo por Facebook/Instagram/YouTube.", "Juegos o trivias sobre el libro con premios para los asistentes."] },
  { title: "8. Aprovecha el mailing", points: ["Envía correos a tus lectores con:", "Fecha de lanzamiento.", "Links de compra.", "Contenido exclusivo (ej. “detrás de la portada”)."] },
  { title: "9. Gamifica la experiencia", points: ["Crea retos de lectura (ej. leer el libro en 7 días y compartir reflexión).", "Sorteos: quien deje reseña entra en concurso por un ejemplar firmado.", "En Alicia, los lectores pueden ganar alitoks por leer y reseñar."] },
  { title: "10. No te olvides del post-lanzamiento", points: ["Comparte reseñas que te dejen.", "Publica fotos de los lectores con el libro.", "Mantén activa la conversación (club de lectura online, lives con preguntas)."] },
];


export default function AuthorDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [marketingPlan, setMarketingPlan] = useState<GenerateMarketingPlanOutput | null>(null);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysisOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GenerateContentStudioOutput | null>(null);
  const [editableContent, setEditableContent] = useState('');

  const [user, setUser] = useState<User | null>(null);
  const [authorProfile, setAuthorProfile] = useState<Author | null>(null);
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { toast } = useToast();
  const router = useRouter();
  const planContentRef = useRef<HTMLDivElement>(null);

  const marketingForm = useForm<MarketingPlanFormValues>({
    resolver: zodResolver(marketingPlanFormSchema),
    defaultValues: { title: "", author: "", synopsis: "", targetAudience: "" },
  });

  const profileForm = useForm<AuthorProfileFormValues>({
      resolver: zodResolver(authorProfileFormSchema),
      defaultValues: { bio: "", website: "", instagram: "", facebook: "", x: "", tiktok: "", youtube: "" },
  });
  
  const analysisForm = useForm<MarketAnalysisFormValues>({
      resolver: zodResolver(marketAnalysisFormSchema),
      defaultValues: { authorGenre: "", authorBookTitle: "" },
  });
  
  const contentForm = useForm<ContentStudioFormValues>({
    resolver: zodResolver(contentStudioFormSchema),
    defaultValues: { prompt: "", platform: "Instagram", format: "Post" },
  });
  
  const fetchAuthorData = async (userData: User) => {
      if (db) {
          const q = query(collection(db, "authors"), where("name", "==", userData.name), limit(1));
          const authorSnapshot = await getDocs(q);
          if (!authorSnapshot.empty) {
              const authorDoc = authorSnapshot.docs[0];
              const authorData = {id: authorDoc.id, ...authorDoc.data()} as Author;
              setAuthorProfile(authorData);
              setImagePreview(authorData.imageUrl);
              profileForm.reset({
                  bio: authorData.bio || "",
                  website: authorData.website || "",
                  instagram: authorData.instagram || "",
                  facebook: authorData.facebook || "",
                  x: authorData.x || "",
                  tiktok: authorData.tiktok || "",
                  youtube: authorData.youtube || "",
              });
              
              const booksQuery = query(collection(db, "books"), where("authors", "array-contains", authorData.name));
              const booksSnapshot = await getDocs(booksQuery);
              const fetchedBooks = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
              setAuthorBooks(fetchedBooks);

              if (fetchedBooks.length > 0) {
                  analysisForm.setValue("authorBookTitle", fetchedBooks[0].title);
                  if (fetchedBooks[0].categories && fetchedBooks[0].categories.length > 0) {
                      analysisForm.setValue("authorGenre", fetchedBooks[0].categories[0]);
                  }
              }
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
  }, [router, marketingForm, analysisForm]);

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
      const result = await generateMarketingPlan({
        ...values,
        authorProfile: authorProfile ? {
            bio: authorProfile.bio,
            website: authorProfile.website,
            instagram: authorProfile.instagram,
            facebook: authorProfile.facebook,
            x: authorProfile.x,
            tiktok: authorProfile.tiktok,
            youtube: authorProfile.youtube,
        } : undefined,
        marketAnalysis,
      });
      setMarketingPlan(result);
      toast({ title: "¡Plan de Lanzamiento Generado!", description: "Tu plan personalizado está listo." });
    } catch (error: any) {
      toast({ title: "Error al generar el plan", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmitAnalysis = async (values: MarketAnalysisFormValues) => {
    setIsAnalyzing(true);
    setMarketAnalysis(null);
    try {
      const result = await analyzeMarketAndCompetition(values);
      setMarketAnalysis(result);
      toast({ title: "¡Análisis Completado!", description: "Las tendencias y sugerencias están listas." });
    } catch (error: any) {
      toast({ title: "Error al analizar", description: error.message, variant: "destructive" });
    } finally {
        setIsAnalyzing(false);
    }
  }

  const onSubmitContentStudio = async (values: ContentStudioFormValues) => {
    setIsGeneratingContent(true);
    setGeneratedContent(null);
    try {
      const result = await generateContentStudio(values);
      setGeneratedContent(result);
      setEditableContent(result.text); 
      toast({ title: "¡Contenido Generado!", description: "Tu nueva publicación está lista para revisar." });
    } catch (error: any) {
      toast({ title: "Error al generar contenido", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!generatedContent || !contentForm.getValues('prompt')) return;
    setIsGeneratingImage(true);
    try {
        const result = await regenerateImage({ prompt: contentForm.getValues('prompt') });
        setGeneratedContent(prev => prev ? { ...prev, imageUrl: result.imageUrl } : null);
        toast({ title: "Imagen Regenerada", description: "Se ha creado una nueva imagen para tu publicación." });
    } catch (error: any) {
        toast({ title: "Error al regenerar imagen", description: error.message, variant: "destructive" });
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setProfileImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => setImagePreview(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', 'author_profiles');

    setUploadProgress(0);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload-image', true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                setUploadProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                resolve(response.downloadURL);
            } else {
                let errorMsg = "Error en la subida.";
                try { errorMsg = JSON.parse(xhr.responseText).error || errorMsg; } catch(e) {}
                reject(new Error(errorMsg));
            }
        };
        xhr.onerror = () => reject(new Error("Error de red durante la subida."));
        xhr.send(formData);
    });
  };

  const onSubmitAuthorProfile = async (values: AuthorProfileFormValues) => {
    if (!user || !db) return;
    setIsSavingProfile(true);
    setUploadProgress(0);

    try {
        let finalImageUrl = authorProfile?.imageUrl || '';
        if (profileImageFile) {
            finalImageUrl = await uploadFile(profileImageFile);
        }

        const data = {
            name: user.name,
            bio: values.bio,
            slug: slugify(user.name),
            imageUrl: finalImageUrl || `https://placehold.co/200x200.png?text=${user.name.charAt(0)}`,
            website: values.website,
            instagram: values.instagram,
            facebook: values.facebook,
            x: values.x,
            tiktok: values.tiktok,
            youtube: values.youtube,
        };

        if (authorProfile) {
            const authorRef = doc(db, "authors", authorProfile.id);
            await updateDoc(authorRef, data);
            toast({ title: "¡Perfil Actualizado!", description: "Tu perfil de autor ha sido actualizado." });
        } else {
            await addDoc(collection(db, "authors"), { ...data, createdAt: serverTimestamp(), countries: [] });
            toast({ title: "¡Perfil Creado!", description: "Tu perfil de autor ahora es público." });
        }
        await fetchAuthorData(user);
    } catch (error: any) {
        toast({ title: "Error al guardar perfil", description: error.message, variant: "destructive" });
    } finally {
        setIsSavingProfile(false);
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
      pdf.save(`Plan_Lanzamiento_${title}.pdf`);
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
      <header className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Panel de Autor</h1>
          <p className="text-lg text-foreground/80">Bienvenido/a, {user.name}.</p>
        </div>
        <Button onClick={handleLogout} variant="outline"><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</Button>
      </header>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
            <TabsTrigger value="analysis">Análisis de Mercado</TabsTrigger>
            <TabsTrigger value="content-studio">Estudio de Contenido</TabsTrigger>
            <TabsTrigger value="marketing">Plan de Marketing</TabsTrigger>
            <TabsTrigger value="tips">Tips de Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <StatCard title="Libros Vendidos" value="1,234" icon={BookOpen} isLoading={false} description="+50 en la última semana"/>
                <StatCard title="Ventas del Mes" value="$1,580.50" icon={BarChart2} isLoading={false} />
                <StatCard title="Seguidores" value="89" icon={Heart} isLoading={false} description="Lectores que te siguen."/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <Card className="shadow-md">
                        <CardHeader><CardTitle className="font-headline text-lg">Atajos</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <Button size="lg" className="w-full justify-start text-base py-3 shadow-sm hover:shadow-md transition-shadow">
                                <Rocket className="mr-3 h-5 w-5" /> Crear Plan de Marketing
                            </Button>
                             <Button size="lg" variant="outline" className="w-full justify-start text-base py-3 shadow-sm hover:shadow-md transition-shadow">
                                <BarChart2 className="mr-3 h-5 w-5" /> Analizar Mercado
                            </Button>
                             <Button size="lg" variant="outline" className="w-full justify-start text-base py-3 shadow-sm hover:shadow-md transition-shadow">
                                <Save className="mr-3 h-5 w-5" /> Editar Perfil
                            </Button>
                        </CardContent>
                    </Card>
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg flex items-center"><QrCode className="mr-2 h-5 w-5 text-primary"/>Tu Código de Autor</CardTitle>
                            <CardDescription>Permite que los lectores te sigan escaneando este código.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center items-center p-6">
                           {authorProfile?.slug ? <div className="p-4 bg-white rounded-lg"><QRCodeSVG value={`${window.location.origin}/authors/${authorProfile.slug}`} size={140} /></div> : <p>Guarda tu perfil para generar el QR.</p>}
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-2">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>Tus Seguidores ({placeholderFollowers.length})</CardTitle>
                            <CardDescription>Lectores que han marcado tu perfil como favorito.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableBody>
                                    {placeholderFollowers.map((follower) => (
                                    <TableRow key={follower.id}>
                                        <TableCell className="w-[50px]">
                                            <Image src={follower.avatarUrl || `https://placehold.co/100x100.png?text=${follower.name.charAt(0)}`} alt={follower.name} width={40} height={40} className="rounded-full" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{follower.name}</div>
                                            <div className="text-xs text-muted-foreground">{follower.email}</div>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>
        
        <TabsContent value="content-studio" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center"><Wand2 className="mr-2 h-6 w-6 text-primary"/>Estudio de Contenido</CardTitle>
                <CardDescription>Genera publicaciones para redes sociales con IA para promocionar tus libros.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <Form {...contentForm}>
                            <form onSubmit={contentForm.handleSubmit(onSubmitContentStudio)} className="space-y-4">
                                <FormField control={contentForm.control} name="prompt" render={({ field }) => ( <FormItem><FormLabel>Idea o Prompt</FormLabel><FormControl><Textarea rows={4} placeholder="Ej: Anunciar el lanzamiento de mi nueva novela de fantasía 'El Último Dragón'" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={contentForm.control} name="platform" render={({ field }) => ( <FormItem><FormLabel>Plataforma</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Instagram">Instagram</SelectItem><SelectItem value="TikTok">TikTok</SelectItem><SelectItem value="Facebook">Facebook</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                                    <FormField control={contentForm.control} name="format" render={({ field }) => ( <FormItem><FormLabel>Formato</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Post">Post</SelectItem><SelectItem value="Story">Story</SelectItem><SelectItem value="Reel">Reel</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                                </div>
                                <Button type="submit" disabled={isGeneratingContent} className="w-full">{isGeneratingContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}{isGeneratingContent ? 'Generando...' : 'Generar Contenido'}</Button>
                            </form>
                        </Form>
                    </div>
                    <div>
                        <Label>Resultado</Label>
                        <Card className="mt-2 min-h-[300px] flex flex-col items-center justify-center p-4 gap-4">
                          {isGeneratingContent ? (
                              <div className="text-center p-8"><Loader2 className="h-10 w-10 animate-spin text-primary mb-4" /><p className="text-muted-foreground">AlicIA está creando...</p></div>
                          ) : generatedContent ? (
                            <div className="w-full space-y-4">
                                {isGeneratingImage ? (
                                    <div className="aspect-square w-full rounded-lg border bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                                ) : (
                                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
                                        <Image src={generatedContent.imageUrl} alt="Imagen generada por IA" layout="fill" objectFit="cover" />
                                    </div>
                                )}
                                <div className="flex gap-2">
                                     <Button variant="outline" size="sm" onClick={handleRegenerateImage} disabled={isGeneratingImage}><RefreshCw className="mr-2 h-3 w-3"/>Crear otra imagen</Button>
                                     <Button variant="outline" size="sm" disabled={true}><Video className="mr-2 h-3 w-3"/>Generar Video (Pronto)</Button>
                                </div>
                                 <div>
                                    <Label className="text-sm font-medium">Texto Sugerido</Label>
                                    <Textarea value={editableContent} onChange={(e) => setEditableContent(e.target.value)} rows={6} className="text-sm bg-background mt-1"/>
                                    <div className="flex justify-between items-center text-sm mt-2">
                                        <span className="text-muted-foreground">Hora sugerida: <strong className="text-foreground">{generatedContent.suggestedTime}</strong></span>
                                        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(editableContent)}><Copy className="mr-2 h-3 w-3"/>Copiar Texto</Button>
                                    </div>
                                </div>

                                {generatedContent.reelScript && (
                                    <div>
                                        <Label className="text-sm font-medium">Guion y Audio para Reel</Label>
                                        <div className="mt-1 p-3 border rounded-md bg-muted/50 space-y-3">
                                            <Textarea readOnly value={generatedContent.reelScript} rows={5} className="text-xs bg-background"/>
                                            {generatedContent.audioUrl && (
                                                <audio controls src={generatedContent.audioUrl} className="w-full h-10">
                                                    Tu navegador no soporta el elemento de audio.
                                                </audio>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                          ) : (
                              <div className="text-center p-8"><ImageIcon className="h-10 w-10 text-muted-foreground mb-4"/><p className="text-muted-foreground">El contenido generado aparecerá aquí.</p></div>
                          )}
                        </Card>
                    </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                   <Card className="sticky top-24 shadow-lg">
                    <CardHeader><CardTitle className="font-headline text-2xl flex items-center"><Wand2 className="mr-2 h-6 w-6 text-primary" />Crea tu Plan de Lanzamiento</CardTitle><CardDescription>Ingresa los detalles de tu libro y la IA creará un plan a tu medida.</CardDescription></CardHeader>
                    <CardContent>
                      <Form {...marketingForm}>
                        <form onSubmit={marketingForm.handleSubmit(onSubmitMarketingPlan)} className="space-y-4">
                          <FormField control={marketingForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título del Libro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={marketingForm.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Autor del Libro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={marketingForm.control} name="synopsis" render={({ field }) => ( <FormItem><FormLabel>Sinopsis</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={marketingForm.control} name="targetAudience" render={({ field }) => ( <FormItem><FormLabel>Público Objetivo</FormLabel><FormControl><Textarea {...field} placeholder="Ej: Jóvenes adultos, amantes de la fantasía..." rows={3} /></FormControl><FormMessage /></FormItem> )} />
                          <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}{isLoading ? 'Generando...' : 'Generar Plan de Lanzamiento'}</Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>
                <div className="lg:col-span-2">
                    {isLoading && ( <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md min-h-[50vh]"><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><p className="font-headline text-xl text-foreground">Creando tu plan...</p><p className="text-muted-foreground">La IA está analizando tu libro.</p></div> )}
                    {!isLoading && !marketingPlan && ( <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md min-h-[50vh]"><Bot className="h-12 w-12 text-muted-foreground mb-4" /><p className="font-headline text-xl text-foreground">Tu plan de lanzamiento aparecerá aquí</p><p className="text-muted-foreground">Completa el formulario para empezar.</p></div> )}
                    {marketingPlan && (
                      <div className="space-y-6">
                        <div ref={planContentRef} className="bg-background p-8 rounded-lg">
                            <div className="text-center mb-8"><h2 className="font-headline text-3xl font-bold text-primary">Plan de Lanzamiento para:</h2><h3 className="text-2xl font-semibold text-foreground">{marketingForm.getValues('title')}</h3><p className="text-muted-foreground">por {marketingForm.getValues('author')}</p></div>
                            <div className="space-y-6">
                                <Card className="shadow-md"><CardHeader><CardTitle className="font-headline text-xl">Slogan Sugerido</CardTitle></CardHeader><CardContent><blockquote className="border-l-4 border-primary pl-4 text-lg italic text-foreground">{marketingPlan.slogan}</blockquote></CardContent></Card>
                                <Card className="shadow-md"><CardHeader><CardTitle className="font-headline text-xl">Análisis de Público Objetivo</CardTitle></CardHeader><CardContent className="text-muted-foreground whitespace-pre-wrap">{marketingPlan.targetAudienceAnalysis}</CardContent></Card>
                                <Card className="shadow-md"><CardHeader><CardTitle className="font-headline text-xl">Estrategias de Lanzamiento</CardTitle></CardHeader><CardContent className="space-y-3">{marketingPlan.launchStrategies.map((strategy, index) => (<p key={index} className="text-muted-foreground">{index + 1}. {strategy}</p>))}</CardContent></Card>
                                <Card className="shadow-md"><CardHeader><CardTitle className="font-headline text-xl">Ejemplos de Publicaciones para Redes Sociales</CardTitle></CardHeader><CardContent className="space-y-6">{marketingPlan.socialMediaPosts.map((post, index) => (<div key={index}><p className="text-foreground bg-muted p-4 rounded-md whitespace-pre-wrap">{post}</p>{index < marketingPlan.socialMediaPosts.length - 1 && <Separator className="mt-6" />}</div>))}</CardContent></Card>
                            </div>
                        </div>
                        <Button onClick={handleDownloadPdf} disabled={isDownloading} className="w-full mt-4">{isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}{isDownloading ? 'Descargando PDF...' : 'Descargar como PDF'}</Button>
                      </div>
                    )}
                </div>
            </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2">
                    {authorProfile ? (
                       <Card className="shadow-lg">
                           <CardHeader><CardTitle>Tu Perfil de Autor</CardTitle><CardDescription>Esta información será visible públicamente en tu página de autor. ¡Asegúrate de que sea atractiva! <strong className="font-semibold text-foreground/90">Esta información también ayudará a crear tu plan de marketing.</strong></CardDescription></CardHeader>
                           <CardContent>
                               <Form {...profileForm}>
                                   <form onSubmit={profileForm.handleSubmit(onSubmitAuthorProfile)} className="space-y-6">
                                        <FormField control={profileForm.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Biografía</FormLabel><FormControl><Textarea {...field} rows={5} placeholder="Cuéntanos sobre ti, tu estilo de escritura, tus inspiraciones..."/></FormControl><FormMessage /></FormItem> )}/>
                                        <div className="space-y-2"><Label>Tu foto de perfil</Label><div className="flex items-center gap-4">{imagePreview && <Image src={imagePreview} alt="Vista previa" width={80} height={80} className="rounded-full aspect-square object-cover" />}<div className="flex-grow space-y-2"><div className="space-y-2"><Label htmlFor="profile-image-upload" className="text-xs text-muted-foreground">Sube un archivo nuevo (recomendado)</Label><Input id="profile-image-upload" type="file" accept="image/*" onChange={handleProfileImageChange} /></div></div></div></div>
                                        <h3 className="font-headline text-lg border-t pt-4">Enlaces Sociales y Web</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField control={profileForm.control} name="website" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4"/>Sitio Web</FormLabel><FormControl><Input {...field} placeholder="https://tuweb.com" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                            <FormField control={profileForm.control} name="instagram" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Instagram className="h-4 w-4"/>Instagram</FormLabel><FormControl><Input {...field} placeholder="https://instagram.com/tu-usuario" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                            <FormField control={profileForm.control} name="facebook" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Facebook className="h-4 w-4"/>Facebook</FormLabel><FormControl><Input {...field} placeholder="https://facebook.com/tu-pagina" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                            <FormField control={profileForm.control} name="x" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><XIcon className="h-4 w-4"/>X (Twitter)</FormLabel><FormControl><Input {...field} placeholder="https://x.com/tu-usuario" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                            <FormField control={profileForm.control} name="tiktok" render={({ field }) => ( <FormItem><FormLabel>TikTok</FormLabel><FormControl><Input {...field} placeholder="https://tiktok.com/@tu-usuario" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                            <FormField control={profileForm.control} name="youtube" render={({ field }) => ( <FormItem><FormLabel>YouTube</FormLabel><FormControl><Input {...field} placeholder="https://youtube.com/c/tu-canal" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                        </div>
                                        {isSavingProfile && <Progress value={uploadProgress} className="w-full" />}
                                        <Button type="submit" className="w-full" disabled={isSavingProfile}>{isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}{isSavingProfile ? "Guardando Perfil..." : "Actualizar Perfil"}</Button>
                                   </form>
                               </Form>
                           </CardContent>
                       </Card>
                    ) : (
                         <Card className="shadow-lg">
                           <CardHeader><CardTitle>Crea tu Perfil de Autor Público</CardTitle><CardDescription>Para que los lectores puedan descubrirte, completa tu perfil. Esta información será visible en la plataforma.</CardDescription></CardHeader>
                           <CardContent>
                               <Form {...profileForm}>
                                   <form onSubmit={profileForm.handleSubmit(onSubmitAuthorProfile)} className="space-y-6">
                                        <FormField control={profileForm.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Biografía</FormLabel><FormControl><Textarea {...field} rows={5} placeholder="Cuéntanos sobre ti, tu estilo de escritura, tus inspiraciones..."/></FormControl><FormMessage /></FormItem> )}/>
                                        <div className="space-y-2"><Label htmlFor="profile-image-upload">Tu foto de perfil</Label>{imagePreview && <Image src={imagePreview} alt="Vista previa" width={80} height={80} className="rounded-full aspect-square object-cover" />}<Input id="profile-image-upload" type="file" accept="image/*" onChange={handleProfileImageChange} required/></div>
                                         <h3 className="font-headline text-lg border-t pt-4">Enlaces Sociales y Web</h3>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField control={profileForm.control} name="website" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4"/>Sitio Web</FormLabel><FormControl><Input {...field} placeholder="https://tuweb.com" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                            <FormField control={profileForm.control} name="instagram" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Instagram className="h-4 w-4"/>Instagram</FormLabel><FormControl><Input {...field} placeholder="https://instagram.com/tu-usuario" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                            <FormField control={profileForm.control} name="facebook" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><Facebook className="h-4 w-4"/>Facebook</FormLabel><FormControl><Input {...field} placeholder="https://facebook.com/tu-pagina" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                            <FormField control={profileForm.control} name="x" render={({ field }) => ( <FormItem><FormLabel className="flex items-center gap-2"><XIcon className="h-4 w-4"/>X (Twitter)</FormLabel><FormControl><Input {...field} placeholder="https://x.com/tu-usuario" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                            <FormField control={profileForm.control} name="tiktok" render={({ field }) => ( <FormItem><FormLabel>TikTok</FormLabel><FormControl><Input {...field} placeholder="https://tiktok.com/@tu-usuario" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                            <FormField control={profileForm.control} name="youtube" render={({ field }) => ( <FormItem><FormLabel>YouTube</FormLabel><FormControl><Input {...field} placeholder="https://youtube.com/c/tu-canal" value={field.value || ''}/></FormControl><FormMessage /></FormItem> )}/>
                                        </div>
                                        {isSavingProfile && <Progress value={uploadProgress} className="w-full" />}
                                        <Button type="submit" className="w-full" disabled={isSavingProfile}>{isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Crear Perfil</Button>
                                   </form>
                               </Form>
                           </CardContent>
                       </Card>
                    )}
               </div>
               <div className="md:col-span-1">
                   <Card className="shadow-lg"><CardHeader><CardTitle className="font-headline text-lg flex items-center"><BookOpen className="mr-2 h-5 w-5"/>Tus Libros Publicados</CardTitle></CardHeader>
                       <CardContent>{authorBooks.length > 0 ? ( <div className="grid grid-cols-2 gap-4">{authorBooks.map(book => <BookCard key={book.id} book={book} size="small" />)}</div> ) : ( <p className="text-muted-foreground text-center py-8">Aún no tienes libros publicados en la plataforma.</p> )}</CardContent>
                   </Card>
               </div>
           </div>
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="font-headline text-2xl flex items-center"><BarChart2 className="mr-2 h-6 w-6 text-primary"/>Análisis de Mercado y Competencia</CardTitle><CardDescription>Obtén una ventaja estratégica. Selecciona tu género y un libro de referencia para que la IA genere un análisis detallado.</CardDescription></CardHeader>
            <CardContent>
              <Form {...analysisForm}>
                <form onSubmit={analysisForm.handleSubmit(onSubmitAnalysis)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={analysisForm.control} name="authorGenre" render={({ field }) => ( <FormItem><FormLabel>Género Principal</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un género"/></SelectTrigger></FormControl><SelectContent>{bookCategories.map(c => <SelectItem key={c.value} value={c.label}>{c.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                        <FormField control={analysisForm.control} name="authorBookTitle" render={({ field }) => (
                           <FormItem>
                               <FormLabel>Libro de Referencia</FormLabel>
                               <FormControl>
                                   <Input placeholder="Escribe el título de un libro" {...field} />
                               </FormControl>
                               <FormMessage />
                           </FormItem>
                        )}/>
                    </div>
                     {authorBooks.length > 0 && (
                        <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">O selecciona uno de tus libros para rellenar el campo:</FormLabel>
                            <Select onValueChange={(value) => analysisForm.setValue('authorBookTitle', value)}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Selecciona uno de tus libros..."/></SelectTrigger>
                                </FormControl>
                                <SelectContent>{authorBooks.map(b => <SelectItem key={b.id} value={b.title}>{b.title}</SelectItem>)}</SelectContent>
                            </Select>
                        </FormItem>
                     )}
                    <Button type="submit" disabled={isAnalyzing} className="w-full md:w-auto">{isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}{isAnalyzing ? 'Analizando...' : 'Analizar Mercado'}</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          {isAnalyzing && (<div className="flex flex-col items-center justify-center text-center p-8 mt-6 bg-card rounded-lg shadow-md"><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><p className="font-headline text-xl text-foreground">Analizando el mercado...</p><p className="text-muted-foreground">La IA está estudiando tendencias y competidores.</p></div>)}
          {marketAnalysis && (
            <div className="mt-6 space-y-6 animate-fadeIn">
              <Card><CardHeader><CardTitle>Tendencias del Mercado</CardTitle></CardHeader><CardContent className="space-y-4"><div><h4 className="font-semibold">Géneros en Crecimiento</h4><p className="text-muted-foreground">{marketAnalysis.marketTrends.growingGenres.join(', ')}</p></div><div><h4 className="font-semibold">Perfil del Lector Objetivo</h4><p className="text-muted-foreground whitespace-pre-wrap">{marketAnalysis.marketTrends.targetAudienceProfile}</p></div><div><h4 className="font-semibold">Precio Promedio</h4><p className="text-muted-foreground">{marketAnalysis.marketTrends.averagePrice}</p></div></CardContent></Card>
              <Card><CardHeader><CardTitle>Análisis de Competencia</CardTitle></CardHeader><CardContent className="space-y-4"><div><h4 className="font-semibold">Autores Similares</h4><p className="text-muted-foreground">{marketAnalysis.competitorAnalysis.similarAuthors.join(', ')}</p></div><div><h4 className="font-semibold">Análisis de Portadas</h4><p className="text-muted-foreground whitespace-pre-wrap">{marketAnalysis.competitorAnalysis.coverAnalysis}</p></div><div><h4 className="font-semibold">Análisis de Descripciones</h4><p className="text-muted-foreground whitespace-pre-wrap">{marketAnalysis.competitorAnalysis.descriptionAnalysis}</p></div><div><h4 className="font-semibold">Estrategias de Marketing</h4><p className="text-muted-foreground whitespace-pre-wrap">{marketAnalysis.competitorAnalysis.marketingStrategies}</p></div></CardContent></Card>
              <Card className="bg-primary/5 border-primary/20"><CardHeader><CardTitle>Sugerencias de la IA</CardTitle></CardHeader><CardContent className="space-y-4"><div><h4 className="font-semibold">Tono y Estilo para Diferenciarte</h4><p className="text-muted-foreground whitespace-pre-wrap">{marketAnalysis.aiSuggestions.toneAndStyle}</p></div><div><h4 className="font-semibold">Diferenciación de Audiencia</h4><p className="text-muted-foreground whitespace-pre-wrap">{marketAnalysis.aiSuggestions.targetAudienceDifferentiation}</p></div><div><h4 className="font-semibold">Sugerencias Visuales (Portadas)</h4><p className="text-muted-foreground whitespace-pre-wrap">{marketAnalysis.aiSuggestions.visualSuggestions}</p></div></CardContent></Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tips" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <Lightbulb className="mr-2 h-6 w-6 text-primary" />
                Tips de Marketing para el Lanzamiento de tu Libro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {marketingTips.map((tip, index) => (
                <Card key={index} className="shadow-sm">
                  <CardHeader><CardTitle className="font-headline text-lg">{tip.title}</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                      {tip.points.map((point, pointIndex) => (
                        <li key={pointIndex}>{point}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex items-center">
                      <Star className="mr-2 h-5 w-5 text-amber-400 fill-amber-400"/>
                      Extra: Tu Marca Personal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Siempre piensa en tu libro como una marca personal. No es solo la obra, sino tú como autor lo que conecta con los lectores.</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
