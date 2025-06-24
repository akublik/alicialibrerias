// src/app/(superadmin_dashboard)/superadmin/analytics/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LineChart, SearchX, PackageOpen, TrendingUp } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { SearchLog } from "@/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AggregatedSearch {
    query: string;
    count: number;
    lastSearched: string;
}

export default function SearchAnalyticsPage() {
    const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!db) {
            setIsLoading(false);
            return;
        }

        const logsRef = collection(db, "searchLogs");
        const q = query(logsRef, orderBy("timestamp", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allLogs = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date(),
                } as SearchLog
            });
            setSearchLogs(allLogs);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching search logs:", error);
            toast({ title: "Error al cargar analíticas", variant: "destructive" });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);
    
    const aggregatedData = useMemo(() => {
        const queryMap = new Map<string, { count: number; lastSearched: Date }>();
        
        searchLogs.forEach(log => {
            const existing = queryMap.get(log.query);
            if (existing) {
                queryMap.set(log.query, {
                    count: existing.count + 1,
                    lastSearched: new Date(Math.max(existing.lastSearched.getTime(), new Date(log.timestamp).getTime())),
                });
            } else {
                queryMap.set(log.query, {
                    count: 1,
                    lastSearched: new Date(log.timestamp),
                });
            }
        });

        const allAggregated: AggregatedSearch[] = Array.from(queryMap.entries()).map(([query, data]) => ({
            query,
            count: data.count,
            lastSearched: format(data.lastSearched, "dd/MM/yyyy HH:mm", { locale: es }),
        }));
        
        const topSearches = [...allAggregated].sort((a, b) => b.count - a.count);

        const zeroResultsLogs = searchLogs.filter(log => log.resultsCount === 0);
        const zeroResultsMap = new Map<string, { count: number; lastSearched: Date }>();
        zeroResultsLogs.forEach(log => {
             const existing = zeroResultsMap.get(log.query);
            if (existing) {
                zeroResultsMap.set(log.query, {
                    count: existing.count + 1,
                    lastSearched: new Date(Math.max(existing.lastSearched.getTime(), new Date(log.timestamp).getTime())),
                });
            } else {
                zeroResultsMap.set(log.query, {
                    count: 1,
                    lastSearched: new Date(log.timestamp),
                });
            }
        });
        
        const topZeroResultSearches = Array.from(zeroResultsMap.entries()).map(([query, data]) => ({
            query,
            count: data.count,
            lastSearched: format(data.lastSearched, "dd/MM/yyyy HH:mm", { locale: es }),
        })).sort((a, b) => b.count - a.count);


        return { topSearches, topZeroResultSearches };

    }, [searchLogs]);
    
    const renderTable = (data: AggregatedSearch[], emptyMessage: string, emptyIcon: React.ReactNode) => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Término de Búsqueda</TableHead>
                    <TableHead className="text-center">Nº de Búsquedas</TableHead>
                    <TableHead>Última Búsqueda</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length > 0 ? data.map(item => (
                    <TableRow key={item.query}>
                        <TableCell className="font-medium">{item.query}</TableCell>
                        <TableCell className="text-center">{item.count}</TableCell>
                        <TableCell>{item.lastSearched}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                                {emptyIcon}
                                <h3 className="font-semibold">{emptyMessage}</h3>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="container mx-auto px-4 py-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
                        <LineChart className="mr-3 h-8 w-8" />
                        Analíticas de Búsqueda
                    </h1>
                    <p className="text-lg text-foreground/80">
                        Entiende qué están buscando tus lectores.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                <Tabs defaultValue="top-searches">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="top-searches">
                            <TrendingUp className="mr-2 h-4 w-4"/> Búsquedas Populares
                        </TabsTrigger>
                        <TabsTrigger value="zero-results">
                           <SearchX className="mr-2 h-4 w-4"/> Búsquedas Sin Resultados
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="top-searches">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Top de Búsquedas</CardTitle>
                                <CardDescription>Los términos más buscados por los usuarios en la plataforma.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderTable(aggregatedData.topSearches, "No hay datos de búsqueda aún.", <PackageOpen className="h-12 w-12" />)}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="zero-results">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Búsquedas sin Resultados</CardTitle>
                                <CardDescription>
                                    Estos son los términos que los usuarios buscaron pero para los cuales no se encontró ningún libro.
                                    Esta es una oportunidad para expandir el catálogo.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                               {renderTable(aggregatedData.topZeroResultSearches, "¡Buenas noticias! Todas las búsquedas han tenido resultados.", <PackageOpen className="h-12 w-12" />)}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
