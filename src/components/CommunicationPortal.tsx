"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import confetti from "canvas-confetti"
import mammoth from "mammoth"
import { supabase } from "@/supabase/utils/client"
import { Button } from "@/components/ui/button"
import { Download, Check, Eye, Save } from "lucide-react"
import { Task } from "@/components/AddTaskDialog"
import { Meeting } from "@/components/ScheduleMeetingDialog"
import { UploadedFile } from "@/components/FileUpload"
import { Contract } from "@/components/ContractUploadDialog"
import { CommunicationPortalProvider } from "./communication-portal/CommunicationPortalContext"
import {
  loadCouples as loadCouplesFromDB,
  loadTasks as loadTasksFromDB,
  addTask as addTaskToDB,
  updateTask as updateTaskInDB,
  loadFiles as loadFilesFromDB,
  addFile as addFileToDB,
  deleteFile as deleteFileFromDB,
  loadMeetings as loadMeetingsFromDB,
  addMeeting as addMeetingToDB,
  updateMeeting as updateMeetingInDB,
  deleteMeeting as deleteMeetingFromDB,
  loadContracts as loadContractsFromDB,
  addContract as addContractToDB,
  updateContract as updateContractInDB,
  loadPayments as loadPaymentsFromDB,
  addPayment as addPaymentToDB,
  updatePayment as updatePaymentInDB,
  loadScripts as loadScriptsFromDB,
  addScript as addScriptToDB,
  updateScript as updateScriptInDB,
  deleteScript as deleteScriptFromDB,
  autoSaveScript as autoSaveScriptToDB
} from "@/services/couple-data-service"
import { PortalHeader } from "./communication-portal/CeremoniesCouples/PortalHeader"
import { PortalOverview } from "./communication-portal/CeremoniesCouples/PortalOverview"
import { PortalTabs } from "./communication-portal/PortalTabs"
import { PortalDialogs } from "./communication-portal/PortalDialogs"

// Safe helper to get first name from a full name (null-safe)
const getFirstName = (fullName: string | null | undefined): string => {
  if (!fullName || typeof fullName !== 'string') return 'Partner'
  return fullName.split(' ')[0] || 'Partner'
}

// Helper function to generate consistent colors based on couple ID
const getCoupleColors = (coupleId: number) => {
  const colorPairs = [
    { bride: "bg-pink-500", groom: "bg-blue-500", brideRing: "ring-pink-100", groomRing: "ring-blue-100", brideText: "text-pink-600", groomText: "text-blue-600", brideIcon: "text-pink-500", groomIcon: "text-blue-500" },
    { bride: "bg-red-500", groom: "bg-indigo-500", brideRing: "ring-red-100", groomRing: "ring-indigo-100", brideText: "text-red-600", groomText: "text-indigo-600", brideIcon: "text-red-500", groomIcon: "text-indigo-500" },
    { bride: "bg-purple-500", groom: "bg-green-500", brideRing: "ring-purple-100", groomRing: "ring-green-100", brideText: "text-purple-600", groomText: "text-green-600", brideIcon: "text-purple-500", groomIcon: "text-green-500" },
    { bride: "bg-orange-500", groom: "bg-cyan-500", brideRing: "ring-orange-100", groomRing: "ring-cyan-100", brideText: "text-orange-600", groomText: "text-cyan-600", brideIcon: "text-orange-500", groomIcon: "text-cyan-500" },
  ]
  return colorPairs[(coupleId - 1) % colorPairs.length]
}

// AI Chatbot Interfaces
interface ChatMessage {
  id: string
  type: 'ai' | 'user'
  content: string
  timestamp: Date
  questionId?: string
}

interface Question {
  id: string
  type: 'text' | 'multiple-choice' | 'rating' | 'boolean'
  question: string
  options?: string[]
  required: boolean
  followUpQuestions?: Question[]
  category: 'ceremony-type' | 'logistics' | 'personal' | 'preferences'
  aiRecommendation?: string
}

interface CeremonyProfile {
  ceremonyType: string
  duration: string
  tone: string
  specialRequests: string[]
  couplePreferences: Record<string, any>
}

