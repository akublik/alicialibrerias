// src/app/(superadmin_dashboard)/superadmin/dashboard/page.tsx
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Store, BarChart3, Loader2, BookCopy, ShoppingCart, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import type { Library, Order, User, Book } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GlobalStats {
  userCount: number;
  libraryCount: number;
  totalSales: number;
  totalBooks: number;
  totalOrders: number;
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


export default function SuperAdminDashboardPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allLibraries, setAllLibraries] = useState<Library[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    const collections = [
      { ref: collection(db, "users"), setter: setAllUsers },
      { ref: collection(db, "libraries"), setter: setAllLibraries },
      { ref: collection(db, "orders"), setter: setAllOrders },
      { ref: collection(db, "books"), setter: setAllBooks },
    ];

    let loadedCollections = 0;
    collections.forEach(({ ref, setter }) => {
      const unsubscribe = onSnapshot(ref, (snapshot) => {
        setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        loadedCollections++;
        if (loadedCollections === collections.length) {
          setIsLoading(false);
        }
      }, (error) => {
        console.error(`Error fetching ${ref.path}:`, error);
        setIsLoading(false);
      });
      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);
  
  const stats: GlobalStats = useMemo(() => {
    const totalSales = allOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    return {
      userCount: allUsers.length,
      libraryCount: allLibraries.length,
      totalSales,
      totalBooks: allBooks.length,
      totalOrders: allOrders.length,
    };
  }, [allUsers, allLibraries, allOrders, allBooks]);

  const librarySales = useMemo(() => {
    const salesByLibrary: { [key: string]: number } = {};
    allOrders.forEach(order => {
      if (order.libraryId && order.totalPrice) {
        salesByLibrary[order.libraryId] = (salesByLibrary[order.libraryId] || 0) + order.totalPrice;
      }
    });
    return allLibraries.map(lib => ({
      id: lib.id,
      name: lib.name,
      imageUrl: lib.imageUrl,
      sales: salesByLibrary[lib.id] || 0,
    })).sort((a, b) => b.sales - a.sales);
  }, [allLibraries, allOrders]);
  
  const pendingLibraries = useMemo(() => {
    return allLibraries.filter(lib => lib.isActive === false || lib.isActive === undefined);
  }, [allLibraries]);

  const handleApproveLibrary = async (libraryId: string) => {
    if (!db) return;
    setIsApproving(libraryId);
    const libraryRef = doc(db, "libraries", libraryId);
    try {
        await updateDoc(libraryRef, { isActive: true });
        toast({
            title: "Librería Aprobada",
            description: "La librería ahora está activa en la plataforma."
        });
    } catch (error: any) {
        toast({ title: "Error al aprobar", description: error.message, variant: "destructive" });
    } finally {
        setIsApproving(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <header className="mb-8">
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
            Dashboard de Superadministrador
        </h1>
        <p className="text-lg text-foreground/80">
            Visión general de la plataforma Alicia Libros.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        <StatCard title="Usuarios Totales" value={stats.userCount} icon={Users} isLoading={isLoading} description="Lectores y admins." />
        <StatCard title="Librerías Registradas" value={stats.libraryCount} icon={Store} isLoading={isLoading} />
        <StatCard title="Libros en Catálogo" value={stats.totalBooks} icon={BookCopy} isLoading={isLoading} />
        <StatCard title="Pedidos Globales" value={stats.totalOrders} icon={ShoppingCart} isLoading={isLoading} />
        <StatCard title="Ventas Globales" value={`$${stats.totalSales.toFixed(2)}`} icon={BarChart3} isLoading={isLoading} />
      </div>

       <div className="mt-8">
          <h2 className="font-headline text-2xl font-semibold text-foreground mb-4">Aprobaciones Pendientes</h2>
          <Card className="shadow-lg">
              <CardContent className="p-0">
                  {isLoading ? (
                      <div className="flex justify-center items-center py-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                  ) : pendingLibraries.length > 0 ? (
                      <Table>
                          <TableHeader><TableRow><TableHead>Librería</TableHead><TableHead>Email</TableHead><TableHead>Fecha Registro</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {pendingLibraries.map(lib => (
                                  <TableRow key={lib.id}>
                                      <TableCell>
                                          <div className="flex items-center gap-3">
                                              <Image src={lib.imageUrl || 'https://placehold.co/40x40.png'} alt={`Logo de ${lib.name}`} width={40} height={40} className="rounded-full object-cover"/>
                                              <span className="font-medium">{lib.name}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell>{lib.email}</TableCell>
                                      <TableCell>{lib.createdAt?.toDate ? format(lib.createdAt.toDate(), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</TableCell>
                                      <TableCell className="text-right">
                                          <Button onClick={() => handleApproveLibrary(lib.id)} disabled={isApproving === lib.id} size="sm">
                                              {isApproving === lib.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                              Aprobar
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  ) : (
                      <div className="p-6 text-center text-muted-foreground flex flex-col items-center gap-2">
                        <PackageOpen className="h-10 w-10"/>
                        <p className="font-medium">¡Todo al día!</p>
                        <p className="text-sm">No hay librerías pendientes de aprobación.</p>
                      </div>
                  )}
              </CardContent>
          </Card>
      </div>

       <div className="mt-8">
        <h2 className="font-headline text-2xl font-semibold text-foreground mb-4">Ventas por Librería</h2>
        <Card className="shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Librería</TableHead>
                    <TableHead className="text-right">Ventas Totales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {librarySales.map(lib => (
                    <TableRow key={lib.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Image
                            src={lib.imageUrl || 'https://placehold.co/40x40.png'}
                            alt={`Logo de ${lib.name}`}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                          <span className="font-medium">{lib.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${lib.sales.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
