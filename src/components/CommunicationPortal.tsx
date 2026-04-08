"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabase/utils/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Calendar as CalendarIcon,
  CheckSquare,
  DollarSign,
  FileSignature,
  FileText,
  ShoppingCart,
  Heart,
  Users,
  Settings,
  LogOut,
  Plus,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { AddCeremonyDialog, NewCeremonyData } from "@/components/AddCeremonyDialog";

interface CommunicationPortalProps {
  onScriptUploaded?: (content: string, fileName: string) => void;
}

interface Couple {
  id: number;
  bride_name: string;
  groom_name: string;
  wedding_date?: string;
  venue_name?: string;
}

export function CommunicationPortal({ onScriptUploaded }: CommunicationPortalProps = {}) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCeremonyDialog, setShowAddCeremonyDialog] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalCouples: 0,
    upcomingCeremonies: 0,
    pendingTasks: 0,
    unreadMessages: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setProfile(profileData);

        // Fetch couples
        const { data: couplesData } = await supabase
          .from("couples")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setCouples(couplesData || []);

        // Calculate stats
        const totalCouples = couplesData?.length || 0;

        // Get pending tasks count
        const { count: pendingTasks } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", false);

        // Get unread messages count
        const { count: unreadMessages } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("sender", "couple")
          .eq("read", false);

        // Get pending payments count
        const { count: pendingPayments } = await supabase
          .from("payments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "pending");

        setStats({
          totalCouples,
          upcomingCeremonies: totalCouples, // Simplification
          pendingTasks: pendingTasks || 0,
          unreadMessages: unreadMessages || 0,
          pendingPayments: pendingPayments || 0,
        });
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleAddCeremony = async (data: NewCeremonyData) => {
    if (!user) return;

    try {
      // Insert couple
      const { data: couple, error: coupleError } = await supabase
        .from("couples")
        .insert({
          user_id: user.id,
          bride_name: data.brideName,
          groom_name: data.groomName,
          bride_email: data.brideEmail,
          groom_email: data.groomEmail,
          bride_phone: data.bridePhone,
          groom_phone: data.groomPhone,
        })
        .select()
        .single();

      if (coupleError) throw coupleError;

      // Insert ceremony
      const { error: ceremonyError } = await supabase
        .from("ceremonies")
        .insert({
          user_id: user.id,
          couple_id: couple.id,
          name: data.ceremonyName,
          date: data.ceremonyDate,
          time: data.ceremonyTime,
          venue_name: data.venueName,
          venue_address: data.venueAddress,
        });

      if (ceremonyError) throw ceremonyError;

      // Refresh couples
      const { data: newCouples } = await supabase
        .from("couples")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setCouples(newCouples || []);
      setStats(prev => ({ ...prev, totalCouples: newCouples?.length || 0 }));
      setShowAddCeremonyDialog(false);

      alert("✅ Ceremony added successfully!");
    } catch (error) {
      console.error("Error adding ceremony:", error);
      alert("Failed to add ceremony. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const navigationItems = [
    {
      title: "Messages",
      description: "Communicate with your couples",
      icon: MessageCircle,
      href: "/messages",
      color: "from-blue-500 to-indigo-600",
      badge: stats.unreadMessages > 0 ? stats.unreadMessages : null,
      badgeColor: "bg-red-500",
    },
    {
      title: "Calendar & Events",
      description: "Schedule meetings and manage events",
      icon: CalendarIcon,
      href: "/calendar",
      color: "from-sky-500 to-blue-600",
    },
    {
      title: "Tasks",
      description: "Track your ceremony tasks",
      icon: CheckSquare,
      href: "/tasks",
      color: "from-green-500 to-teal-600",
      badge: stats.pendingTasks > 0 ? stats.pendingTasks : null,
      badgeColor: "bg-orange-500",
    },
    {
      title: "Payments & Invoices",
      description: "Track payments and manage earnings",
      icon: DollarSign,
      href: "/payments",
      color: "from-emerald-500 to-green-600",
      badge: stats.pendingPayments > 0 ? stats.pendingPayments : null,
      badgeColor: "bg-amber-500",
    },
    {
      title: "Contracts",
      description: "Create and manage contracts",
      icon: FileSignature,
      href: "/contracts",
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Script Builder",
      description: "Build ceremony scripts with AI",
      icon: FileText,
      href: "/buildscript",
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Marketplace",
      description: "Buy and sell ceremony scripts",
      icon: ShoppingCart,
      href: "/marketplace",
      color: "from-pink-500 to-rose-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">OrdainedPro</h1>
                <p className="text-blue-600 font-medium">Officiant Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowAddCeremonyDialog(true)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Ceremony
              </Button>

              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 border-2 border-blue-200">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {profile?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="font-medium text-gray-900">{profile?.full_name || "Officiant"}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-500">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Couples</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalCouples}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Pending Tasks</p>
                  <p className="text-2xl font-bold text-green-900">{stats.pendingTasks}</p>
                </div>
                <CheckSquare className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Unread Messages</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.unreadMessages}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">Pending Payments</p>
                  <p className="text-2xl font-bold text-amber-900">{stats.pendingPayments}</p>
                </div>
                <DollarSign className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full hover:shadow-lg transition-all cursor-pointer border-gray-200 hover:border-blue-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    {item.badge && (
                      <Badge className={`${item.badgeColor} text-white`}>
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                  <div className="flex items-center text-blue-600 mt-4 text-sm font-medium">
                    Open <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Couples */}
        <Card className="border-blue-100 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-blue-900">Your Couples</CardTitle>
            <CardDescription>Quick access to your ceremony couples</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {couples.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No couples yet. Add your first ceremony to get started!</p>
                <Button
                  onClick={() => setShowAddCeremonyDialog(true)}
                  className="mt-4 bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Ceremony
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {couples.slice(0, 6).map((couple) => (
                  <div
                    key={couple.id}
                    className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10 bg-pink-100">
                        <AvatarFallback className="bg-pink-500 text-white text-sm">
                          {couple.bride_name?.[0] || "?"}{couple.groom_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {couple.bride_name} & {couple.groom_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {couple.wedding_date
                            ? new Date(couple.wedding_date).toLocaleDateString()
                            : "Date TBD"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Ceremony Dialog */}
      <AddCeremonyDialog
        open={showAddCeremonyDialog}
        onOpenChange={setShowAddCeremonyDialog}
        onAddCeremony={handleAddCeremony}
      />
    </div>
  );
}