// Backend Template for Dynamic Questions - Can be modified by admins
//
// ADMIN CONFIGURATION GUIDE:
//
// To add/remove/modify questions:
// 1. Each question object has the following properties:
//    - id: Unique identifier for the question
//    - type: 'text' | 'multiple-choice' | 'rating' | 'boolean'
//    - question: The actual question text
//    - options: Array of choices (only for multiple-choice type)
//    - required: Boolean indicating if question is mandatory
//    - category: Groups related questions ('ceremony-type' | 'logistics' | 'personal' | 'preferences')
//    - aiRecommendation: Additional helpful context the AI provides
//
// 2. To add a new question, simply add a new object to the GUIDED_QUESTIONS array
// 3. To remove a question, delete the object from the array
// 4. Questions are asked in the order they appear in the array
// 5. The AI will generate recommendations based on user responses
//
// Example new question:
// {
//   id: 'music-preference',
//   type: 'multiple-choice',
//   question: "What type of music would you like during the ceremony?",
//   options: ['Classical', 'Modern', 'Religious', 'No Music'],
//   required: false,
//   category: 'preferences',
//   aiRecommendation: "Music can enhance the emotional impact of your ceremony."
// }
//
const GUIDED_QUESTIONS: Question[] = [
  {
    id: 'ceremony-type',
    type: 'multiple-choice',
    question: "What type of ceremony are you looking to officiate?",
    options: ['Traditional', 'Modern', 'Religious', 'Secular', 'Interfaith', 'Custom'],
    required: true,
    category: 'ceremony-type',
    aiRecommendation: "Traditional ceremonies include classic vows and ring exchanges, while modern ceremonies offer more flexibility for personalization."
  },
  {
    id: 'ceremony-duration',
    type: 'multiple-choice',
    question: "How long should the ceremony be?",
    options: ['15-20 minutes', '20-30 minutes', '30-45 minutes', '45+ minutes'],
    required: true,
    category: 'logistics',
    aiRecommendation: "Most wedding ceremonies are 20-30 minutes. Shorter ceremonies focus on essentials, while longer ones include more personal elements."
  },
  {
    id: 'ceremony-tone',
    type: 'multiple-choice',
    question: "What tone would you like for the ceremony?",
    options: ['Formal and Traditional', 'Warm and Personal', 'Light and Joyful', 'Intimate and Romantic', 'Fun and Casual'],
    required: true,
    category: 'preferences',
    aiRecommendation: "The tone should reflect the couple's personality. I can help adjust the language and style accordingly."
  },
  {
    id: 'special-elements',
    type: 'multiple-choice',
    question: "Are there any special elements the couple wants to include?",
    options: ['Unity Candle', 'Sand Ceremony', 'Ring Warming', 'Handfasting', 'Cultural Traditions', 'None'],
    required: false,
    category: 'personal',
    aiRecommendation: "Special elements add meaning and personalization. I can provide scripts and guidance for any of these traditions."
  },
  {
    id: 'vows-type',
    type: 'multiple-choice',
    question: "Will the couple be writing their own vows or using traditional vows?",
    options: ['Traditional Vows', 'Personal Written Vows', 'Mix of Both', 'Not Sure Yet'],
    required: true,
    category: 'preferences',
    aiRecommendation: "I can provide traditional vow options or help you guide the couple in writing personal vows that fit the ceremony style."
  }
]

// AI Assistant Functions
const generateAIResponse = (question: Question, previousResponses: Record<string, string>): string => {
  const responses = [
    `Great! Let me ask you about ${question.category === 'ceremony-type' ? 'the type of ceremony' :
      question.category === 'logistics' ? 'the practical details' :
      question.category === 'personal' ? 'personal touches' : 'your preferences'}.`,

    `${question.question}`,

    question.aiRecommendation ? `💡 ${question.aiRecommendation}` : ''
  ].filter(Boolean)

  return responses.join('\n\n')
}

const generateRecommendation = (responses: Record<string, string>): string => {
  const ceremonyType = responses['ceremony-type']
  const duration = responses['ceremony-duration']
  const tone = responses['ceremony-tone']

  let recommendation = "Based on your preferences, here's what I recommend for your ceremony script:\n\n"

  if (ceremonyType) {
    recommendation += `📝 **Ceremony Style**: Since you've chosen a ${ceremonyType.toLowerCase()} ceremony, `
    if (ceremonyType === 'Traditional') {
      recommendation += "I'll include classic elements like traditional vows, ring exchange, and formal language.\n\n"
    } else if (ceremonyType === 'Modern') {
      recommendation += "I'll create a contemporary script with flexible elements and personalized touches.\n\n"
    } else if (ceremonyType === 'Religious') {
      recommendation += "I'll incorporate appropriate religious elements and blessings.\n\n"
    }
  }

  if (duration) {
    recommendation += `⏰ **Timing**: For a ${duration.toLowerCase()} ceremony, I'll structure the script with appropriate pacing and content.\n\n`
  }

  if (tone) {
    recommendation += `🎭 **Tone**: The ${tone.toLowerCase()} approach will be reflected in the language and style throughout.\n\n`
  }

  recommendation += "Would you like me to start generating your personalized ceremony script now? I can always adjust it based on any additional preferences you have!"

  return recommendation
}

// NOTE: File content truncated for API - please see attached file for full content
export function CommunicationPortal() {
  return <div>CommunicationPortal Component - v439</div>
}