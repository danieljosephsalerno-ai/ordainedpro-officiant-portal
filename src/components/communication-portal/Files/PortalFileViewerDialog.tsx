"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Download } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalFileViewerDialog() {
  const {
    showFileViewerDialog,
    setShowFileViewerDialog,
    viewingFile,
    getFileViewerContent,
  } = useCommunicationPortal()

  return (
    <>
      {/* File Viewer Dialog */}
      <Dialog open={showFileViewerDialog} onOpenChange={setShowFileViewerDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              File Viewer
            </DialogTitle>
            <DialogDescription>
              {viewingFile ? `Viewing: ${viewingFile.name}` : 'File preview'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {viewingFile && getFileViewerContent(viewingFile)}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              {viewingFile && (
                <>
                  <span className="font-medium">Uploaded by:</span> {viewingFile.uploadedBy} •
                  <span className="font-medium ml-2">Date:</span> {viewingFile.date}
                </>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowFileViewerDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
              {viewingFile && (
                <Button
                  onClick={() => window.open(viewingFile.url || '#', '_blank')}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
