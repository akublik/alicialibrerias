
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
import type { Book, Library, User, Order, BookRequest, PointsTransaction, DigitalPurchase, DigitalBook } from "@/types";
import { LibraryCard } from "@/components/LibraryCard";
import { ShoppingBag, Heart, Sparkles, Edit3, LogOut, QrCode, Loader2, HelpCircle, Gift, ImagePlus, Bookmark, CalendarIcon, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, doc, onSnapshot, query, updateDoc, where, addDoc, serverTimestamp, getDocs, documentId, orderBy, limit } from "firebase/firestore";
import { format } from 'date-fns';
import { MultiSelect } from '@/components/ui/multi-select';
import { bookCategories, bookTags } from '@/lib/options';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { es } from 'date-fns/locale';
import { BookCard } from "@/components/BookCard";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getBookRecommendations, type BookRecommendationsOutput } from '@/ai/flows/book-recommendations';
import { Separator } from '@/components/ui/separator';
import { useWishlist } from '@/context/WishlistContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Tu nombre debe tener al menos 2 caracteres." }),
  avatarUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  birthdate: z.date().optional(),
  favoriteCategories: z.array(z.string()).optional(),
  favoriteTags: z.array(z.string()).optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const requestFormSchema = z.object({
  bookTitle: z.string().min(2, { message: "El título es requerido." }),
  bookAuthor: z.string().min(2, { message: "El autor es requerido." }),
  notes: z.string().optional(),
});
type RequestFormValues = z.infer<typeof requestFormSchema>;


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
  const [isRequesting, setIsRequesting] = useState(false);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>([]);
  const [digitalPurchases, setDigitalPurchases] = useState<DigitalPurchase[]>([]);
  const [libraries, setLibraries] = useState<Map<string, string>>(new Map());
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [preferences, setPreferences] = useState('');
  
  const [foundBooks, setFoundBooks] = useState<Book[]>([]);
  const [newSuggestions, setNewSuggestions] = useState<BookRecommendationsOutput['newSuggestions']>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const [favoriteLibraries, setFavoriteLibraries] = useState<Library[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);

  const { wishlistItems, isLoading: isWishlistLoading } = useWishlist();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });

  const requestForm = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: { bookTitle: "", bookAuthor: "", notes: "" },
  });

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
    // The onAuthStateChanged listener in Navbar will handle the rest:
    // clearing localStorage and redirecting.
    router.push("/");
  };

  const wishlistedBooks = useMemo(() => {
    if (isWishlistLoading || !wishlistItems.length || !allBooks.length) return [];
    const wishlistBookIds = new Set(wishlistItems.map(item => item.bookId));
    return allBooks.filter(book => wishlistBookIds.has(book.id));
  }, [wishlistItems, allBooks, isWishlistLoading]);

  // Effect to load user data from localStorage and then listen for real-time updates
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    if (!authStatus) {
      if (typeof window !== "undefined") router.push("/login");
      return;
    }
    setIsAuthenticated(true);

    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (!userDataString) {
      handleLogout();
      return;
    }
    
    if (!db) {
        toast({title: "Error de Conexión", description: "No se pudo conectar a la base de datos.", variant: "destructive"});
        handleLogout();
        return;
    }

    try {
        const initialUserData: User = JSON.parse(userDataString);

        if (initialUserData.role === 'library') {
            router.replace('/library-admin/dashboard');
            return;
        }
        if (initialUserData.role === 'superadmin') {
            router.replace('/superadmin/dashboard');
            return;
        }

        if (!initialUserData.id) {
          console.error("User ID missing.");
          handleLogout();
          return;
        }

        let unsubscribes: (() => void)[] = [];

        // Real-time listener for user document
        const userRef = doc(db, "users", initialUserData.id);
        const userUnsub = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const liveUserData = docSnap.data();
            let joinDateStr = "Miembro reciente";
            if (liveUserData.createdAt && (liveUserData.createdAt as any).seconds) {
              const joinDate = new Date((liveUserData.createdAt as any).seconds * 1000);
              joinDateStr = format(joinDate, "MMMM yyyy", { locale: es });
              joinDateStr = joinDateStr.charAt(0).toUpperCase() + joinDateStr.slice(1);
            }
            
            const fullUserData: UserData = {
              ...(liveUserData as Omit<User, 'id'>),
              id: docSnap.id,
              joinDate: joinDateStr,
              avatarUrl: liveUserData.avatarUrl || `https://placehold.co/150x150.png?text=${liveUserData.name.charAt(0)}`,
              dataAiHint: liveUserData.dataAiHint || "user avatar",
            };
            setUser(fullUserData);
          } else {
            console.error("User document does not exist, logging out.");
            handleLogout();
          }
        });
        unsubscribes.push(userUnsub);

        // Fetch other related data
        const libUnsub = onSnapshot(collection(db, "libraries"), (libSnapshot) => {
          const libNameMap = new Map<string, string>();
          const libInfoMap = new Map<string, {name: string, location: string}>();

          libSnapshot.forEach(doc => {
            const data = doc.data();
            libNameMap.set(doc.id, data.name);
            libInfoMap.set(doc.id, { name: data.name, location: data.location });
          });
          setLibraries(libNameMap);

          const booksUnsub = onSnapshot(collection(db, "books"), (booksSnapshot) => {
            const augmentedBooks = booksSnapshot.docs.map(doc => {
              const book = { id: doc.id, ...doc.data() } as Book;
              if (book.libraryId && libInfoMap.has(book.libraryId)) {
                const libInfo = libInfoMap.get(book.libraryId)!;
                return { 
                  ...book, 
                  libraryName: libInfo.name,
                  libraryLocation: libInfo.location
                };
              }
              return book;
            });
            setAllBooks(augmentedBooks);
          });
          unsubscribes.push(booksUnsub);
        });
        unsubscribes.push(libUnsub);


        const ordersRef = collection(db, "orders");
        const qOrders = query(ordersRef, where("buyerId", "==", initialUserData.id));
        const ordersUnsub = onSnapshot(qOrders, (snapshot) => {
            let userOrders = snapshot.docs.map(doc => ({
                id: doc.id, ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString(),
            } as Order));

            // Filter out digital orders for the physical purchase history
            userOrders = userOrders.filter(order => order.shippingMethod !== 'digital');

            userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(userOrders);
        });
        unsubscribes.push(ordersUnsub);
        
        // Listener for digital purchases
        const digitalPurchasesRef = collection(db, "digital_purchases");
        const qDigital = query(digitalPurchasesRef, where("userId", "==", initialUserData.id), orderBy("createdAt", "desc"));
        const digitalUnsub = onSnapshot(qDigital, async (snapshot) => {
            const userDigitalPurchases = snapshot.docs.map(doc => ({
                id: doc.id, ...doc.data(),
            } as DigitalPurchase));
            setDigitalPurchases(userDigitalPurchases);
        });
        unsubscribes.push(digitalUnsub);


        // Listener for favorite libraries
        const favsQuery = query(collection(db, 'userFavorites'), where('userId', '==', initialUserData.id));
        const favsUnsub = onSnapshot(favsQuery, async (snapshot) => {
            setIsLoadingFavorites(true);
            const libraryIds = snapshot.docs.map(doc => doc.data().libraryId);
            if (libraryIds.length > 0) {
                // Chunk the IDs to avoid 'in' query limitations
                const chunks = [];
                for (let i = 0; i < libraryIds.length; i += 30) {
                    chunks.push(libraryIds.slice(i, i + 30));
                }
                const libPromises = chunks.map(chunk => getDocs(query(collection(db, 'libraries'), where(documentId(), 'in', chunk))));
                const libSnapshots = await Promise.all(libPromises);
                const libs: Library[] = [];
                libSnapshots.forEach(snap => snap.docs.forEach(doc => libs.push({ id: doc.id, ...doc.data()} as Library)));
                setFavoriteLibraries(libs);
            } else {
                setFavoriteLibraries([]);
            }
            setIsLoadingFavorites(false);
        });
        unsubscribes.push(favsUnsub);
        
        // Listener for points history
        const pointsRef = collection(db, "pointsTransactions");
        const pointsQuery = query(pointsRef, where("userId", "==", initialUserData.id), limit(50));
        const pointsUnsub = onSnapshot(pointsQuery, (snapshot) => {
            const history = snapshot.docs.map(doc => ({
                id: doc.id, ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString(),
            } as PointsTransaction));
            history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setPointsHistory(history);
        });
        unsubscribes.push(pointsUnsub);

        return () => {
          unsubscribes.forEach(unsub => unsub());
        };

    } catch (e) {
        console.error("Error setting up dashboard:", e);
        handleLogout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to reset form when dialog opens
  useEffect(() => {
    if (user && isEditDialogOpen) {
      form.reset({
        name: user.name || '',
        avatarUrl: user.avatarUrl && !user.avatarUrl.includes('placehold.co') ? user.avatarUrl : '',
        birthdate: user.birthdate ? new Date(user.birthdate) : undefined,
        favoriteCategories: user.favoriteCategories || [],
        favoriteTags: user.favoriteTags || [],
      });
    }
  }, [user, isEditDialogOpen, form]);
  
  async function onProfileSubmit(values: ProfileFormValues) {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
        const userRef = doc(db, "users", user.id);
        const dataForFirestore: Partial<User> = {
            name: values.name,
            avatarUrl: values.avatarUrl,
            birthdate: values.birthdate ? format(values.birthdate, 'yyyy-MM-dd') : null,
            favoriteCategories: values.favoriteCategories || [],
            favoriteTags: values.favoriteTags || [],
        };

        await updateDoc(userRef, dataForFirestore);

        const currentDataString = localStorage.getItem("aliciaLibros_user");
        const currentUserData = currentDataString ? JSON.parse(currentDataString) : {};
        
        const fullyUpdatedUser = {
             ...currentUserData,
             ...dataForFirestore,
             id: user.id
        };
        
        setUser(fullyUpdatedUser as UserData);
        localStorage.setItem("aliciaLibros_user", JSON.stringify(fullyUpdatedUser));
        
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
    if (!preferences.trim()) {
      toast({
        title: "Más información, por favor",
        description: "Escribe tus preferencias para que podamos generar recomendaciones.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAi(true);
    setFoundBooks([]);
    setNewSuggestions([]);

    try {
      const result = await getBookRecommendations({
        userId: user.id,
        readingHistory: [],
        preferences: preferences,
      });
      
      const foundBookDetails = result.foundInInventory
          .map(found => allBooks.find(b => b.id === found.id))
          .filter((b): b is Book => !!b);
      
      setFoundBooks(foundBookDetails);
      setNewSuggestions(result.newSuggestions);

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

  async function onBookRequestSubmit(values: RequestFormValues) {
    if (!user) return;
    setIsRequesting(true);
    try {
        await addDoc(collection(db, "bookRequests"), {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            bookTitle: values.bookTitle,
            bookAuthor: values.bookAuthor,
            notes: values.notes || "",
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        toast({ title: "Solicitud Enviada", description: "Hemos recibido tu solicitud. ¡Gracias!" });
        requestForm.reset();
    } catch (error: any) {
        toast({ title: "Error al enviar", description: error.message, variant: "destructive" });
    } finally {
        setIsRequesting(false);
    }
  }


  if (!isAuthenticated || !user) {
    return <div className="container mx-auto px-4 py-8 text-center">Verificando acceso...</div>;
  }

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
                   Cumpleaños: {format(new Date(user.birthdate), 'dd MMMM', {locale: es})}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 border rounded-lg bg-muted/50 text-center">
                <p className="text-sm font-medium text-muted-foreground">Puntos de Lealtad</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <Gift className="h-6 w-6 text-primary"/>
                    <p className="text-2xl font-bold text-primary">{user.loyaltyPoints || 0}</p>
                </div>
              </div>
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
                        <FormField control={form.control} name="avatarUrl" render={({ field }) => ( <FormItem><FormLabel className="flex items-center"><ImagePlus className="mr-2 h-4 w-4"/> URL de tu Avatar</FormLabel><FormControl><Input placeholder="https://ejemplo.com/tu-foto.jpg" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField
                            control={form.control}
                            name="birthdate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Fecha de Nacimiento</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP", { locale: es })
                                          ) : (
                                            <span>Elige una fecha</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                          date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
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

           <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center">
                        <HelpCircle className="mr-2 h-5 w-5 text-primary"/>
                        ¿No encuentras un libro?
                    </CardTitle>
                    <CardDescription>
                        Si hay algún libro que te gustaría ver en nuestra plataforma, dínoslo. Lo comunicaremos a las librerías.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...requestForm}>
                        <form onSubmit={requestForm.handleSubmit(onBookRequestSubmit)} className="space-y-4">
                            <FormField control={requestForm.control} name="bookTitle" render={({ field }) => ( <FormItem><FormLabel>Título del Libro</FormLabel><FormControl><Input {...field} placeholder="Ej: La vegetariana" /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={requestForm.control} name="bookAuthor" render={({ field }) => ( <FormItem><FormLabel>Autor(a)</FormLabel><FormControl><Input {...field} placeholder="Ej: Han Kang" /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={requestForm.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Notas (Opcional)</FormLabel><FormControl><Textarea {...field} placeholder="Cualquier detalle adicional, como la editorial o el año, es útil." /></FormControl><FormMessage /></FormItem> )}/>
                            <Button type="submit" disabled={isRequesting} className="w-full sm:w-auto">
                                {isRequesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Enviar Solicitud
                            </Button>
                        </form>
                    </Form>
                </CardContent>
              </Card>

        </div>

        {/* Tabs Section */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="purchases" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6 bg-muted/50 p-1 h-auto text-xs sm:text-sm">
              <TabsTrigger value="purchases"><ShoppingBag className="mr-2 h-4 w-4" /> Mis Compras</TabsTrigger>
              <TabsTrigger value="digital-books"><Download className="mr-2 h-4 w-4" /> Libros Digitales</TabsTrigger>
              <TabsTrigger value="points-history"><Gift className="mr-2 h-4 w-4" /> Puntos</TabsTrigger>
              <TabsTrigger value="favorites"><Heart className="mr-2 h-4 w-4" /> Librerías Favoritas</TabsTrigger>
              <TabsTrigger value="wishlist"><Bookmark className="mr-2 h-4 w-4" /> Lista de Deseos</TabsTrigger>
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
                            <TableCell className="text-right font-semibold text-primary">+{Math.floor(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</TableCell>
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

            <TabsContent value="digital-books">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Mis Libros Digitales Comprados</CardTitle>
                  <CardDescription>Aquí encontrarás todos los libros digitales que has adquirido.</CardDescription>
                </CardHeader>
                <CardContent>
                  {digitalPurchases.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {digitalPurchases.map((purchase) => (
                        <Card key={purchase.id} className="overflow-hidden group">
                           <Link href={`/reader/${purchase.bookId}`}>
                            <div className="aspect-[2/3] relative">
                                <Image src={purchase.coverImageUrl} alt={`Portada de ${purchase.title}`} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" />
                            </div>
                            <div className="p-3">
                                <h4 className="font-semibold text-sm truncate group-hover:text-primary">{purchase.title}</h4>
                                <p className="text-xs text-muted-foreground truncate">{purchase.author}</p>
                            </div>
                          </Link>
                          <CardFooter className="p-3 pt-0">
                             <Link href={`/reader/${purchase.bookId}`} className="w-full">
                                <Button className="w-full">Leer Ahora</Button>
                             </Link>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No has comprado ningún libro digital todavía.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="points-history">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Historial de Puntos</CardTitle>
                  <CardDescription>Aquí puedes ver todos los puntos que has ganado y gastado.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Puntos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pointsHistory.length > 0 ? (
                        pointsHistory.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{format(new Date(transaction.createdAt), "dd/MM/yyyy", { locale: es })}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell className={`text-right font-semibold ${transaction.points > 0 ? 'text-green-600' : 'text-destructive'}`}>
                              {transaction.points > 0 ? `+${transaction.points}` : transaction.points}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                            Aún no tienes movimientos de puntos. ¡Realiza una compra para empezar a ganar!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Mis Librerías Favoritas</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingFavorites ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : favoriteLibraries.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {favoriteLibraries.map(library => <LibraryCard key={library.id} library={library} />)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Aún no has guardado ninguna librería como favorita.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wishlist">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Mi Lista de Deseos</CardTitle>
                        <CardDescription>Libros que has guardado para después.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isWishlistLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : wishlistedBooks.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {wishlistedBooks.map(book => <BookCard key={book.id} book={book} />)}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">Tu lista de deseos está vacía. Busca libros y guárdalos para más tarde.</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}
