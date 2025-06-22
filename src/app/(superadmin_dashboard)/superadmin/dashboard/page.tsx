// src/app/(superadmin_dashboard)/superadmin/dashboard/page.tsx
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, BarChart3, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

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
        setIsLoading(false);
    }, () => setIsLoading(false));
    unsubscribes.push(unsubUsers);
    
    const librariesRef = collection(db, "libraries");
    const unsubLibraries = onSnapshot(librariesRef, (snapshot) => {
        setStats(prev => ({ ...prev, libraryCount: snapshot.size }));
    });
    unsubscribes.push(unsubLibraries);

    const ordersRef = collection(db, "orders");
    const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
        const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().totalPrice || 0), 0);
        setStats(prev => ({ ...prev, totalSales: total }));
    });
    unsubscribes.push(unsubOrders);

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

       <div>
        <h2 className="font-headline text-2xl font-semibold text-foreground mb-4">Gestión de la Plataforma</h2>
        <p className="text-muted-foreground">Utiliza el menú de la izquierda para gestionar usuarios, librerías y contenido del sitio.</p>
      </div>

    </div>
  );
}
