"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Download } from "lucide-react"
import { Contract } from "@/components/ContractUploadDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalContractViewerDialog() {
  const {
    showContractViewerDialog,
    setShowContractViewerDialog,
    viewingContract,
    getContractViewerContent,
  } = useCommunicationPortal()

  return (
    <>
      {/* Contract Viewer Dialog */}
      <Dialog open={showContractViewerDialog} onOpenChange={setShowContractViewerDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Contract Viewer
            </DialogTitle>
            <DialogDescription>
              {viewingContract ? `Viewing: ${viewingContract.name}` : 'Contract preview'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {viewingContract && getContractViewerContent(viewingContract)}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              {viewingContract && (
                <div className="flex items-center space-x-4">
                  <span>
                    <span className="font-medium">Status:</span>
                    <Badge className={`ml-1 ${
                      viewingContract.status === 'signed' ? 'bg-green-100 text-green-800' :
                      viewingContract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingContract.status.charAt(0).toUpperCase() + viewingContract.status.slice(1)}
                    </Badge>
                  </span>
                  <span>
                    <span className="font-medium">Type:</span> {viewingContract.type.replace('_', ' ')}
                  </span>
                  <span>
                    <span className="font-medium">Created:</span> {viewingContract.createdDate}
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowContractViewerDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
              {viewingContract && viewingContract.file && (
                <Button
                  onClick={() => window.open(viewingContract.file.url || '#', '_blank')}
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
