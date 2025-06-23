// src/app/(superadmin_dashboard)/superadmin/dashboard/page.tsx
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Store, BarChart3, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { Library } from "@/types";

interface GlobalStats {
  userCount: number;
  libraryCount: number;
  totalSales: number;
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
  const [stats, setStats] = useState<GlobalStats>({ userCount: 0, libraryCount: 0, totalSales: 0 });
  const [librarySales, setLibrarySales] = useState<{ id: string; name: string; sales: number, imageUrl?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];

    const usersRef = collection(db, "users");
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      setStats(prev => ({ ...prev, userCount: snapshot.size }));
    });
    unsubscribes.push(unsubUsers);
    
    const librariesRef = collection(db, "libraries");
    const unsubLibraries = onSnapshot(librariesRef, (librarySnapshot) => {
      const allLibraries = librarySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Library));
      setStats(prev => ({ ...prev, libraryCount: librarySnapshot.size }));

      const ordersRef = collection(db, "orders");
      const unsubOrders = onSnapshot(ordersRef, (orderSnapshot) => {
        const total = orderSnapshot.docs.reduce((sum, doc) => sum + (doc.data().totalPrice || 0), 0);
        
        const salesByLibrary: { [key: string]: number } = {};
        orderSnapshot.forEach(doc => {
          const order = doc.data();
          if (order.libraryId && order.totalPrice) {
            salesByLibrary[order.libraryId] = (salesByLibrary[order.libraryId] || 0) + order.totalPrice;
          }
        });

        const processedSales = allLibraries.map(lib => ({
          id: lib.id,
          name: lib.name,
          imageUrl: lib.imageUrl,
          sales: salesByLibrary[lib.id] || 0,
        })).sort((a, b) => b.sales - a.sales);

        setStats(prev => ({ ...prev, totalSales: total }));
        setLibrarySales(processedSales);
        setIsLoading(false);
      });
      unsubscribes.push(unsubOrders);
    }, () => setIsLoading(false));
    unsubscribes.push(unsubLibraries);

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard title="Usuarios Totales" value={stats.userCount} icon={Users} isLoading={isLoading} description="Lectores, librerías y admins." />
        <StatCard title="Librerías Registradas" value={stats.libraryCount} icon={Store} isLoading={isLoading} />
        <StatCard title="Ventas Totales Históricas" value={`$${stats.totalSales.toFixed(2)}`} icon={BarChart3} isLoading={isLoading} />
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
