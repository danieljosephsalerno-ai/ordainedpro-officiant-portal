"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import mammoth from "mammoth";
import ChatInput from "@/components/ChatInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/supabase/utils/client";
import { READING_CATEGORIES, getReadingsByCategory, getRandomReading } from "@/data/ceremony-readings";
import { CEREMONY_QUESTIONNAIRE, QUESTIONNAIRE_CATEGORIES, getQuestionsByCategory, TOTAL_QUESTIONS } from "@/data/ceremony-questionnaire";

// This file is too large to include inline - reading from disk...