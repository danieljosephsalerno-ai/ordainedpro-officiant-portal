"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Eye } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalScriptViewerDialog() {
  const {
    editCoupleInfo,
    showScriptViewerDialog,
    setShowScriptViewerDialog,
    viewingScript,
    handleEditScript,
  } = useCommunicationPortal()

  // Don't render if editCoupleInfo is not available
  if (!editCoupleInfo?.brideName) {
    return null
  }

  return (
    <>
      {/* Script Viewer Dialog */}
      <Dialog open={showScriptViewerDialog} onOpenChange={setShowScriptViewerDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pink-900 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Script Preview - {viewingScript?.title}
            </DialogTitle>
            <DialogDescription>
              Read-only view of the ceremony script
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {viewingScript && (
              <div className="space-y-4">
                {/* Script Info */}
                <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-pink-900">Type:</span>
                      <p className="text-pink-700">{viewingScript.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-pink-900">Status:</span>
                      <p className="text-pink-700">{viewingScript.status}</p>
                    </div>
                    <div>
                      <span className="font-medium text-pink-900">Last Modified:</span>
                      <p className="text-pink-700">{viewingScript.lastModified}</p>
                    </div>
                    <div className="md:col-span-3">
                      <span className="font-medium text-pink-900">Description:</span>
                      <p className="text-pink-700">{viewingScript.description}</p>
                    </div>
                  </div>
                </div>

                {/* Script Content */}
                <div className="bg-white p-6 border-2 border-gray-200 rounded-lg">
                  <div
                    className="prose prose-lg max-w-none"
                    style={{
                      lineHeight: '1.8',
                      fontSize: '16px',
                      fontFamily: 'Georgia, serif',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {viewingScript.content}
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">Script Statistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Word Count:</span>
                      <span className="ml-2">{viewingScript.content.split(/\s+/).filter((word: string) => word.length > 0).length}</span>
                    </div>
                    <div>
                      <span className="font-medium">Characters:</span>
                      <span className="ml-2">{viewingScript.content.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">Est. Reading Time:</span>
                      <span className="ml-2">{Math.ceil(viewingScript.content.split(/\s+/).filter((word: string) => word.length > 0).length / 150)} min</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              Script for {editCoupleInfo?.brideName || 'Partner 1'} & {editCoupleInfo?.groomName || 'Partner 2'}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowScriptViewerDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (viewingScript) {
                    setShowScriptViewerDialog(false)
                    handleEditScript(viewingScript)
                  }
                }}
                className="bg-pink-500 hover:bg-pink-600"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Script
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
