// src/app/(app)/authors/page.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Review, User } from '@/types';
import Image from "next/image";
import { MessageSquare, Users, CalendarDays, Star, ThumbsUp, Send, PlusCircle, Loader2, Bot, BookCopy, Rocket, Wand2, BarChart2, ArrowRight, UserPlus, LayoutDashboard } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, limit, doc, getDoc, runTransaction } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

// This is a simple string now, the content will be loaded from a file
const xmlExample = `
<changes>
  <description>A concise summary of the changes being made.</description>
  <change>
    <file>/path/to/your/file.tsx</file>
    <content><![CDATA[
      // The entire final content of the file goes here.
      // Ensure all code is properly escaped.
    