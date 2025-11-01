"use client"

import { useState } from "react"
import { CommunicationPortal } from "@/components/CommunicationPortal"
import { ScriptEditorDialog } from "@/components/ScriptEditorDialog"

export default function Home() {
  const [showScriptEditor, setShowScriptEditor] = useState(false)
  const [scriptContent, setScriptContent] = useState<string>("")
  const [scriptFileName, setScriptFileName] = useState<string>("")
  const [scriptId, setScriptId] = useState<string>("")

  const handleScriptUploaded = (content: string, fileName: string) => {
    setScriptContent(content)
    setScriptFileName(fileName)
    setScriptId("") // New script, no ID yet
    setShowScriptEditor(true)
  }

  const handleScriptSaved = (content: string) => {
    console.log('Script saved successfully')
    // Update the script content so it persists when reopening the editor
    setScriptContent(content)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <CommunicationPortal onScriptUploaded={handleScriptUploaded} />

      <ScriptEditorDialog
        open={showScriptEditor}
        onOpenChange={setShowScriptEditor}
        initialContent={scriptContent}
        initialFileName={scriptFileName}
        scriptId={scriptId}
        ceremonyId="default-ceremony" // This should come from your ceremony context
        scriptTitle={scriptFileName}
        onSaved={handleScriptSaved}
      />
    </div>
  )
}
