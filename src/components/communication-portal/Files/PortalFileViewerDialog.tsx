"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Download, Eye, Loader2 } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalFileViewerDialog() {
  const {
    showFileViewerDialog,
    setShowFileViewerDialog,
    viewingFile,
  } = useCommunicationPortal()

  const [textContent, setTextContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Fetch text content when viewing a text file
  useEffect(() => {
    const fetchTextContent = async () => {
      if (!viewingFile?.url || !viewingFile.url.startsWith('http')) {
        setTextContent("")
        return
      }

      const fileType = viewingFile.type?.toLowerCase() || ""
      if (fileType.includes('text/') || viewingFile.name?.endsWith('.txt')) {
        setIsLoading(true)
        try {
          const response = await fetch(viewingFile.url)
          if (response.ok) {
            const text = await response.text()
            setTextContent(text)
          } else {
            setTextContent("Unable to load file content")
          }
        } catch (err) {
          console.error("Error fetching text content:", err)
          setTextContent("Unable to load file content")
        }
        setIsLoading(false)
      }
    }

    if (showFileViewerDialog && viewingFile) {
      fetchTextContent()
    }
  }, [showFileViewerDialog, viewingFile])

  // Force download function
  const handleDownload = async () => {
    if (!viewingFile?.url || viewingFile.url === '#') {
      alert("File URL not available")
      return
    }

    try {
      // Add download parameter to Supabase URL to force download
      let downloadUrl = viewingFile.url
      if (downloadUrl.includes('supabase.co/storage')) {
        downloadUrl = downloadUrl.includes('?')
          ? `${downloadUrl}&download=true`
          : `${downloadUrl}?download=${encodeURIComponent(viewingFile.name || 'file')}`
      }

      // Create a hidden link and click it to trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = viewingFile.name || 'download'
      link.target = '_blank'
      link.rel = 'noopener noreferrer'

      // For cross-origin files, we need to fetch and create a blob
      const response = await fetch(viewingFile.url, { mode: 'cors' })
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      link.href = blobUrl
      document.body.appendChild(link)
      link.click()

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
        document.body.removeChild(link)
      }, 100)
    } catch (err) {
      console.error("Download error:", err)
      // Fallback: use Supabase download parameter
      const downloadUrl = viewingFile.url.includes('?')
        ? `${viewingFile.url}&download=${encodeURIComponent(viewingFile.name || 'file')}`
        : `${viewingFile.url}?download=${encodeURIComponent(viewingFile.name || 'file')}`
      window.location.href = downloadUrl
    }
  }

  const renderFilePreview = () => {
    if (!viewingFile) return null

    const fileType = viewingFile.type?.toLowerCase() || ""
    const fileName = viewingFile.name?.toLowerCase() || ""

    // Image preview
    if (fileType.includes('image/')) {
      return (
        <div className="flex justify-center">
          <img
            src={viewingFile.url}
            alt={viewingFile.name}
            className="max-w-full max-h-[60vh] object-contain rounded-lg border"
          />
        </div>
      )
    }

    // PDF preview
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      return (
        <div className="text-center space-y-4">
          <div className="text-6xl">📄</div>
          <p className="text-gray-600">PDF Document</p>
          <p className="font-medium">{viewingFile.name}</p>
          <p className="text-sm text-gray-500">Size: {viewingFile.size}</p>
          <Button
            onClick={() => window.open(viewingFile.url, '_blank')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Eye className="w-4 h-4 mr-2" />
            Open PDF in New Tab
          </Button>
        </div>
      )
    }

    // Text file preview
    if (fileType.includes('text/') || fileName.endsWith('.txt')) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="text-4xl">📝</div>
            <div>
              <p className="font-medium">{viewingFile.name}</p>
              <p className="text-sm text-gray-500">Size: {viewingFile.size}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-left max-h-[50vh] overflow-y-auto border">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500">Loading content...</span>
              </div>
            ) : (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {textContent || "No content available"}
              </pre>
            )}
          </div>
        </div>
      )
    }

    // Default file preview
    return (
      <div className="text-center space-y-4">
        <div className="text-6xl">📁</div>
        <p className="text-gray-600">File</p>
        <p className="font-medium">{viewingFile.name}</p>
        <p className="text-sm text-gray-500">Size: {viewingFile.size}</p>
        <p className="text-sm text-gray-400">Preview not available for this file type</p>
      </div>
    )
  }

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
            {renderFilePreview()}
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
              {viewingFile && viewingFile.url && viewingFile.url !== '#' && (
                <Button
                  onClick={handleDownload}
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
