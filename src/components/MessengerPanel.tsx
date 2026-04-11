"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/supabase/utils/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MessageCircle,
  FileText,
  CheckSquare,
  Calendar as CalendarIcon,
  Send,
  X
} from "lucide-react"
import { FileUpload, UploadedFile } from "@/components/FileUpload"

// Types
interface Message {
  id: number | string
  sender: string
  role: string
  message: string
  timestamp: string
  avatar: string
}

interface CoupleInfo {
  id: number
  brideName: string
  groomName: string
  brideEmail: string
  groomEmail: string
}

interface OfficiantProfile {
  full_name?: string
}

interface Meeting {
  id: number
  subject: string
  date: string
  time: string
  status: string
  meetingType: string
}

interface MessengerPanelProps {
  editCoupleInfo: CoupleInfo
  currentUser: any
  officiantProfile: OfficiantProfile | null
  meetings: Meeting[]
  onScheduleMeeting: () => void
  onAddTask: () => void
  onShareScript: () => void
  getMeetingStatusColor: (status: string) => string
  getMeetingStatusIcon: (status: string) => React.ReactNode
  getMeetingTypeIcon: (type: string) => string
}

export function MessengerPanel({
  editCoupleInfo,
  currentUser,
  officiantProfile,
  meetings,
  onScheduleMeeting,
  onAddTask,
  onShareScript,
  getMeetingStatusColor,
  getMeetingStatusIcon,
  getMeetingTypeIcon
}: MessengerPanelProps) {
  // Message State
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [messageAttachments, setMessageAttachments] = useState<UploadedFile[]>([])
  const [showAttachments, setShowAttachments] = useState(false)

  // Helper to format message timestamps
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Load messages from Supabase for the current couple
  const loadMessages = useCallback(async () => {
    if (!currentUser || !editCoupleInfo?.id) return

    try {
      console.log("📨 Loading messages for couple:", editCoupleInfo.id)

      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("couple_id", editCoupleInfo.id)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("❌ Error loading messages:", error)
        return
      }

      if (messagesData && messagesData.length > 0) {
        console.log("✅ Loaded", messagesData.length, "messages")

        // Transform to display format
        const formattedMessages = messagesData.map(msg => ({
          id: msg.id,
          sender: msg.sender_name || (msg.sender === "officiant" ? "Officiant" : "Couple"),
          role: msg.sender,
          message: msg.content,
          timestamp: formatMessageTime(msg.created_at),
          avatar: "/api/placeholder/40/40"
        }))

        setMessages(formattedMessages)
      } else {
        console.log("📭 No messages found for this couple")
        setMessages([])
      }
    } catch (err) {
      console.error("❌ Error in loadMessages:", err)
    }
  }, [currentUser, editCoupleInfo?.id])

  // Load messages when user or couple changes
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Real-time subscription for new messages (no flickering - just appends new messages)
  useEffect(() => {
    if (!currentUser || !editCoupleInfo?.id) return

    console.log("🔴 Setting up real-time subscription for couple:", editCoupleInfo.id)

    // Subscribe to new messages for this couple
    const channel = supabase
      .channel(`messages-${editCoupleInfo.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${editCoupleInfo.id}`
        },
        (payload) => {
          console.log("📬 Real-time: New message received!", payload.new)

          const newMsg = payload.new as any

          // Only add if it's for this user (or if user_id matches)
          if (newMsg.user_id === currentUser.id) {
            // Transform to display format and append (no full reload = no flicker)
            const formattedMsg = {
              id: newMsg.id,
              sender: newMsg.sender_name || (newMsg.sender === "officiant" ? "Officiant" : "Couple"),
              role: newMsg.sender,
              message: newMsg.content,
              timestamp: formatMessageTime(newMsg.created_at),
              avatar: "/api/placeholder/40/40"
            }

            // Append new message without duplicates
            setMessages(prev => {
              // Check if message already exists (prevent duplicates from optimistic updates)
              if (prev.some(m => m.id === newMsg.id)) {
                return prev
              }
              return [...prev, formattedMsg]
            })

            // Show notification if it's from the couple (not from officiant)
            if (newMsg.sender === "couple") {
              // Browser notification if permitted
              if (Notification.permission === "granted") {
                new Notification("New message from couple!", {
                  body: newMsg.content?.substring(0, 100) || "You have a new message",
                  icon: "/favicon.ico"
                })
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${editCoupleInfo.id}`
        },
        (payload) => {
          console.log("✏️ Real-time: Message updated", payload.new)
          const updatedMsg = payload.new as any

          setMessages(prev => prev.map(m =>
            m.id === updatedMsg.id
              ? {
                  ...m,
                  message: updatedMsg.content,
                  sender: updatedMsg.sender_name || (updatedMsg.sender === "officiant" ? "Officiant" : "Couple"),
                }
              : m
          ))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${editCoupleInfo.id}`
        },
        (payload) => {
          console.log("🗑️ Real-time: Message deleted", payload.old)
          const deletedMsg = payload.old as any
          setMessages(prev => prev.filter(m => m.id !== deletedMsg.id))
        }
      )
      .subscribe((status) => {
        console.log("📡 Real-time subscription status:", status)
      })

    // Cleanup on unmount or when couple changes
    return () => {
      console.log("🔌 Cleaning up real-time subscription")
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id, editCoupleInfo?.id])

  // Request notification permission (once)
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
  }, [])

  // File helpers
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('doc')) return '📝'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
    return '📎'
  }

  // Attachment handlers
  const handleMessageAttachmentsUploaded = (uploadedFiles: UploadedFile[]) => {
    setMessageAttachments(prev => [...prev, ...uploadedFiles])
  }

  const handleMessageAttachmentRemoved = (fileId: string) => {
    setMessageAttachments(prev => prev.filter(f => f.id !== fileId))
    if (messageAttachments.length <= 1) {
      setShowAttachments(false)
    }
  }

  // Send message handler
  const handleSendMessage = async () => {
    if (!newMessage.trim() && messageAttachments.length === 0) {
      return
    }

    if (isSendingMessage) return
    setIsSendingMessage(true)

    try {
      // Get officiant name from profile or user metadata
      const officiantName = officiantProfile?.full_name ||
                           currentUser?.user_metadata?.full_name ||
                           "Wedding Officiant"

      // Get couple info
      const coupleId = editCoupleInfo.id
      const coupleName = `${editCoupleInfo.brideName} & ${editCoupleInfo.groomName}`
      const brideEmail = editCoupleInfo.brideEmail
      const groomEmail = editCoupleInfo.groomEmail

      // Determine recipient emails
      const recipientEmails = [brideEmail, groomEmail].filter(Boolean)

      console.log("📧 Sending message to:", { coupleId, coupleName, recipientEmails, message: newMessage })

      // 1. Save message to Supabase
      if (currentUser) {
        const messageData = {
          user_id: currentUser.id,
          couple_id: coupleId,
          sender: "officiant",
          sender_name: officiantName,
          content: newMessage || "(File attachments)",
          read: true, // Officiant's own message is read
          created_at: new Date().toISOString(),
        }

        const { data: savedMessage, error: saveError } = await supabase
          .from("messages")
          .insert([messageData])
          .select()

        if (saveError) {
          console.error("❌ Error saving message to Supabase:", saveError)
        } else {
          console.log("✅ Message saved to Supabase:", savedMessage)

          // Add to local messages state
          setMessages(prev => [...prev, {
            id: savedMessage[0].id,
            sender: officiantName,
            role: "officiant",
            message: newMessage,
            timestamp: "Just now",
            avatar: "/api/placeholder/40/40"
          }])
        }
      }

      // 2. Send email via API
      let emailsSent = 0
      let emailErrors: string[] = []

      for (const email of recipientEmails) {
        if (!email) continue

        try {
          console.log(`📧 Attempting to send email to: ${email}`)

          const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email,
              subject: `Message from ${officiantName} - Wedding Planning`,
              message: newMessage,
              fromName: officiantName,
              coupleName: coupleName,
              coupleId: coupleId,
              officiantId: currentUser?.id
            })
          })

          const result = await response.json()
          console.log(`📧 API Response for ${email}:`, result)

          if (response.ok && result.success) {
            console.log(`✅ Email sent to ${email}:`, result)
            emailsSent++
          } else {
            const errorMsg = result.error || result.details || "Unknown error"
            console.error(`❌ Failed to send email to ${email}:`, result)
            emailErrors.push(`${email}: ${errorMsg}`)
          }
        } catch (emailError) {
          console.error(`❌ Error sending email to ${email}:`, emailError)
          emailErrors.push(`${email}: Network error`)
        }
      }

      // Clear message and attachments
      setNewMessage("")
      setMessageAttachments([])
      setShowAttachments(false)

      // Log results (no popup - the message appears in the conversation)
      if (emailsSent > 0) {
        console.log(`✅ Emails sent to: ${recipientEmails.join(", ")}`)
      }
      if (emailErrors.length > 0) {
        console.warn(`⚠️ Some emails failed:`, emailErrors)
      }

    } catch (error) {
      console.error("❌ Error in handleSendMessage:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setIsSendingMessage(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="border-blue-100 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-blue-900">Conversation</CardTitle>
            <CardDescription>Stay connected with your couple throughout the planning process</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm mt-1">Send a message to start the conversation with {editCoupleInfo?.brideName} & {editCoupleInfo?.groomName}</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex space-x-3 ${message.role === 'officiant' ? 'justify-end' : ''}`}>
                    {message.role !== 'officiant' && (
                      <Avatar className="ring-2 ring-blue-100">
                        <AvatarImage src={message.avatar} />
                        <AvatarFallback className="bg-blue-500 text-white">{message.sender?.split(' ').map((n: string) => n[0]).join('') || '?'}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`flex-1 max-w-xs lg:max-w-md ${message.role === 'officiant' ? 'order-first' : ''}`}>
                      <div className={`p-4 rounded-xl shadow-sm ${
                        message.role === 'officiant'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.message}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <span className="font-medium">{message.sender}</span>
                        <span className="mx-1">•</span>
                        <span>{message.timestamp}</span>
                      </p>
                    </div>
                    {message.role === 'officiant' && (
                      <Avatar className="ring-2 ring-blue-100">
                        <AvatarImage src={message.avatar} />
                        <AvatarFallback className="bg-blue-500 text-white">{message.sender?.split(' ').map((n: string) => n[0]).join('') || 'WO'}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Message Attachments Display */}
            {messageAttachments.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Attachments ({messageAttachments.length})
                </h4>
                <div className="space-y-2">
                  {messageAttachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded text-sm border border-blue-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getFileIcon(file.type)}</span>
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMessageAttachmentRemoved(file.id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 border-blue-200 focus:border-blue-500"
              />
              <FileUpload
                mode="compact"
                onFilesUploaded={handleMessageAttachmentsUploaded}
                onFileRemoved={handleMessageAttachmentRemoved}
                maxFiles={3}
                maxFileSize={5}
                existingFiles={messageAttachments}
              />
              <Button
                size="icon"
                className="bg-blue-500 hover:bg-blue-600"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && messageAttachments.length === 0}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="border-blue-100 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-blue-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <Button
              className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={onShareScript}
            >
              <FileText className="w-4 h-4 mr-2" />
              Share Script Draft
            </Button>
            <Button
              className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={onScheduleMeeting}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
            <Button
              className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={onAddTask}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            <Separator />
            <div>
              <h4 className="font-semibold mb-3 text-blue-900">Next Meeting</h4>
              <div className="space-y-2">
                {meetings.filter(meeting => new Date(meeting.date) >= new Date()).slice(0, 1).map((meeting) => (
                  <div key={meeting.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-sm border border-blue-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-blue-900">{meeting.subject}</p>
                      <Badge className={getMeetingStatusColor(meeting.status)}>
                        {getMeetingStatusIcon(meeting.status)}
                      </Badge>
                    </div>
                    <p className="text-blue-700">{new Date(meeting.date).toLocaleDateString()} at {meeting.time}</p>
                    <p className="text-blue-600 text-xs mt-1">{getMeetingTypeIcon(meeting.meetingType)} {meeting.meetingType}</p>
                  </div>
                ))}
                {meetings.filter(meeting => new Date(meeting.date) >= new Date()).length === 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200 text-center">
                    <p className="text-gray-500">No upcoming meetings</p>
                    <Button
                      size="sm"
                      className="mt-2 bg-blue-500 hover:bg-blue-600"
                      onClick={onScheduleMeeting}
                    >
                      Schedule One
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
