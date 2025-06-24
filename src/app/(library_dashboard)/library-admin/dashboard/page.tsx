// src/app/(library_dashboard)/library-admin/dashboard/page.tsx
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookCopy, ShoppingCart, BarChart3, PlusCircle, Store, Heart, Loader2, QrCode, Users, PackageOpen } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, getDocs, documentId } from "firebase/firestore";
import { QRCodeSVG } from 'qrcode.react';
import type { User } from "@/types";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";


interface Stats {
  bookCount: number;
  pendingOrders: number;
  monthlySales: number;
  favoriteCount: number;
}

const StatCard = ({ title, value, icon: Icon, isLoading, description }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean, description?: string }) => {
    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="pt-2">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
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

export default function LibraryAdminDashboardPage() {
  const [libraryName, setLibraryName] = useState<string>("Tu Librería");
  const [libraryImageUrl, setLibraryImageUrl] = useState<string | undefined>(undefined);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    bookCount: 0,
    pendingOrders: 0,
    monthlySales: 0,
    favoriteCount: 0,
  });
  const [followers, setFollowers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLibraryData = localStorage.getItem("aliciaLibros_registeredLibrary");
      if (storedLibraryData) {
        try {
          const libDetails = JSON.parse(storedLibraryData);
          if (libDetails) {
            setLibraryName(libDetails.name || "Tu Librería");
            setLibraryImageUrl(libDetails.imageUrl);
          }
        } catch (e) {
          console.error("Error parsing registered library data for dashboard:", e);
        }
      }
    }

    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (!userDataString) {
      setIsLoading(false);
      return;
    }
    const userData = JSON.parse(userDataString);
    const currentLibraryId = userData.libraryId;
    setLibraryId(currentLibraryId);

    if (!currentLibraryId || !db) {
      setIsLoading(false);
      return;
    }

    let unsubscribes: (() => void)[] = [];

    const booksRef = collection(db, "books");
    const booksQuery = query(booksRef, where("libraryId", "==", currentLibraryId));
    const unsubscribeBooks = onSnapshot(booksQuery, (snapshot) => {
      setStats(prevStats => ({ ...prevStats, bookCount: snapshot.size }));
      setIsLoading(false);
    }, () => setIsLoading(false));
    unsubscribes.push(unsubscribeBooks);

    const ordersRef = collection(db, "orders");
    const ordersQuery = query(ordersRef, where("libraryId", "==", currentLibraryId));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      let pendingCount = 0;
      let sales = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'pending') {
          pendingCount++;
        }
        
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            const orderDate = data.createdAt.toDate();
            if (orderDate >= thirtyDaysAgo) {
              sales += data.totalPrice;
            }
        }
      });

      setStats(prevStats => ({
        ...prevStats,
        pendingOrders: pendingCount,
        monthlySales: sales
      }));
    });
    unsubscribes.push(unsubscribeOrders);
    
    const favoritesQuery = query(collection(db, "userFavorites"), where("libraryId", "==", currentLibraryId));
    const unsubscribeFavorites = onSnapshot(favoritesQuery, async (snapshot) => {
      setIsLoadingFollowers(true);
      setStats(prevStats => ({ ...prevStats, favoriteCount: snapshot.size }));
      
      const userIds = snapshot.docs.map(doc => doc.data().userId);
      if (userIds.length > 0) {
        // Firestore 'in' query is limited to 30 elements. Chunk if necessary.
        const chunks = [];
        for (let i = 0; i < userIds.length; i += 30) {
            chunks.push(userIds.slice(i, i + 30));
        }
        
        const followerPromises = chunks.map(chunk => 
            getDocs(query(collection(db, "users"), where(documentId(), 'in', chunk)))
        );
        const followerSnapshots = await Promise.all(followerPromises);
        
        const followersData: User[] = [];
        followerSnapshots.forEach(snap => 
            snap.docs.forEach(doc => followersData.push({ id: doc.id, ...doc.data() } as User))
        );
        
        setFollowers(followersData);
      } else {
        setFollowers([]);
      }
      setIsLoadingFollowers(false);
    });
    unsubscribes.push(unsubscribeFavorites);


    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <header className="mb-8 flex flex-col sm:flex-row items-center gap-4">
       {libraryImageUrl && (
         <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-md border-2 border-primary/20 flex-shrink-0">
           <Image
             src={libraryImageUrl}
             alt={`Logo de ${libraryName}`}
             layout="fill"
             objectFit="cover"
             data-ai-hint="library logo dashboard"
           />
         </div>
       )}
       <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
            Bienvenido al Panel de {libraryName}
          </h1>
          <p className="text-lg text-foreground/80">
            Gestiona tus libros, pedidos y perfil desde aquí.
          </p>
       </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
         <StatCard 
            title="Libros Activos" 
            value={stats.bookCount} 
            icon={BookCopy} 
            isLoading={isLoading} 
          />
          <StatCard 
            title="Pedidos Pendientes" 
            value={stats.pendingOrders} 
            icon={ShoppingCart} 
            isLoading={isLoading} 
          />
          <StatCard 
            title="Ventas del Mes" 
            value={`$${stats.monthlySales.toFixed(2)}`} 
            icon={BarChart3} 
            isLoading={isLoading} 
          />
          <StatCard 
            title="Seguidores" 
            value={stats.favoriteCount} 
            icon={Heart} 
            description="Lectores que te han marcado como favorito." 
            isLoading={isLoading}
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-md">
                <CardHeader><CardTitle className="font-headline text-lg">Atajos</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <Link href="/library-admin/books/new">
                        <Button size="lg" className="w-full justify-start text-base py-3 shadow-sm hover:shadow-md transition-shadow">
                        <PlusCircle className="mr-3 h-5 w-5" /> Añadir Nuevo Libro
                        </Button>
                    </Link>
                    <Link href="/library-admin/orders">
                        <Button size="lg" variant="outline" className="w-full justify-start text-base py-3 shadow-sm hover:shadow-md transition-shadow">
                        <ShoppingCart className="mr-3 h-5 w-5" /> Ver Pedidos
                        </Button>
                    </Link>
                    <Link href="/library-admin/profile">
                        <Button size="lg" variant="outline" className="w-full justify-start text-base py-3 shadow-sm hover:shadow-md transition-shadow">
                        <Store className="mr-3 h-5 w-5" /> Editar Perfil
                        </Button>
                    </Link>
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-lg flex items-center">
                        <QrCode className="mr-2 h-5 w-5 text-primary"/>
                        Código QR de la Librería
                    </CardTitle>
                    <CardDescription>
                        Permite a tus clientes escanear este código para identificarse.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center p-6">
                    {libraryId ? (
                        <div className="p-4 bg-white rounded-lg">
                        <QRCodeSVG value={libraryId} size={140} />
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Cargando código QR...</p>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
            <Card className="shadow-lg">
                 <CardHeader>
                    <CardTitle className="font-headline text-lg flex items-center">
                        <Users className="mr-2 h-5 w-5 text-primary"/>
                        Tus Seguidores ({followers.length})
                    </CardTitle>
                    <CardDescription>
                        Lectores que han añadido tu librería a sus favoritos.
                    </CardDescription>
                 </CardHeader>
                 <CardContent>
                    {isLoadingFollowers ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableBody>
                                {followers.length > 0 ? followers.slice(0, 10).map((follower) => ( // Show top 10 for brevity
                                <TableRow key={follower.id}>
                                    <TableCell className="w-[50px]">
                                        <Image 
                                            src={follower.avatarUrl || `https://placehold.co/100x100.png?text=${follower.name.charAt(0)}`} 
                                            alt={follower.name} 
                                            width={40} 
                                            height={40} 
                                            className="rounded-full" 
                                            data-ai-hint={follower.dataAiHint || 'user avatar'}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{follower.name}</TableCell>
                                </TableRow>
                                )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <PackageOpen className="h-12 w-12" />
                                            <h3 className="font-semibold">Aún no tienes seguidores</h3>
                                            <p>Anima a tus lectores a marcarte como favorito.</p>
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
      </div>
    </div>
  );
}
