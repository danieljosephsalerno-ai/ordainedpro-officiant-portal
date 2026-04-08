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
  ShoppingCart,
  FileText,
  Users,
  Download,
  Globe,
  Star,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Upload,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { UploadScriptDialog } from "@/components/UploadScriptDialog";

interface Script {
  id: number;
  title: string;
  description?: string;
  price: number;
  status: "active" | "draft";
  published: boolean;
  rating: number;
  sales: number;
  earnings: number;
  content?: string;
  url?: string;
  created_at?: string;
}

export function MarketplaceSection() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myScripts, setMyScripts] = useState<Script[]>([
    {
      id: 1,
      title: "Traditional Wedding Ceremony",
      description: "A classic, timeless ceremony script",
      price: 29.99,
      status: "active",
      published: true,
      rating: 4.8,
      sales: 12,
      earnings: 359.88,
    },
    {
      id: 2,
      title: "Modern Love Story Ceremony",
      description: "Contemporary ceremony with personal touches",
      price: 34.99,
      status: "active",
      published: false,
      rating: 4.9,
      sales: 8,
      earnings: 279.92,
    },
  ]);
  const [coupleScripts, setCoupleScripts] = useState<any[]>([]);
  const [popularScripts, setPopularScripts] = useState<Script[]>([
    {
      id: 101,
      title: "Romantic Garden Ceremony",
      description: "Perfect for outdoor weddings",
      price: 24.99,
      status: "active",
      published: true,
      rating: 4.7,
      sales: 45,
      earnings: 0,
    },
    {
      id: 102,
      title: "Interfaith Unity Ceremony",
      description: "Blend traditions beautifully",
      price: 39.99,
      status: "active",
      published: true,
      rating: 4.9,
      sales: 32,
      earnings: 0,
    },
  ]);

  const [showUploadScriptDialog, setShowUploadScriptDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyScripts();
      fetchCoupleScripts();
    }
  }, [user]);

  const fetchMyScripts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("scripts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setMyScripts(data.map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          price: s.price || 0,
          status: s.status || "draft",
          published: s.published || false,
          rating: s.rating || 0,
          sales: s.sales || 0,
          earnings: s.earnings || 0,
          content: s.content,
          url: s.url,
          created_at: s.created_at,
        })));
      }
    } catch (err) {
      console.error("Error fetching scripts:", err);
    }
  };

  const fetchCoupleScripts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_files")
        .select("*")
        .eq("user_id", user.id)
        .ilike("type", "%script%")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCoupleScripts(data);
      }
    } catch (err) {
      console.error("Error fetching couple scripts:", err);
    }
  };

  const handleSetScriptPrice = (script: Script) => {
    setSelectedScript(script);
    setNewPrice(script.price.toString());
    setShowPricingDialog(true);
  };

  const handleSavePrice = async () => {
    if (!selectedScript || !newPrice) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      alert("Please enter a valid price");
      return;
    }

    setMyScripts(myScripts.map((s) =>
      s.id === selectedScript.id ? { ...s, price } : s
    ));

    try {
      await supabase
        .from("scripts")
        .update({ price })
        .eq("id", selectedScript.id);
    } catch (err) {
      console.error("Error updating price:", err);
    }

    setShowPricingDialog(false);
    setSelectedScript(null);
  };

  const handlePublishScript = async (script: Script) => {
    setMyScripts(myScripts.map((s) =>
      s.id === script.id ? { ...s, published: true } : s
    ));

    try {
      await supabase
        .from("scripts")
        .update({ published: true })
        .eq("id", script.id);
      alert(`"${script.title}" has been published to the marketplace!`);
    } catch (err) {
      console.error("Error publishing script:", err);
    }
  };

  const handleUnpublishScript = async (script: Script) => {
    setMyScripts(myScripts.map((s) =>
      s.id === script.id ? { ...s, published: false } : s
    ));

    try {
      await supabase
        .from("scripts")
        .update({ published: false })
        .eq("id", script.id);
      alert(`"${script.title}" has been unpublished from the marketplace.`);
    } catch (err) {
      console.error("Error unpublishing script:", err);
    }
  };

  const handleEditScript = (script: Script) => {
    // Open script editor
    console.log("Editing script:", script);
  };

  const handleDeleteScript = async (script: Script) => {
    if (!confirm(`Are you sure you want to delete "${script.title}"?`)) return;

    setMyScripts(myScripts.filter((s) => s.id !== script.id));

    try {
      await supabase
        .from("scripts")
        .delete()
        .eq("id", script.id);
    } catch (err) {
      console.error("Error deleting script:", err);
    }
  };

  const handleDeleteCoupleScript = async (scriptId: number) => {
    if (!confirm("Are you sure you want to delete this script?")) return;

    setCoupleScripts(coupleScripts.filter((s) => s.id !== scriptId));

    try {
      await supabase
        .from("user_files")
        .delete()
        .eq("id", scriptId);
    } catch (err) {
      console.error("Error deleting couple script:", err);
    }
  };

  const handleBrowseMarketplace = () => {
    const marketplaceUrl = process.env.NEXT_PUBLIC_MARKETPLACE_URL;
    if (marketplaceUrl) {
      window.open(marketplaceUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('Marketplace coming soon!');
    }
  };

  const handleCreateNewScript = () => {
    // Navigate to script builder
    window.location.href = "/buildscript";
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
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Script Marketplace</h1>
                <p className="text-purple-600 font-medium">Buy, sell, and manage ceremony scripts</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Browse External Marketplace */}
            <Card className="border-2 border-purple-200 shadow-lg bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-purple-900 flex items-center text-xl">
                      <ShoppingCart className="w-6 h-6 mr-3" />
                      Wedding Scripts Marketplace
                    </CardTitle>
                    <CardDescription className="text-purple-700 mt-2">
                      Browse and purchase professional wedding scripts from officiants worldwide
                    </CardDescription>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Globe className="w-4 h-4 mr-1" />
                    Live Marketplace
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Premium Scripts</p>
                      <p className="text-sm text-gray-600">Ready-to-use templates</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Expert Authors</p>
                      <p className="text-sm text-gray-600">From experienced officiants</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Download className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Instant Access</p>
                      <p className="text-sm text-gray-600">Download immediately</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Your Published Scripts Appear Automatically
                      </p>
                      <p className="text-xs text-gray-600">
                        When you publish a script below, it instantly appears in the marketplace for all users.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                  size="lg"
                  onClick={handleBrowseMarketplace}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Browse Marketplace
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* My Scripts */}
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-blue-900">My Script Library</CardTitle>
                    <CardDescription>Manage and sell your ceremony scripts</CardDescription>
                  </div>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => setShowUploadScriptDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Script
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {myScripts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No scripts in your library yet</p>
                      <p className="text-sm mt-2">Upload or create your first script</p>
                    </div>
                  ) : (
                    myScripts.map((script) => (
                      <div
                        key={script.id}
                        className="border border-blue-100 rounded-xl p-4 bg-white hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                              <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-semibold text-gray-900">{script.title}</p>
                                {script.published && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                    <Globe className="w-3 h-3 mr-1" />
                                    Published
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-1">
                                <Badge className={
                                  script.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }>
                                  {script.status === "active" ? "Active" : "Draft"}
                                </Badge>
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span>{script.rating}</span>
                                  <span>•</span>
                                  <span>{script.sales} sales</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">${script.price}</p>
                            <p className="text-sm text-green-600">Earned: ${script.earnings}</p>
                            <div className="flex flex-wrap gap-2 mt-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-200 text-green-700 hover:bg-green-50"
                                onClick={() => handleSetScriptPrice(script)}
                              >
                                <DollarSign className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={() => handleEditScript(script)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteScript(script)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              {script.published ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => handleUnpublishScript(script)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                  onClick={() => handlePublishScript(script)}
                                >
                                  <Globe className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* My Couple's Scripts */}
            <Card className="border-pink-100 shadow-md bg-gradient-to-r from-pink-50 to-rose-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-pink-900 flex items-center">
                      <Heart className="w-5 h-5 mr-2" />
                      My Couple's Scripts
                    </CardTitle>
                    <CardDescription className="text-pink-700">
                      Script drafts for your couples
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-pink-100 text-pink-800 border-pink-200">
                      {coupleScripts.length} drafts
                    </Badge>
                    <Button
                      className="bg-pink-500 hover:bg-pink-600"
                      onClick={handleCreateNewScript}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Script
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {coupleScripts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No couple scripts yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coupleScripts.map((script) => (
                      <div
                        key={script.id}
                        className="flex items-center justify-between p-4 border rounded-xl bg-white hover:bg-blue-50"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{script.name}</p>
                          <p className="text-sm text-gray-500">{script.size}</p>
                          <p className="text-xs text-gray-400">{script.created_at}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            className="text-blue-600"
                            onClick={() => window.open(script.url, "_blank")}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleDeleteCoupleScript(script.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Popular Scripts */}
          <div className="space-y-6">
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-blue-900">Popular Scripts</CardTitle>
                <CardDescription>Top-selling ceremony scripts</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {popularScripts.map((script) => (
                    <div
                      key={script.id}
                      className="border border-blue-100 rounded-xl p-4 bg-white hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{script.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-500 ml-1">{script.rating}</span>
                            </div>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{script.sales} sales</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{script.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">${script.price}</span>
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Buy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-green-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-green-900">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Scripts</span>
                    <span className="font-bold text-gray-900">{myScripts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Published</span>
                    <span className="font-bold text-purple-600">
                      {myScripts.filter(s => s.published).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Sales</span>
                    <span className="font-bold text-blue-600">
                      {myScripts.reduce((sum, s) => sum + s.sales, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Earnings</span>
                    <span className="font-bold text-green-600">
                      ${myScripts.reduce((sum, s) => sum + s.earnings, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Upload Script Dialog */}
      <UploadScriptDialog
        open={showUploadScriptDialog}
        onOpenChange={setShowUploadScriptDialog}
        onUploadSuccess={() => {
          // Refresh scripts list after upload
          fetchMyScripts();
        }}
      />

      {/* Pricing Dialog */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Script Price</DialogTitle>
            <DialogDescription>
              Set the price for "{selectedScript?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Enter price"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowPricingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePrice} className="bg-green-500 hover:bg-green-600">
              Save Price
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
