"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import confetti from 'canvas-confetti'
import mammoth from 'mammoth'
import { supabase } from "@/supabase/utils/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  MessageCircle,
  FileText,
  CheckSquare,
  Calendar as CalendarIcon,
  Users,
  Send,
  Paperclip,
  Download,
  Plus,
  Check,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Heart,
  Star,
  FileSignature,
  DollarSign,
  ShoppingCart,
  Edit,
  FileEdit,
  Share,
  Eye,
  AlertCircle,
  CreditCard,
  Receipt,
  Banknote,
  TrendingUp,
  X,
  Save,
  UserPlus,
  Bell,
  Flag,
  Filter,
  SortAsc,
  Upload,
  Trash2,
  ChevronRight
} from "lucide-react"
import { AddTaskDialog, Task } from "@/components/AddTaskDialog"
import { ScheduleMeetingDialog, Meeting } from "@/components/ScheduleMeetingDialog"
import { FileUpload, UploadedFile } from "@/components/FileUpload"
import { ContractUploadDialog, Contract } from "@/components/ContractUploadDialog"
import { OfficiantDashboardDialog } from "@/components/OfficiantDashboardDialog"
import { MessengerPanel } from "@/components/MessengerPanel"

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

// Generate a complete ceremony script based on user responses
const generateCompleteScript = (responses: Record<string, string>, coupleInfo: any, weddingDetails: any): string => {
  const ceremonyType = responses['ceremony-type'] || 'Traditional'
  const duration = responses['ceremony-duration'] || '20-30 minutes'
  const tone = responses['ceremony-tone'] || 'Warm and Personal'
  const unityCeremony = responses['special-elements'] || 'None'
  const vowsType = responses['vows-type'] || 'Traditional Vows'

  const brideName = coupleInfo.brideName || 'Sarah'
  const groomName = coupleInfo.groomName || 'David'
  const venue = weddingDetails.venueName || 'Sunset Gardens'
  const date = new Date(weddingDetails.weddingDate || '2024-08-25').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  let script = `${ceremonyType.toUpperCase()} WEDDING CEREMONY SCRIPT
Generated by Mr. Script for ${brideName} & ${groomName}
${venue} - ${date}

PROCESSIONAL
[Music begins as wedding party enters]

OPENING WORDS
"Family and friends, we are gathered here today at ${venue} to celebrate the union of ${brideName} and ${groomName} in marriage. On this beautiful ${date}, we witness not just the joining of two hearts, but the creation of a new family built on love, trust, and commitment.

${brideName} and ${groomName}, you have chosen to share your lives together, and we are honored to be part of this special moment."

DECLARATION OF INTENT
"${brideName}, do you take ${groomName} to be your lawfully wedded husband, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?"
[${brideName} responds: "I do"]

"${groomName}, do you take ${brideName} to be your lawfully wedded wife, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?"
[${groomName} responds: "I do"]

EXCHANGE OF VOWS`

  // Add vow section based on selection
  if (vowsType === 'Personal Written Vows') {
    script += `
[${brideName} and ${groomName} will now share their personal vows]

${brideName}: [Personal vows to be written by bride]

${groomName}: [Personal vows to be written by groom]`
  } else if (vowsType === 'Traditional Vows') {
    script += `
${brideName}: "I, ${brideName}, take you, ${groomName}, to be my husband. I promise to love you, honor you, and cherish you, in sickness and in health, for richer or poorer, for better or worse, for as long as we both shall live."

${groomName}: "I, ${groomName}, take you, ${brideName}, to be my wife. I promise to love you, honor you, and cherish you, in sickness and in health, for richer or poorer, for better or worse, for as long as we both shall live."`
  } else {
    script += `
[${vowsType} to be exchanged between ${brideName} and ${groomName}]`
  }

  // Add unity ceremony if selected
  if (unityCeremony && unityCeremony !== 'None') {
    script += `

${unityCeremony.toUpperCase()} CEREMONY
`
    if (unityCeremony === 'Unity Candle') {
      script += `[${brideName} and ${groomName} will now light the unity candle together]
"The unity candle represents the joining of your two lives into one. As you light this candle together, may it serve as a reminder that your love will forever burn bright."`
    } else if (unityCeremony === 'Sand Ceremony') {
      script += `[${brideName} and ${groomName} will now perform the sand ceremony]
"As you pour your individual sands together, you are creating something new and beautiful. Just as these grains of sand can never be separated, so too are your lives now joined as one."`
    } else if (unityCeremony === 'Handfasting') {
      script += `[${brideName} and ${groomName} will now participate in the handfasting ceremony]
"As we bind your hands together, we symbolize your commitment to each other. This is where the phrase 'tying the knot' comes from, representing the unbreakable bond you share."`
    } else {
      script += `[${brideName} and ${groomName} will now participate in the ${unityCeremony}]
"This ${unityCeremony} represents the joining of your lives and the commitment you make to each other."`
    }
  }

  script += `

RING CEREMONY
"These rings serve as a symbol of your unending love and commitment. As you place them on each other's hands, remember that love is not just a feeling, but a choice you make every day."

[Exchange of rings]

${brideName}: "${groomName}, I give you this ring as a symbol of my love and commitment to you."
${groomName}: "${brideName}, I give you this ring as a symbol of my love and commitment to you."

PRONOUNCEMENT
"By the power vested in me, and in the presence of these witnesses, I now pronounce you husband and wife. You may kiss!"

[First kiss as married couple]

RECESSIONAL
[Couple exits as music plays]

---
CEREMONY NOTES:
- Duration: ${duration}
- Style: ${ceremonyType}
- Tone: ${tone}
${unityCeremony !== 'None' ? `- Unity Ceremony: ${unityCeremony}` : ''}
- Vow Style: ${vowsType}

This script has been customized for your ceremony by Mr. Script. Feel free to modify any sections to better reflect your style and preferences.`

  return script
}

