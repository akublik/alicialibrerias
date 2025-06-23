
// src/app/(app)/dashboard/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { placeholderLibraries, placeholderBooks } from "@/lib/placeholders";
import type { Book, Library, User, Order } from "@/types";
import { LibraryCard } from "@/components/LibraryCard";
import { ShoppingBag, Heart, Sparkles, Edit3, LogOut, QrCode, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { format } from 'date-fns';
import { MultiSelect } from '@/components/ui/multi-select';
import { bookCategories, bookTags } from '@/lib/options';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { es } from 'date-fns/locale';
import { BookCard } from "@/components/BookCard";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getBookRecommendations } from '@/ai/flows/book-recommendations';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Tu nombre debe tener al menos 2 caracteres." }),
  birthdate: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true; // optional field
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
    if (!regex.test(val)) return false;
    
    const [day, month, year] = val.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }, {
    message: "Fecha inválida. Usa el formato DD/MM/AAAA.",
  }),
  favoriteCategories: z.array(z.string()).optional(),
  favoriteTags: z.array(z.string()).optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserData extends User {
  joinDate?: string;
  avatarUrl?: string;
  dataAiHint?: string;
}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [libraries, setLibraries] = useState<Map<string, string>>(new Map());
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [preferences, setPreferences] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<Book[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });

  const readingHistory = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const bookTitles = new Set<string>();
    orders.forEach(order => {
      order.items.forEach(item => {
        bookTitles.add(item.title);
      });
    });
    return Array.from(bookTitles);
  }, [orders]);

  // Effect to load user data from localStorage
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    if (!authStatus) {
      if (typeof window !== "undefined") router.push("/login");
      return;
    }
    setIsAuthenticated(true);

    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (userDataString) {
      try {
        const userData: User = JSON.parse(userDataString);
        if (userData.role === 'library') {
            router.replace('/library-admin/dashboard');
            return;
        }
        if (userData.role === 'superadmin') {
            router.replace('/superadmin/dashboard');
            return;
        }
        
        let joinDateStr = "Miembro reciente";
        if (userData.createdAt && (userData.createdAt as any).seconds) {
            const joinDate = new Date((userData.createdAt as any).seconds * 1000);
            joinDateStr = format(joinDate, "MMMM yyyy", { locale: es });
            joinDateStr = joinDateStr.charAt(0).toUpperCase() + joinDateStr.slice(1);
        }

        setUser({
          ...userData,
          joinDate: joinDateStr,
          avatarUrl: (userData as any).avatarUrl || "https://placehold.co/150x150.png",
          dataAiHint: (userData as any).dataAiHint || "user avatar",
        });

        if (db) {
            let unsubscribes: (() => void)[] = [];

            // Fetch Libraries for name mapping
            const libUnsub = onSnapshot(collection(db, "libraries"), (snapshot) => {
                const libMap = new Map<string, string>();
                snapshot.forEach(doc => {
                    libMap.set(doc.id, doc.data().name);
                });
                setLibraries(libMap);
            });
            unsubscribes.push(libUnsub);

            // Fetch user's orders
            const ordersRef = collection(db, "orders");
            const q = query(ordersRef, where("buyerId", "==", userData.id));
            const ordersUnsub = onSnapshot(q, (snapshot) => {
                const userOrders: Order[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    userOrders.push({
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                    } as Order);
                });
                userOrders.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
                setOrders(userOrders);
            });
            unsubscribes.push(ordersUnsub);

             const booksUnsub = onSnapshot(collection(db, "books"), (snapshot) => {
                const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
                setAllBooks(booksData);
            });
            unsubscribes.push(booksUnsub);

            return () => {
                unsubscribes.forEach(unsub => unsub());
            };
        }

      } catch (e) {
        console.error("Error parsing user data from localStorage", e);
        handleLogout();
      }
    } else {
      handleLogout();
    }
  }, [router]);

  // Effect to reset form when dialog opens
  useEffect(() => {
    if (user && isEditDialogOpen) {
      form.reset({
        name: user.name || '',
        birthdate: user.birthdate ? format(new Date(user.birthdate), 'dd/MM/yyyy') : '',
        favoriteCategories: user.favoriteCategories || [],
        favoriteTags: user.favoriteTags || [],
      });
    }
  }, [user, isEditDialogOpen, form]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("aliciaLibros_user");
    setIsAuthenticated(false);
    setUser(null);
    if (typeof window !== "undefined") {
      router.push("/");
    }
  };
  
  async function onProfileSubmit(values: ProfileFormValues) {
    if (!user || !db) return;
    setIsSubmitting(true);

    const parseDateString = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS months are 0-11
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                const date = new Date(year, month, day);
                if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                    return date;
                }
            }
        }
        return null;
    };

    const birthdateAsDate = values.birthdate ? parseDateString(values.birthdate) : null;
    
    try {
        const userRef = doc(db, "users", user.id);
        const updatedData = {
            name: values.name,
            birthdate: birthdateAsDate ? birthdateAsDate.toISOString() : null,
            favoriteCategories: values.favoriteCategories || [],
            favoriteTags: values.favoriteTags || [],
        };

        const firestoreUpdateData: any = { ...updatedData };
        if (!firestoreUpdateData.birthdate) {
            delete firestoreUpdateData.birthdate;
        } else {
            firestoreUpdateData.birthdate = updatedData.birthdate;
        }

        await updateDoc(userRef, firestoreUpdateData);
        
        const updatedUserInState = { ...user, ...updatedData };
        setUser(updatedUserInState);

        const localStorageUser = {
            id: user.id,
            email: user.email,
            role: user.role,
            ...updatedData,
        }

        localStorage.setItem("aliciaLibros_user", JSON.stringify(localStorageUser));

        toast({ title: "Perfil Actualizado", description: "Tu información ha sido guardada." });
        setIsEditDialogOpen(false);
    } catch (error: any) {
        toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
}

  const handleGetRecommendations = async () => {
    if (!user) return;
    if (!preferences.trim() && readingHistory.length === 0 && (!user.favoriteCategories || user.favoriteCategories.length === 0)) {
      toast({
        title: "Más información, por favor",
        description: "Escribe tus preferencias o realiza una compra para que podamos generar recomendaciones.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAi(true);
    setAiRecommendations([]);

    try {
      const result = await getBookRecommendations({
        userId: user.id,
        readingHistory: readingHistory,
        preferences: `Géneros favoritos: ${user.favoriteCategories?.join(', ') || 'ninguno'}. Temas preferidos: ${user.favoriteTags?.join(', ') || 'ninguno'}. Preferencias adicionales del usuario: ${preferences}`,
      });
      
      const recommendedBooks = result.recommendations.map((title, index) => {
        const existingBook = allBooks.find(b => b.title.toLowerCase() === title.toLowerCase());
        if (existingBook) return {...existingBook, id: existingBook.id + `-${index}`};
        return {
          id: `rec-${index}-${Date.now()}`,
          title,
          authors: ["Autor por IA"],
          price: Math.floor(Math.random() * 10) + 15,
          imageUrl: `https://placehold.co/300x450.png`,
          dataAiHint: "recommended book",
          libraryId: 'ai-generated'
        } as Book;
      }).slice(0, 6);
      
      setAiRecommendations(recommendedBooks);
    } catch (error: any) {
      console.error("Error getting recommendations:", error);
      toast({
        title: "Error de IA",
        description: "No pudimos generar recomendaciones en este momento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAi(false);
    }
  };


  if (!isAuthenticated || !user) {
    return <div className="container mx-auto px-4 py-8 text-center">Verificando acceso...</div>;
  }

  const mockFavoriteLibraries: Library[] = placeholderLibraries.slice(0, 2).map(l => ({...l, id: l.id + "-fav"}));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-8 md:mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Mi Espacio Lector
        </h1>
        <p className="text-lg text-foreground/80">
          Bienvenido/a de nuevo, {user.name}. Aquí puedes gestionar tu actividad en Alicia Libros.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <Image
                src={user.avatarUrl!}
                alt={user.name}
                width={120}
                height={120}
                className="rounded-full mx-auto mb-4 border-4 border-primary/30"
                data-ai-hint={user.dataAiHint}
              />
              <CardTitle className="font-headline text-2xl">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              {user.joinDate && <CardDescription>Miembro desde: {user.joinDate}</CardDescription>}
               {user.birthdate && (
                <CardDescription>
                  Cumpleaños: {format(new Date(user.birthdate), 'dd/MM/yyyy')}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full font-body">
                    <Edit3 className="mr-2 h-4 w-4" /> Editar Perfil
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                      Actualiza tu información personal y tus preferencias literarias.
                    </DialogDescription>
                  </DialogHeader>
                   <Form {...form}>
                    <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField
                            control={form.control}
                            name="birthdate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Nacimiento</FormLabel>
                                    <FormControl>
                                        <Input placeholder="DD/MM/AAAA" {...field} value={field.value || ''}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="favoriteCategories" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Géneros Favoritos</FormLabel>
                                <FormControl>
                                    <MultiSelect placeholder="Selecciona categorías..." options={bookCategories} value={field.value || []} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="favoriteTags" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Etiquetas / Temas Favoritos</FormLabel>
                                <FormControl>
                                    <MultiSelect placeholder="Selecciona etiquetas..." options={bookTags} value={field.value || []} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter>
                          <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                          <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Guardar Cambios
                          </Button>
                        </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Button variant="destructive" className="w-full font-body" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center">
                    <QrCode className="mr-2 h-5 w-5 text-primary"/>
                    Mi Código de Lealtad
                </CardTitle>
                 <CardDescription>Muestra este código en las librerías participantes para acumular puntos.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-6">
                {user.id ? (
                    <div className="p-4 bg-white rounded-lg">
                      <QRCodeSVG value={user.id} size={160} />
                    </div>
                ) : (
                    <p className="text-muted-foreground">No se pudo generar el código.</p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="purchases" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 h-auto">
              <TabsTrigger value="purchases" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                <ShoppingBag className="mr-2 h-5 w-5" /> Mis Compras
              </TabsTrigger>
              <TabsTrigger value="favorites" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                <Heart className="mr-2 h-5 w-5" /> Librerías Favoritas
              </TabsTrigger>
              <TabsTrigger value="ai-recommendations" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                <Sparkles className="mr-2 h-5 w-5" /> Recomendaciones IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="purchases">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Historial de Compras</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Libro(s)</TableHead>
                          <TableHead>Librería</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead className="text-right">Puntos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium max-w-[200px] truncate" title={order.items.map(item => item.title).join(', ')}>
                              {order.items.map(item => item.title).join(', ')}
                            </TableCell>
                            <TableCell>{libraries.get(order.libraryId) || 'Librería Desconocida'}</TableCell>
                            <TableCell>{format(new Date(order.createdAt), "dd/MM/yyyy", { locale: es })}</TableCell>
                            <TableCell className="text-right">${order.totalPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold text-primary">+{Math.floor(order.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Aún no has realizado ninguna compra.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Mis Librerías Favoritas</CardTitle>
                </CardHeader>
                <CardContent>
                  {mockFavoriteLibraries.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mockFavoriteLibraries.map(library => <LibraryCard key={library.id} library={library} />)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aún no has guardado ninguna librería como favorita.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-recommendations">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" />
                    Recomendaciones para Ti
                  </CardTitle>
                  <CardDescription>
                    Nuestra IA utiliza tus preferencias de perfil, historial de compras y los gustos que nos describas aquí para encontrar tu próxima lectura ideal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="preferences-ai" className="font-medium">¿Algo más que debamos saber?</Label>
                        <Textarea
                            id="preferences-ai"
                            value={preferences}
                            onChange={(e) => setPreferences(e.target.value)}
                            placeholder="Ej: Busco una novela histórica que no sea sobre la Segunda Guerra Mundial, o algo de fantasía con un buen sistema de magia..."
                            rows={3}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Tu historial de compras ({readingHistory.length} libros) y tus géneros favoritos se incluyen automáticamente.
                        </p>
                    </div>
                    <Button onClick={handleGetRecommendations} disabled={isLoadingAi} className="w-full sm:w-auto">
                        {isLoadingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isLoadingAi ? "Generando..." : "Generar Nuevas Recomendaciones"}
                    </Button>
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <h3 className="font-headline text-2xl font-semibold mb-4 text-foreground text-center">Tus Recomendaciones</h3>
                {isLoadingAi ? (
                     <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                     </div>
                ) : aiRecommendations.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {aiRecommendations.map(book => <BookCard key={book.id} book={book} size="small" />)}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">Tus recomendaciones aparecerán aquí.</p>
                        <p className="text-xs text-muted-foreground">¡Usa el generador para empezar!</p>
                    </div>
                  )}
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}
