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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileEdit,
  Send,
  Check,
  RefreshCw,
  Copy,
  Download,
  Save,
  ArrowLeft,
  Sparkles,
  MessageCircle,
  FileText,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { READING_CATEGORIES } from "@/data/ceremony-readings";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function BuildScriptSection() {
  const [user, setUser] = useState<any>(null);
  const [scriptMode, setScriptMode] = useState<"guided" | "expert" | null>(null);
  const [scriptBuilderTab, setScriptBuilderTab] = useState("mr-script");

  // Quick Setup state
  const [selectedCeremonyStyle, setSelectedCeremonyStyle] = useState("");
  const [selectedCeremonyLength, setSelectedCeremonyLength] = useState("");
  const [selectedUnityCeremony, setSelectedUnityCeremony] = useState("");
  const [selectedVowsType, setSelectedVowsType] = useState("");
  const [selectedReadingStyle, setSelectedReadingStyle] = useState("");

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hello! I'm Mr. Script, your AI ceremony writing assistant. I'll help you create a beautiful, personalized wedding ceremony script. Let's start with a few questions about the couple's preferences. What style of ceremony are you looking for?",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedScript, setHasGeneratedScript] = useState(false);
  const [generatedScriptContent, setGeneratedScriptContent] = useState("");
  const [scriptSegments, setScriptSegments] = useState<string[]>([]);

  // Questionnaire state
  const [questionnaireStarted, setQuestionnaireStarted] = useState(false);
  const [questionnaireResponses, setQuestionnaireResponses] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Dialog state
  const [showScriptEditorDialog, setShowScriptEditorDialog] = useState(false);

  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleModeSelect = (mode: "guided" | "expert") => {
    setScriptMode(mode);
  };

  const resetChatbot = () => {
    setChatMessages([
      {
        id: "1",
        type: "assistant",
        content: "Hello! I'm Mr. Script, your AI ceremony writing assistant. I'll help you create a beautiful, personalized wedding ceremony script. Let's start with a few questions about the couple's preferences. What style of ceremony are you looking for?",
        timestamp: new Date(),
      },
    ]);
    setQuestionnaireStarted(false);
    setQuestionnaireResponses({});
    setCurrentQuestionIndex(0);
    setHasGeneratedScript(false);
    setGeneratedScriptContent("");
    setScriptSegments([]);
  };

  const startQuestionnaire = () => {
    setQuestionnaireStarted(true);
    setChatMessages([
      ...chatMessages,
      {
        id: Date.now().toString(),
        type: "assistant",
        content: "Great! Let's create a truly personalized ceremony script. I'll ask you some questions about the couple's story, preferences, and special moments. First question: How did the couple meet?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, userMessage]);
    setChatInput("");
    setIsGenerating(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: getAIResponse(chatInput),
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
      setIsGenerating(false);
    }, 1500);
  };

  const getAIResponse = (input: string): string => {
    const responses = [
      "That's wonderful! This will help create a meaningful ceremony. What other special elements would you like to include?",
      "I love that detail! It will add a personal touch to the ceremony. Tell me more about what makes this couple unique.",
      "Perfect! I'm noting all of this down. Is there a particular tone you'd like for the ceremony - more formal, casual, or a mix?",
      "Great choice! Would you like me to incorporate any readings, poems, or cultural traditions?",
      "I have enough information to start drafting your script. Would you like me to generate a complete ceremony script now?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleGenerateScript = async () => {
    setIsGenerating(true);

    const prompt = `Create a ${selectedCeremonyStyle} wedding ceremony script that is ${selectedCeremonyLength} long.
    Include ${selectedUnityCeremony !== "None" ? selectedUnityCeremony : "no unity ceremony"}.
    Use ${selectedVowsType} vows style.
    Include readings in the ${selectedReadingStyle} style.`;

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedScriptContent(data.script || getMockScript());
        setHasGeneratedScript(true);
        parseScriptIntoSegments(data.script || getMockScript());
      } else {
        // Use mock script if API fails
        const mockScript = getMockScript();
        setGeneratedScriptContent(mockScript);
        setHasGeneratedScript(true);
        parseScriptIntoSegments(mockScript);
      }
    } catch (error) {
      console.error("Error generating script:", error);
      const mockScript = getMockScript();
      setGeneratedScriptContent(mockScript);
      setHasGeneratedScript(true);
      parseScriptIntoSegments(mockScript);
    } finally {
      setIsGenerating(false);
    }
  };

  const getMockScript = () => {
    return `# Wedding Ceremony Script

## Welcome & Opening

Dearly beloved, we are gathered here today to celebrate one of life's greatest moments, the joining of two hearts.

In this ceremony today we will witness the joining of [Partner 1] and [Partner 2] in marriage.

## Reading

"Love is patient, love is kind. It does not envy, it does not boast, it is not proud."

## Vows

[Partner 1], please repeat after me:
I, [Partner 1], take you, [Partner 2], to be my lawfully wedded spouse...

## Ring Exchange

These rings are a symbol of your never-ending love and commitment to one another.

## Declaration of Marriage

By the power vested in me, I now pronounce you married.

## Closing

You may now kiss!

Ladies and gentlemen, I present to you the newly married couple!`;
  };

  const parseScriptIntoSegments = (script: string) => {
    const segments = script.split(/#{1,2}\s+/).filter(Boolean);
    setScriptSegments(segments);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScriptContent);
    alert("Script copied to clipboard!");
  };

  const handleDownloadScript = () => {
    const blob = new Blob([generatedScriptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ceremony-script.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveScript = async () => {
    if (!user) {
      alert("Please sign in to save scripts");
      return;
    }

    try {
      const { error } = await supabase.from("scripts").insert({
        user_id: user.id,
        title: `${selectedCeremonyStyle} Ceremony - ${new Date().toLocaleDateString()}`,
        content: generatedScriptContent,
        style: selectedCeremonyStyle,
        length: selectedCeremonyLength,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      alert("Script saved successfully!");
    } catch (error) {
      console.error("Error saving script:", error);
      alert("Failed to save script. Please try again.");
    }
  };

  const completedSelections = [
    selectedCeremonyStyle,
    selectedCeremonyLength,
    selectedUnityCeremony,
    selectedVowsType,
    selectedReadingStyle,
  ].filter(Boolean).length;

  const progressPercent = Math.round((completedSelections / 5) * 100);

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
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mr. Script - AI Script Builder</h1>
                <p className="text-purple-600 font-medium">Create personalized ceremony scripts with AI</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Script Writing Mode Toggle */}
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600">
              <CardTitle className="text-white flex items-center">
                <FileEdit className="w-5 h-5 mr-2" />
                Script Writing Mode
              </CardTitle>
              <CardDescription className="text-purple-100">
                Choose your approach to creating the ceremony script
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex space-x-3 mb-6">
                <Button
                  variant={scriptMode === "guided" ? "default" : "outline"}
                  onClick={() => handleModeSelect("guided")}
                  className={`${
                    scriptMode === "guided"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border-green-200 text-green-700 hover:bg-green-50"
                  }`}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Guided Mode
                </Button>
                <Button
                  variant={scriptMode === "expert" ? "default" : "outline"}
                  onClick={() => handleModeSelect("expert")}
                  className={`${
                    scriptMode === "expert"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-blue-200 text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Freelance / Expert Mode
                </Button>
              </div>

              {/* Guided Mode Content */}
              {scriptMode === "guided" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-green-900">AI-Guided Script Creation</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetChatbot}
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Chat
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-900">Quick Setup Progress</span>
                      <span className="text-sm font-semibold text-green-700">
                        {completedSelections} / 5 selections
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3 border border-green-200 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {completedSelections === 5 && (
                      <p className="text-xs text-green-700 mt-2 font-medium flex items-center">
                        <Check className="w-4 h-4 mr-1" />
                        Quick Setup complete! Generate your script or start the questionnaire.
                      </p>
                    )}
                  </div>

                  {/* Quick Setup Form */}
                  <div className="mb-6 p-4 bg-white border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-3">Quick Setup</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium text-green-900">Ceremony Style</Label>
                        <Select value={selectedCeremonyStyle} onValueChange={setSelectedCeremonyStyle}>
                          <SelectTrigger className="border-green-200">
                            <SelectValue placeholder="Select a style..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Traditional">Traditional</SelectItem>
                            <SelectItem value="Modern">Modern</SelectItem>
                            <SelectItem value="Religious">Religious</SelectItem>
                            <SelectItem value="Secular">Secular</SelectItem>
                            <SelectItem value="Interfaith">Interfaith</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-green-900">Ceremony Length</Label>
                        <Select value={selectedCeremonyLength} onValueChange={setSelectedCeremonyLength}>
                          <SelectTrigger className="border-green-200">
                            <SelectValue placeholder="Select duration..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15-20 minutes">15-20 minutes</SelectItem>
                            <SelectItem value="20-30 minutes">20-30 minutes</SelectItem>
                            <SelectItem value="30-45 minutes">30-45 minutes</SelectItem>
                            <SelectItem value="45+ minutes">45+ minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-green-900">Unity Ceremony</Label>
                        <Select value={selectedUnityCeremony} onValueChange={setSelectedUnityCeremony}>
                          <SelectTrigger className="border-green-200">
                            <SelectValue placeholder="Select unity ceremony..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="Handfasting">Handfasting</SelectItem>
                            <SelectItem value="Unity Candle">Unity Candle</SelectItem>
                            <SelectItem value="Sand Ceremony">Sand Ceremony</SelectItem>
                            <SelectItem value="Wine Ceremony">Wine Ceremony</SelectItem>
                            <SelectItem value="Ring Warming">Ring Warming</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-green-900">Vows</Label>
                        <Select value={selectedVowsType} onValueChange={setSelectedVowsType}>
                          <SelectTrigger className="border-green-200">
                            <SelectValue placeholder="Select vow style..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Traditional">Traditional</SelectItem>
                            <SelectItem value="Personal">Personal</SelectItem>
                            <SelectItem value="Modern">Modern</SelectItem>
                            <SelectItem value="Repeating">Repeating After Officiant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-green-900">Reading Style</Label>
                        <Select value={selectedReadingStyle} onValueChange={setSelectedReadingStyle}>
                          <SelectTrigger className="border-green-200">
                            <SelectValue placeholder="Select reading style..." />
                          </SelectTrigger>
                          <SelectContent>
                            {READING_CATEGORIES?.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            )) || (
                              <>
                                <SelectItem value="romantic">Romantic</SelectItem>
                                <SelectItem value="religious">Religious</SelectItem>
                                <SelectItem value="poetry">Poetry</SelectItem>
                                <SelectItem value="humorous">Humorous</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={handleGenerateScript}
                        disabled={!selectedCeremonyStyle || !selectedCeremonyLength || isGenerating}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Quick Generate Script
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={startQuestionnaire}
                        disabled={questionnaireStarted}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Start Personalized Questionnaire
                      </Button>
                    </div>
                  </div>

                  {/* Chat Interface */}
                  <div className="bg-white border border-green-200 rounded-lg">
                    <div
                      ref={chatMessagesRef}
                      className="h-64 overflow-y-auto p-4 space-y-4"
                    >
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2 rounded-lg ${
                              message.type === "user"
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}
                      {isGenerating && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 px-4 py-2 rounded-lg">
                            <p className="text-sm text-gray-500">Mr. Script is typing...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-green-200 p-4">
                      <div className="flex space-x-2">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleChatSubmit()}
                          placeholder="Type your message..."
                          className="flex-1 border-green-200"
                        />
                        <Button onClick={handleChatSubmit} className="bg-green-600 hover:bg-green-700">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expert Mode Content */}
              {scriptMode === "expert" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-4">Freelance / Expert Mode</h3>
                  <p className="text-blue-700 mb-4">
                    Write your ceremony script from scratch using our professional editor with templates and formatting tools.
                  </p>
                  <Button
                    onClick={() => setShowScriptEditorDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Open Script Editor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Script Display */}
          {hasGeneratedScript && (
            <Card className="border-green-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-green-900">Generated Script</CardTitle>
                    <CardDescription>Your AI-generated ceremony script</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyScript}
                      className="border-green-200 text-green-700"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadScript}
                      className="border-green-200 text-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveScript}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save to Library
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-white border border-green-200 rounded-lg p-6 max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
                    {generatedScriptContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Script Editor Dialog */}
      <Dialog open={showScriptEditorDialog} onOpenChange={setShowScriptEditorDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Script Editor</DialogTitle>
            <DialogDescription>Write and edit your ceremony script</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={generatedScriptContent}
              onChange={(e) => setGeneratedScriptContent(e.target.value)}
              className="min-h-[400px] font-serif"
              placeholder="Start writing your ceremony script here..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowScriptEditorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScript} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Script
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