// Props interface
interface CommunicationPortalProps {
  onScriptUploaded?: (content: string, fileName: string) => void;
}

export function CommunicationPortal({ onScriptUploaded }: CommunicationPortalProps = {}) {
  // Auth and profile state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [officiantProfile, setOfficiantProfile] = useState<any>(null)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [newTask, setNewTask] = useState("")
  const [showAddCeremonyDialog, setShowAddCeremonyDialog] = useState(false)
  const [showEditCoupleDialog, setShowEditCoupleDialog] = useState(false)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [showScheduleMeetingDialog, setShowScheduleMeetingDialog] = useState(false)
  const [showContractUploadDialog, setShowContractUploadDialog] = useState(false)
  const [showEditWeddingDialog, setShowEditWeddingDialog] = useState(false)
  const [showAddEventDialog, setShowAddEventDialog] = useState(false)
  const [showEditMeetingDialog, setShowEditMeetingDialog] = useState(false)
  const [showFileViewerDialog, setShowFileViewerDialog] = useState(false)
  const [showContractViewerDialog, setShowContractViewerDialog] = useState(false)
  const [showSendContractDialog, setShowSendContractDialog] = useState(false)
  const [showSendPaymentReminderDialog, setShowSendPaymentReminderDialog] = useState(false)
  const [showGenerateInvoiceDialog, setShowGenerateInvoiceDialog] = useState(false)
  const [sendingContract, setSendingContract] = useState<any>(null)
  const [emailForm, setEmailForm] = useState({
    to: '',
    customEmail: '',
    subject: '',
    body: ''
  })
  const [paymentReminderForm, setPaymentReminderForm] = useState({
    to: '',
    customEmail: '',
    subject: '',
    body: ''
  })
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    weddingDate: '2024-08-25',
    coupleName: 'Sarah Johnson & David Chen',
    venue: 'Sunset Gardens',
    items: [
      {
        id: 1,
        service: 'Wedding Ceremony Officiant',
        description: 'Professional wedding ceremony officiation services including pre-ceremony consultation, personalized script, and ceremony performance',
        category: 'Ceremony Services',
        quantity: 1,
        rate: 800,
        amount: 800
      }
    ],
    subtotal: 800,
    taxRate: 0,
    taxAmount: 0,
    depositPaid: 300,
    balanceDue: 500,
    total: 800,
    notes: 'Payment due within 30 days. Thank you for choosing our services for your special day!',
    paymentMethods: 'Check, Cash, Venmo (@Pastor-Michael), PayPal (pastor.michael@ordainedpro.com), Zelle',
    terms: 'Payment due within 30 days of invoice date. Final payment must be received at least 7 days before the wedding ceremony. Late payments may incur additional fees.',
    bankDetails: 'Bank transfers available upon request',
    emailRecipients: 'both'
  })
  const [viewingContract, setViewingContract] = useState<any>(null)
  const [viewingFile, setViewingFile] = useState<any>(null)
  const [editMeetingForm, setEditMeetingForm] = useState({
    id: 0,
    subject: '',
    date: '',
    time: '',
    duration: 60,
    meetingType: 'in-person',
    location: '',
    body: ''
  })
  const [addEventForm, setAddEventForm] = useState({
    subject: '',
    date: '',
    time: '',
    category: 'rehearsal',
    details: ''
  })
  const [isCeremonyActive, setIsCeremonyActive] = useState(true)
  const [taskFilter, setTaskFilter] = useState("all") // all, pending, completed, high-priority
  const [ceremonyFiles, setCeremonyFiles] = useState<UploadedFile[]>([])

  // Persistent storage for saved ceremonies
  const [savedCeremonies, setSavedCeremonies] = useState<any[]>([])

  // Couples loaded from Supabase (no more mock data)
  const [allCouples, setAllCouples] = useState<any[]>([])
  const [couplesLoading, setCouplesLoading] = useState(true)

  const [activeCoupleIndex, setActiveCoupleIndex] = useState(0)
  const [showSwitchCeremonyDialog, setShowSwitchCeremonyDialog] = useState(false)
  const [showArchivedCeremoniesDialog, setShowArchivedCeremoniesDialog] = useState(false)
  const [showDashboardDialog, setShowDashboardDialog] = useState(false)

  // Form states for Add New Ceremony
  const [newCeremony, setNewCeremony] = useState({
    ceremonyName: "",
    ceremonyDate: "",
    ceremonyTime: "",
    venueName: "",
    venueAddress: "",
    expectedGuests: "",
    brideName: "",
    brideEmail: "",
    bridePhone: "",
    brideAddress: "",
    groomName: "",
    groomEmail: "",
    groomPhone: "",
    groomAddress: "",
    totalAmount: "",
    depositAmount: "",
    finalPaymentDate: "",
    notes: ""
  })

  // Form states for Edit Couple Info - loaded from active couple
  const [editCoupleInfo, setEditCoupleInfo] = useState(allCouples[activeCoupleIndex])

  // Persistent storage for wedding details per couple
  const [savedWeddingDetails, setSavedWeddingDetails] = useState<Record<string, any>>({
    "Sarah Johnson & David Chen": {
      venueName: "Sunset Gardens",
      venueAddress: "123 Rose Avenue, Garden City, CA 90210",
      weddingDate: "2024-08-25",
      startTime: "16:00",
      endTime: "18:00",
      expectedGuests: "75"
    }
  })

  // Get current couple identifier
  const currentCoupleId = `${editCoupleInfo?.brideName || ""} & ${editCoupleInfo?.groomName || ""}`

  // Form states for Edit Wedding Details - loads from saved data
  const [editWeddingDetails, setEditWeddingDetails] = useState(
    allCouples[activeCoupleIndex]?.weddingDetails || {
      venueName: "",
      venueAddress: "",
      weddingDate: "",
      startTime: "",
      endTime: "",
      expectedGuests: "",
      officiantNotes: ""
    }
  )

  // Tasks and meetings state
  const [tasks, setTasks] = useState<Task[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])

  // Load user and profile on mount
  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUser(user)

          // Load officiant profile
          const { data: profile } = await supabase
            .from("officiant_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (profile) {
            setOfficiantProfile(profile)
          }
        }
      } catch (err) {
        console.error("Error loading user/profile:", err)
      }
    }
    loadUserAndProfile()
  }, [])

  // Load couples from Supabase
  useEffect(() => {
    async function loadCouples() {
      if (!currentUser) return

      setCouplesLoading(true)
      try {
        const { data: couples, error } = await supabase
          .from("couples")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading couples:", error)
          return
        }

        if (couples && couples.length > 0) {
          const formattedCouples = couples.map((c: any) => ({
            id: c.id,
            brideName: c.bride_name || "",
            groomName: c.groom_name || "",
            brideEmail: c.bride_email || "",
            groomEmail: c.groom_email || "",
            bridePhone: c.bride_phone || "",
            groomPhone: c.groom_phone || "",
            weddingDetails: {
              venueName: c.venue_name || "",
              venueAddress: c.venue_address || "",
              weddingDate: c.wedding_date || "",
              startTime: c.start_time || "",
              endTime: c.end_time || "",
              expectedGuests: c.expected_guests?.toString() || ""
            }
          }))
          setAllCouples(formattedCouples)
          setEditCoupleInfo(formattedCouples[0])
          setEditWeddingDetails(formattedCouples[0]?.weddingDetails || {})
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setCouplesLoading(false)
      }
    }
    loadCouples()
  }, [currentUser])

  // Update edit forms when active couple changes
  useEffect(() => {
    if (allCouples[activeCoupleIndex]) {
      setEditCoupleInfo(allCouples[activeCoupleIndex])
      setEditWeddingDetails(allCouples[activeCoupleIndex].weddingDetails || {})
    }
  }, [activeCoupleIndex, allCouples])

  // Helper functions for meetings
  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMeetingStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Check className="w-3 h-3" />
      case 'pending': return <Clock className="w-3 h-3" />
      case 'completed': return <Check className="w-3 h-3" />
      default: return null
    }
  }

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '📹'
      case 'phone': return '📞'
      case 'in-person': return '👥'
      default: return '📅'
    }
  }

  // Handlers
  const handleAddTask = (task: Omit<Task, "id" | "createdDate">) => {
    const newTask: Task = {
      ...task,
      id: Date.now(),
      createdDate: new Date().toISOString()
    }
    setTasks(prev => [...prev, newTask])
    setShowAddTaskDialog(false)
  }

  const handleScheduleMeeting = (meeting: Omit<Meeting, "id" | "createdDate" | "status" | "reminderSent" | "calendarInviteSent">) => {
    const newMeeting: Meeting = {
      ...meeting,
      id: Date.now(),
      status: "pending",
      createdDate: new Date().toISOString(),
      reminderSent: false,
      calendarInviteSent: false
    }
    setMeetings(prev => [...prev, newMeeting])
    setShowScheduleMeetingDialog(false)
  }

  const handleContractUploaded = (contract: Omit<Contract, "id" | "createdDate">) => {
    const newContract: Contract = {
      ...contract,
      id: Date.now(),
      createdDate: new Date().toISOString()
    }
    setContracts(prev => [...prev, newContract])
    setShowContractUploadDialog(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/auth"
  }

  // Couple switch handler
  const handleSwitchCouple = (index: number) => {
    setActiveCoupleIndex(index)
    setShowSwitchCeremonyDialog(false)
  }

  // Add ceremony handler
  const handleAddCeremony = async () => {
    if (!currentUser || !newCeremony.brideName || !newCeremony.groomName) {
      alert("Please fill in bride and groom names")
      return
    }

    try {
      const { data, error } = await supabase
        .from("couples")
        .insert({
          user_id: currentUser.id,
          bride_name: newCeremony.brideName,
          groom_name: newCeremony.groomName,
          bride_email: newCeremony.brideEmail,
          groom_email: newCeremony.groomEmail,
          bride_phone: newCeremony.bridePhone,
          groom_phone: newCeremony.groomPhone,
          venue_name: newCeremony.venueName,
          venue_address: newCeremony.venueAddress,
          wedding_date: newCeremony.ceremonyDate || null,
          start_time: newCeremony.ceremonyTime || null,
          expected_guests: newCeremony.expectedGuests ? parseInt(newCeremony.expectedGuests) : null
        })
        .select()
        .single()

      if (error) throw error

      // Add to local state
      const newCouple = {
        id: data.id,
        brideName: newCeremony.brideName,
        groomName: newCeremony.groomName,
        brideEmail: newCeremony.brideEmail,
        groomEmail: newCeremony.groomEmail,
        bridePhone: newCeremony.bridePhone,
        groomPhone: newCeremony.groomPhone,
        weddingDetails: {
          venueName: newCeremony.venueName,
          venueAddress: newCeremony.venueAddress,
          weddingDate: newCeremony.ceremonyDate,
          startTime: newCeremony.ceremonyTime,
          endTime: "",
          expectedGuests: newCeremony.expectedGuests
        }
      }

      setAllCouples(prev => [newCouple, ...prev])
      setActiveCoupleIndex(0)
      setShowAddCeremonyDialog(false)
      setNewCeremony({
        ceremonyName: "",
        ceremonyDate: "",
        ceremonyTime: "",
        venueName: "",
        venueAddress: "",
        expectedGuests: "",
        brideName: "",
        brideEmail: "",
        bridePhone: "",
        brideAddress: "",
        groomName: "",
        groomEmail: "",
        groomPhone: "",
        groomAddress: "",
        totalAmount: "",
        depositAmount: "",
        finalPaymentDate: "",
        notes: ""
      })

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    } catch (err) {
      console.error("Error adding ceremony:", err)
      alert("Failed to add ceremony")
    }
  }

  // Loading state
  if (couplesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your ceremonies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Heart className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-blue-900">OrdainedPro Portal</h1>
                <p className="text-xs text-blue-600">
                  {officiantProfile?.full_name || "Wedding Officiant"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Current Couple Display */}
              {editCoupleInfo && (
                <Button
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => setShowSwitchCeremonyDialog(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {editCoupleInfo.brideName} & {editCoupleInfo.groomName}
                </Button>
              )}

              {/* Officiant Dashboard Button */}
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => setShowDashboardDialog(true)}
              >
                <User className="w-4 h-4 mr-2" />
                Dashboard
              </Button>

              {/* Profile Avatar */}
              <Avatar className="h-10 w-10 border-2 border-blue-200">
                <AvatarImage
                  src={officiantProfile?.headshot_url ? `${officiantProfile.headshot_url}?t=${Date.now()}` : undefined}
                  crossOrigin="anonymous"
                />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {officiantProfile?.full_name?.charAt(0) || "O"}
                </AvatarFallback>
              </Avatar>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-red-500"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {editCoupleInfo ? (
          <Tabs defaultValue="messages" className="space-y-6">
            <TabsList className="bg-white border border-blue-100 shadow-sm">
              <TabsTrigger value="messages" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
                <MessageCircle className="w-4 h-4 mr-2" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
                <CheckSquare className="w-4 h-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="scripts" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
                <FileText className="w-4 h-4 mr-2" />
                Scripts
              </TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
                <DollarSign className="w-4 h-4 mr-2" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Marketplace
              </TabsTrigger>
            </TabsList>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <MessengerPanel
                editCoupleInfo={editCoupleInfo}
                currentUser={currentUser}
                officiantProfile={officiantProfile}
                meetings={meetings}
                onScheduleMeeting={() => setShowScheduleMeetingDialog(true)}
                onAddTask={() => setShowAddTaskDialog(true)}
                onShareScript={() => {}}
                getMeetingStatusColor={getMeetingStatusColor}
                getMeetingStatusIcon={getMeetingStatusIcon}
                getMeetingTypeIcon={getMeetingTypeIcon}
              />
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks">
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-blue-900">Tasks & Checklist</CardTitle>
                      <CardDescription>Manage ceremony preparation tasks</CardDescription>
                    </div>
                    <Button
                      className="bg-blue-500 hover:bg-blue-600"
                      onClick={() => setShowAddTaskDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {tasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No tasks yet. Add your first task to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => {
                                setTasks(prev => prev.map(t =>
                                  t.id === task.id ? { ...t, completed: !t.completed } : t
                                ))
                              }}
                              className="w-5 h-5 rounded border-gray-300"
                            />
                            <span className={task.completed ? "line-through text-gray-400" : ""}>
                              {task.task}
                            </span>
                          </div>
                          {task.dueDate && (
                            <Badge variant="outline">{task.dueDate}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scripts Tab */}
            <TabsContent value="scripts">
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-blue-900">Ceremony Scripts</CardTitle>
                  <CardDescription>Create and manage your ceremony scripts</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Script management coming soon!</p>
                    <p className="text-sm mt-2">Upload and edit your ceremony scripts here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="text-blue-900">Calendar</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>

                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-blue-900">Meetings</CardTitle>
                      <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600"
                        onClick={() => setShowScheduleMeetingDialog(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {meetings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p>No meetings scheduled</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {meetings.map(meeting => (
                          <div key={meeting.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-blue-900">{meeting.subject}</p>
                                <p className="text-sm text-blue-600">
                                  {new Date(meeting.date).toLocaleDateString()} at {meeting.time}
                                </p>
                              </div>
                              <Badge className={getMeetingStatusColor(meeting.status)}>
                                {meeting.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-blue-900">Payment Management</CardTitle>
                  <CardDescription>Track deposits, invoices, and payments</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Payment tracking coming soon!</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace">
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-blue-900">Script Marketplace</CardTitle>
                  <CardDescription>Browse and purchase wedding scripts</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-blue-300" />
                    <p className="text-gray-600 mb-4">Visit the OrdainedPro Marketplace to browse and purchase ceremony scripts.</p>
                    <Button
                      className="bg-blue-500 hover:bg-blue-600"
                      onClick={() => window.open(process.env.NEXT_PUBLIC_MARKETPLACE_URL || "https://ordainedpro-marketplace.netlify.app", "_blank")}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Open Marketplace
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="border-blue-100 shadow-md">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-6 text-blue-300" />
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Welcome to OrdainedPro!</h2>
              <p className="text-gray-600 mb-6">Get started by adding your first ceremony.</p>
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => setShowAddCeremonyDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Ceremony
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Switch Ceremony Dialog */}
      <Dialog open={showSwitchCeremonyDialog} onOpenChange={setShowSwitchCeremonyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Ceremony</DialogTitle>
            <DialogDescription>Select a couple to work with</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allCouples.map((couple, index) => (
              <Button
                key={couple.id}
                variant={index === activeCoupleIndex ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleSwitchCouple(index)}
              >
                <Users className="w-4 h-4 mr-2" />
                {couple.brideName} & {couple.groomName}
                {couple.weddingDetails?.weddingDate && (
                  <Badge variant="outline" className="ml-auto">
                    {new Date(couple.weddingDetails.weddingDate).toLocaleDateString()}
                  </Badge>
                )}
              </Button>
            ))}
            <Separator />
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => {
                setShowSwitchCeremonyDialog(false)
                setShowAddCeremonyDialog(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Ceremony
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Ceremony Dialog */}
      <Dialog open={showAddCeremonyDialog} onOpenChange={setShowAddCeremonyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Ceremony</DialogTitle>
            <DialogDescription>Enter the couple's information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bride's Name *</Label>
                <Input
                  value={newCeremony.brideName}
                  onChange={e => setNewCeremony(prev => ({ ...prev, brideName: e.target.value }))}
                  placeholder="Sarah Johnson"
                />
              </div>
              <div>
                <Label>Groom's Name *</Label>
                <Input
                  value={newCeremony.groomName}
                  onChange={e => setNewCeremony(prev => ({ ...prev, groomName: e.target.value }))}
                  placeholder="David Chen"
                />
              </div>
              <div>
                <Label>Bride's Email</Label>
                <Input
                  type="email"
                  value={newCeremony.brideEmail}
                  onChange={e => setNewCeremony(prev => ({ ...prev, brideEmail: e.target.value }))}
                  placeholder="sarah@email.com"
                />
              </div>
              <div>
                <Label>Groom's Email</Label>
                <Input
                  type="email"
                  value={newCeremony.groomEmail}
                  onChange={e => setNewCeremony(prev => ({ ...prev, groomEmail: e.target.value }))}
                  placeholder="david@email.com"
                />
              </div>
              <div>
                <Label>Wedding Date</Label>
                <Input
                  type="date"
                  value={newCeremony.ceremonyDate}
                  onChange={e => setNewCeremony(prev => ({ ...prev, ceremonyDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Ceremony Time</Label>
                <Input
                  type="time"
                  value={newCeremony.ceremonyTime}
                  onChange={e => setNewCeremony(prev => ({ ...prev, ceremonyTime: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <Label>Venue Name</Label>
                <Input
                  value={newCeremony.venueName}
                  onChange={e => setNewCeremony(prev => ({ ...prev, venueName: e.target.value }))}
                  placeholder="Sunset Gardens"
                />
              </div>
              <div className="col-span-2">
                <Label>Venue Address</Label>
                <Input
                  value={newCeremony.venueAddress}
                  onChange={e => setNewCeremony(prev => ({ ...prev, venueAddress: e.target.value }))}
                  placeholder="123 Rose Avenue, City, State"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddCeremonyDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleAddCeremony}>
                <Plus className="w-4 h-4 mr-2" />
                Add Ceremony
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <AddTaskDialog
        isOpen={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        onAddTask={handleAddTask}
      />

      {/* Schedule Meeting Dialog */}
      <ScheduleMeetingDialog
        isOpen={showScheduleMeetingDialog}
        onOpenChange={setShowScheduleMeetingDialog}
        onScheduleMeeting={handleScheduleMeeting}
      />

      {/* Contract Upload Dialog */}
      <ContractUploadDialog
        isOpen={showContractUploadDialog}
        onOpenChange={setShowContractUploadDialog}
        onContractUploaded={handleContractUploaded}
      />

      {/* Officiant Dashboard Dialog */}
      <OfficiantDashboardDialog
        open={showDashboardDialog}
        onOpenChange={setShowDashboardDialog}
        onSelectCouple={(ceremonyId: string) => {
          const index = allCouples.findIndex(c => c.id.toString() === ceremonyId)
          if (index >= 0) {
            setActiveCoupleIndex(index)
          }
          setShowDashboardDialog(false)
        }}
        couples={allCouples}
        onAddCeremony={() => {
          setShowDashboardDialog(false)
          setShowAddCeremonyDialog(true)
        }}
      />
    </div>
  )
}
