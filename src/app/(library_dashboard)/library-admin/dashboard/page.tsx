// src/app/(library_dashboard)/library-admin/dashboard/page.tsx
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookCopy, ShoppingCart, BarChart3, PlusCircle, Store, Heart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface Stats {
  bookCount: number;
  pendingOrders: number;
  monthlySales: number;
  favoriteCount: number; // This will be a placeholder
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
  const [stats, setStats] = useState<Stats>({
    bookCount: 0,
    pendingOrders: 0,
    monthlySales: 0,
    favoriteCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get library info from localStorage
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

    // Get libraryId for queries
    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (!userDataString) {
      setIsLoading(false);
      return;
    }
    const userData = JSON.parse(userDataString);
    const libraryId = userData.libraryId;

    if (!libraryId || !db) {
      setIsLoading(false);
      return;
    }

    // --- Set up Firestore listeners ---

    // Listener for books count
    const booksRef = collection(db, "books");
    const booksQuery = query(booksRef, where("libraryId", "==", libraryId));
    const unsubscribeBooks = onSnapshot(booksQuery, (snapshot) => {
      setStats(prevStats => ({ ...prevStats, bookCount: snapshot.size }));
      setIsLoading(false);
    }, () => setIsLoading(false));

    // Listener for orders
    const ordersRef = collection(db, "orders");
    const ordersQuery = query(ordersRef, where("libraryId", "==", libraryId));
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
    
    // Placeholder for favorites. A real implementation would require storing favorites in Firestore.
    const mockFavorites = Math.floor(Math.random() * (75 - 5 + 1) + 5);
    setStats(prevStats => ({ ...prevStats, favoriteCount: mockFavorites }));


    return () => {
      unsubscribeBooks();
      unsubscribeOrders();
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
            description="Lectores que te han marcado como favorito (simulado)." 
            isLoading={false}
          />
      </div>

      <div>
        <h2 className="font-headline text-2xl font-semibold text-foreground mb-4">Acciones Rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/library-admin/books/new">
            <Button size="lg" className="w-full justify-start text-base py-6 shadow-sm hover:shadow-md transition-shadow">
              <PlusCircle className="mr-3 h-5 w-5" /> Añadir Nuevo Libro
            </Button>
          </Link>
           <Link href="/library-admin/orders">
            <Button size="lg" variant="outline" className="w-full justify-start text-base py-6 shadow-sm hover:shadow-md transition-shadow">
              <ShoppingCart className="mr-3 h-5 w-5" /> Ver Pedidos
            </Button>
          </Link>
          <Link href="/library-admin/profile">
             <Button size="lg" variant="outline" className="w-full justify-start text-base py-6 shadow-sm hover:shadow-md transition-shadow">
              <Store className="mr-3 h-5 w-5" /> Editar Perfil de Librería
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
