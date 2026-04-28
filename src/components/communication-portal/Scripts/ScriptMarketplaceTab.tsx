"use client"

import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Plus, Clock, Heart, Star, DollarSign, ShoppingCart, Edit, Share, Eye, TrendingUp, Upload } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function ScriptMarketplaceTab() {
  const {
    setShowArchivedCeremoniesDialog,
    handleEditScript,
    handleViewScript,
    handleCreateNewScript,
    handleShareScript,
    coupleScripts,
    myScripts,
    popularScripts,
  } = useCommunicationPortal()

  return (
<TabsContent value="marketplace">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {/* My Scripts */}
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-blue-900">My Script Library</CardTitle>
                          <CardDescription>Manage and sell your ceremony scripts to other officiants</CardDescription>
                        </div>
                        <Button className="bg-blue-500 hover:bg-blue-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Upload Script
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {myScripts.map((script) => (
                          <div key={script.id} className="border border-blue-100 rounded-xl p-4 bg-white hover:bg-blue-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{script.title}</p>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <Badge variant={script.status === 'active' ? 'default' : 'outline'}
                                           className={script.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                      {script.status === 'active' ? 'Active' : 'Draft'}
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
                                <div className="flex space-x-2 mt-2">
                                  <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* My Couple's Scripts */}
                  <Card className="border-pink-100 shadow-md bg-gradient-to-r from-pink-50 to-rose-50">
                    <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-pink-900 flex items-center">
                            <Heart className="w-5 h-5 mr-2" />
                            My Couple's Scripts
                          </CardTitle>
                          <CardDescription className="text-pink-700">Script drafts for Sarah Johnson & David Chen's wedding</CardDescription>
                        </div>
                        <Badge className="bg-pink-100 text-pink-800 border-pink-200">
                          3 drafts
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Sarah & David Script Drafts */}
                        {coupleScripts.map((script) => (
                          <div key={script.id} className="border border-pink-200 rounded-xl p-4 bg-white hover:bg-pink-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-200 rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-pink-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{script.title}</p>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <Badge variant="outline" className="text-xs border-pink-200 text-pink-700">
                                      {script.type}
                                    </Badge>
                                    <Badge variant="outline" className={`text-xs ${
                                      script.status === 'Latest Draft' ? 'border-green-200 text-green-700' :
                                      script.status === 'In Review' ? 'border-yellow-200 text-yellow-700' :
                                      'border-gray-200 text-gray-700'
                                    }`}>
                                      {script.status}
                                    </Badge>
                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                      <Clock className="w-3 h-3" />
                                      <span>Modified: {script.lastModified}</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{script.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-pink-700">Sarah & David</p>
                                <div className="flex space-x-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-pink-200 text-pink-700 hover:bg-pink-50"
                                    onClick={() => handleEditScript(script)}
                                    title="Edit script"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-pink-200 text-pink-700 hover:bg-pink-50"
                                    onClick={() => handleViewScript(script)}
                                    title="View script"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-pink-500 hover:bg-pink-600"
                                    onClick={() => handleShareScript(script)}
                                    title="Share script with couple"
                                  >
                                    <Share className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Add New Script Button */}
                        <div className="border-2 border-dashed border-pink-200 rounded-xl p-6 text-center hover:border-pink-300 transition-colors">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-3">
                              <Plus className="w-6 h-6 text-pink-600" />
                            </div>
                            <p className="font-medium text-gray-900 mb-1">Create New Script Draft</p>
                            <p className="text-sm text-gray-500 mb-3">Start a new ceremony script for Sarah & David</p>
                            <Button
                              className="bg-pink-500 hover:bg-pink-600"
                              onClick={handleCreateNewScript}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              New Script
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Browse Scripts */}
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-blue-900">Browse Script Marketplace</CardTitle>
                      <CardDescription>Discover and purchase scripts from other experienced officiants</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {popularScripts.map((script) => (
                          <div key={script.id} className="border border-blue-100 rounded-xl p-4 bg-white hover:bg-blue-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{script.title}</p>
                                  <p className="text-sm text-gray-600">by {script.author}</p>
                                  <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                    <span>{script.rating}</span>
                                    <span>•</span>
                                    <span>{script.sales} purchases</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">${script.price}</p>
                                <div className="flex space-x-2 mt-2">
                                  <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                    <Eye className="w-4 h-4 mr-1" />
                                    Preview
                                  </Button>
                                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                                    <ShoppingCart className="w-4 h-4 mr-1" />
                                    Buy
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <div className="space-y-6">
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-blue-900">Earnings Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">Total Earnings</p>
                              <p className="text-2xl font-bold text-green-900">$2,060</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-800">This Month</p>
                              <p className="text-2xl font-bold text-blue-900">$340</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-blue-900">Script Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-6">
                      <Button
                        className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => setShowArchivedCeremoniesDialog(true)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Archived Ceremonies
                      </Button>
                      <Button className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Plus className="w-4 h-4 mr-2" />
                        Upload New Script
                      </Button>
                      <Button className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                      <Button className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Payout History
                      </Button>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-3 text-blue-900">Popular Categories</h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">• Traditional Religious</p>
                          <p className="text-gray-600">• Modern Non-Religious</p>
                          <p className="text-gray-600">• Interfaith Ceremonies</p>
                          <p className="text-gray-600">• Outdoor/Destination</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
  )
}
