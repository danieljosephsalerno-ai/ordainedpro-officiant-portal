"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabase/utils/client";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Send,
  Users,
  RefreshCw,
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  Check,
  CheckCheck,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Couple {
  id: number;
  bride_name: string;
  groom_name: string;
  bride_email: string;
  groom_email: string;
  bride_phone?: string;
  groom_phone?: string;
}

interface Message {
  id: number;
  couple_id: number;
  user_id: string;
  sender: "officiant" | "couple";
  sender_name: string;
  content: string;
  read: boolean;
  created_at: string;
  attachments?: any[];
}

export function MessagesSection() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Couple selection state - CRITICAL FOR DATA ISOLATION
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState<number | null>(null);
  const [selectedCouple, setSelectedCouple] = useState<Couple | null>(null);

  // Messages for SELECTED couple only
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  // Fetch couples when user is available
  useEffect(() => {
    if (user) {
      fetchCouples();
    }
  }, [user]);

  // Fetch messages when selected couple changes - CRITICAL!
  useEffect(() => {
    if (selectedCoupleId && user) {
      // Clear old messages immediately to prevent data leak
      setMessages([]);

      // Fetch new messages for selected couple
      fetchMessagesForCouple(selectedCoupleId);

      // Update selected couple object
      const couple = couples.find(c => c.id === selectedCoupleId);
      setSelectedCouple(couple || null);
    } else {
      // No couple selected - clear all message data
      setMessages([]);
      setSelectedCouple(null);
      setUnreadCount(0);
    }
  }, [selectedCoupleId, couples]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!user?.id || !selectedCoupleId) return;

    const channel = supabase
      .channel(`messages-couple-${selectedCoupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `couple_id=eq.${selectedCoupleId}`,
        },
        () => {
          console.log("📨 Real-time message update for couple", selectedCoupleId);
          // Refetch messages for this specific couple
          fetchMessagesForCouple(selectedCoupleId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedCoupleId]);

  // Scroll to bottom when messages load
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCouples = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("couples")
        .select("id, bride_name, groom_name, bride_email, groom_email, bride_phone, groom_phone")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCouples(data);
        // Auto-select first couple if available
        if (data.length > 0 && !selectedCoupleId) {
          setSelectedCoupleId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching couples:", err);
    }
  };

  // Fetch messages for a SPECIFIC couple only - NO DATA MIXING!
  const fetchMessagesForCouple = async (coupleId: number) => {
    if (!user || !coupleId) return;

    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id)
        .eq("couple_id", coupleId)  // ⚠️ CRITICAL: Filter by couple_id
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
        return;
      }

      const formattedMessages: Message[] = (data || []).map((m: any) => ({
        id: m.id,
        couple_id: m.couple_id,
        user_id: m.user_id,
        sender: m.sender || "officiant",
        sender_name: m.sender_name || "Unknown",
        content: m.content,
        read: m.read || false,
        created_at: m.created_at,
        attachments: m.attachments || [],
      }));

      setMessages(formattedMessages);

      // Count unread messages from couple
      const unread = formattedMessages.filter(m => m.sender === "couple" && !m.read).length;
      setUnreadCount(unread);

      // Mark messages as read
      if (unread > 0) {
        await markMessagesAsRead(coupleId);
      }

    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markMessagesAsRead = async (coupleId: number) => {
    if (!user) return;

    try {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("couple_id", coupleId)
        .eq("sender", "couple")
        .eq("read", false);
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedCoupleId || !selectedCouple) {
      if (!selectedCoupleId) {
        alert("Please select a couple first");
      }
      return;
    }

    setSendingMessage(true);

    try {
      const messageData = {
        user_id: user.id,
        couple_id: selectedCoupleId,  // ⚠️ CRITICAL: Include couple_id
        sender: "officiant",
        sender_name: "Pastor Michael", // TODO: Use actual profile name
        content: newMessage.trim(),
        read: true, // Officiant's own messages are "read"
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("messages")
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
        return;
      }

      // Add to local state
      const newMsg: Message = {
        id: data.id,
        couple_id: data.couple_id,
        user_id: data.user_id,
        sender: "officiant",
        sender_name: messageData.sender_name,
        content: messageData.content,
        read: true,
        created_at: data.created_at,
      };

      setMessages([...messages, newMsg]);
      setNewMessage("");
      scrollToBottom();

      // Optionally send email notification to couple
      // await sendEmailNotification(selectedCouple, newMessage.trim());

    } catch (err) {
      console.error("Error:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' }) + ' ' +
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Portal
                </Button>
              </Link>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <p className="text-blue-600 font-medium">Communicate with your couples</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Couple List */}
          <div className="lg:col-span-1">
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-blue-900 text-lg">Couples</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchCouples}
                    className="text-blue-600"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {couples.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No couples yet</p>
                    </div>
                  ) : (
                    couples.map((couple) => (
                      <button
                        key={couple.id}
                        onClick={() => setSelectedCoupleId(couple.id)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          selectedCoupleId === couple.id
                            ? "bg-blue-100 border-l-4 border-blue-500"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={`${
                            selectedCoupleId === couple.id
                              ? "bg-blue-500 text-white"
                              : "bg-pink-100 text-pink-700"
                          }`}>
                            {getInitials(couple.bride_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className={`font-medium text-sm ${
                            selectedCoupleId === couple.id
                              ? "text-blue-900"
                              : "text-gray-900"
                          }`}>
                            {couple.bride_name} & {couple.groom_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {couple.bride_email}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="border-blue-100 shadow-md h-[600px] flex flex-col">
              {/* Chat Header */}
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex-shrink-0">
                {selectedCouple ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12 border-2 border-pink-200">
                        <AvatarFallback className="bg-pink-500 text-white text-lg">
                          {getInitials(selectedCouple.bride_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-blue-900">
                          {selectedCouple.bride_name} & {selectedCouple.groom_name}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {selectedCouple.bride_email}
                          </span>
                          {selectedCouple.bride_phone && (
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {selectedCouple.bride_phone}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchMessagesForCouple(selectedCoupleId!)}
                      className="text-blue-600 border-blue-300"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-500">Select a Couple</CardTitle>
                      <CardDescription>Choose a couple from the list to view messages</CardDescription>
                    </div>
                  </div>
                )}
              </CardHeader>

              {/* Messages Area */}
              <CardContent
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 bg-gray-50"
              >
                {!selectedCoupleId ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg">Select a couple to view messages</p>
                      <p className="text-sm mt-2">Your conversation will appear here</p>
                    </div>
                  </div>
                ) : loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin opacity-50" />
                      <p>Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg">No messages yet</p>
                      <p className="text-sm mt-2">Start the conversation below!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "officiant" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            message.sender === "officiant"
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm"
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-xs font-medium ${
                              message.sender === "officiant"
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}>
                              {message.sender_name}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <div className={`flex items-center justify-end space-x-1 mt-2 ${
                            message.sender === "officiant"
                              ? "text-blue-200"
                              : "text-gray-400"
                          }`}>
                            <span className="text-xs">{formatTime(message.created_at)}</span>
                            {message.sender === "officiant" && (
                              message.read ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </CardContent>

              {/* Message Input */}
              <div className="border-t bg-white p-4 flex-shrink-0">
                {selectedCoupleId ? (
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500"
                      disabled
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Message ${selectedCouple?.bride_name} & ${selectedCouple?.groom_name}...`}
                      className="flex-1 resize-none min-h-[44px] max-h-32 border-gray-200"
                      rows={1}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {sendingMessage ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-2 text-gray-400">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">Select a couple to send messages</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
