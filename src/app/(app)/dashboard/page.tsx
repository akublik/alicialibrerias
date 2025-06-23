
// src/app/(app)/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { placeholderBooks, placeholderLibraries } from "@/lib/placeholders";
import type { Book, Library, User } from "@/types";
import { BookCard } from "@/components/BookCard";
import { LibraryCard } from "@/components/LibraryCard";
import { ShoppingBag, Heart, Sparkles, Edit3, LogOut, QrCode, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MultiSelect } from '@/components/ui/multi-select';
import { bookCategories, bookTags } from '@/lib/options';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Tu nombre debe tener al menos 2 caracteres." }),
  birthdate: z.date().optional(),
  favoriteCategories: z.array(z.string()).optional(),
  favoriteTags: z.array(z.string()).optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserData extends User {}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });

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
        
        setUser({
          ...userData,
          joinDate: "Enero 2024", // Placeholder
          avatarUrl: (userData as any).avatarUrl || "https://placehold.co/150x150.png",
          dataAiHint: (userData as any).dataAiHint || "user avatar",
        });
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
        birthdate: user.birthdate ? new Date(user.birthdate) : undefined,
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
    try {
        const userRef = doc(db, "users", user.id);
        const updatedData = {
            name: values.name,
            birthdate: values.birthdate ? values.birthdate.toISOString() : null,
            favoriteCategories: values.favoriteCategories || [],
            favoriteTags: values.favoriteTags || [],
        };

        // Use a temp object for update to avoid non-serializable data
        const firestoreUpdateData: any = { ...updatedData };
        if (!firestoreUpdateData.birthdate) {
            delete firestoreUpdateData.birthdate;
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


  if (!isAuthenticated || !user) {
    return <div className="container mx-auto px-4 py-8 text-center">Verificando acceso...</div>;
  }

  // Mock purchases
  const mockPurchases: Book[] = placeholderBooks.slice(0, 2).map(b => ({...b, id: b.id + "-purchase"}));
  const mockFavoriteLibraries: Library[] = placeholderLibraries.slice(0, 2).map(l => ({...l, id: l.id + "-fav"}));
  const mockAiRecommendations: Book[] = placeholderBooks.slice(2, 4).map(b => ({...b, id: b.id + "-airec"}));

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
              <CardDescription>Miembro desde: {user.joinDate}</CardDescription>
               {user.birthdate && (
                <CardDescription>
                  Cumpleaños: {format(new Date(user.birthdate), "dd/MM/yyyy", { locale: es })}
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
                         <FormField control={form.control} name="birthdate" render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "dd/MM/yyyy", { locale: es }) : <span>Elige una fecha</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} captionLayout="dropdown-buttons" fromYear={1920} toYear={new Date().getFullYear()} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                         )} />
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
                  {mockPurchases.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mockPurchases.map(book => <BookCard key={book.id} book={book} />)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aún no has realizado ninguna compra.</p>
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
                  <CardTitle className="font-headline text-xl">Recomendaciones para Ti</CardTitle>
                  <CardDescription>
                    Basado en tus gustos e historial, estos libros podrían encantarte.
                    <Link href="/recommendations" className="ml-2 text-primary hover:underline font-medium">Ajustar preferencias</Link>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {mockAiRecommendations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mockAiRecommendations.map(book => <BookCard key={book.id} book={book} />)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aún no tenemos recomendaciones para ti. <Link href="/recommendations" className="text-primary hover:underline">¡Cuéntanos tus gustos!</Link></p>
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
