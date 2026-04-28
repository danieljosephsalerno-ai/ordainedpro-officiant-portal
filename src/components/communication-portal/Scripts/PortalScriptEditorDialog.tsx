"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Save } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalScriptEditorDialog() {
  const {
    showScriptEditorDialog,
    setShowScriptEditorDialog,
    editingScript,
    scriptContent,
    setScriptContent,
    editorFontSize,
    editorRef,
    applyFormatting,
    applyTextColor,
    autoSave,
    handleSaveScript,
  } = useCommunicationPortal()

  return (
    <>
      {/* Script Editor Dialog */}
      <Dialog open={showScriptEditorDialog} onOpenChange={setShowScriptEditorDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-pink-900 flex items-center">
              <Edit className="w-5 h-5 mr-2" />
              Script Editor - {editingScript?.title}
            </DialogTitle>
            <DialogDescription>
              Edit and customize the ceremony script for Sarah & David
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col h-[80vh]">
            {/* Toolbar */}
            <div className="flex items-center space-x-2 p-4 border-b bg-gray-50 rounded-t-lg flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-bold hover:bg-blue-50"
                  onClick={() => applyFormatting('bold')}
                  title="Bold"
                >
                  <strong>B</strong>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="italic hover:bg-blue-50"
                  onClick={() => applyFormatting('italic')}
                  title="Italic"
                >
                  <em>I</em>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="underline hover:bg-blue-50"
                  onClick={() => applyFormatting('underline')}
                  title="Underline"
                >
                  <u>U</u>
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Color Palette */}
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-600 mr-1">Colors:</span>
                {['#000000', '#FF0000', '#0000FF', '#008000', '#800080', '#FFA500', '#A52A2A', '#808080'].map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-gray-300 hover:border-gray-500 transition-colors"
                    style={{ backgroundColor: color }}
                    onClick={() => applyTextColor(color)}
                    title={`Apply ${color} color`}
                  />
                ))}
              </div>

              <Separator orientation="vertical" className="h-6" />

              <select
                className="px-2 py-1 border rounded text-sm"
                onChange={(e) => {
                  document.execCommand('fontSize', false, e.target.value)
                }}
              >
                <option value="3">Normal</option>
                <option value="1">Small</option>
                <option value="4">Large</option>
                <option value="6">Extra Large</option>
              </select>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.execCommand('justifyLeft')}
                  title="Align Left"
                >
                  ⭲
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.execCommand('justifyCenter')}
                  title="Center"
                >
                  ⭿
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => document.execCommand('justifyRight')}
                  title="Align Right"
                >
                  ⭾
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormatting('insertUnorderedList')}
                  title="Bullet List"
                  className="hover:bg-blue-50"
                >
                  • List
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormatting('insertOrderedList')}
                  title="Numbered List"
                  className="hover:bg-blue-50"
                >
                  1. List
                </Button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div
                ref={editorRef}
                id="script-editor"
                contentEditable
                suppressContentEditableWarning={true}
                className="w-full h-full min-h-[600px] p-6 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none bg-white"
                style={{
                  lineHeight: '1.8',
                  fontSize: `${editorFontSize}px`,
                  fontFamily: 'Georgia, serif',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
                key={editingScript?.id}
                dangerouslySetInnerHTML={{ __html: scriptContent || '' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()


                    // Insert a line break at the current cursor position
                    const selection = window.getSelection()
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0)
                      range.deleteContents()

                      // For contentEditable, insert two <br> tags to ensure proper line breaking
                      // This works consistently whether there's existing content or not
                      const br1 = document.createElement('br')
                      const br2 = document.createElement('br')

                      // Insert the first line break
                      range.insertNode(br1)

                      // Position after first br and insert second br
                      range.setStartAfter(br1)
                      range.insertNode(br2)

                      // Position cursor after the second br for proper line spacing
                      range.setStartAfter(br2)
                      range.collapse(true)
                      selection.removeAllRanges()
                      selection.addRange(range)

                      // Ensure the editor maintains focus
                      if (editorRef.current) {
                        editorRef.current.focus()
                      }
                    }

                    // Don't update React state immediately to prevent re-render
                  }
                }}
                onInput={(e) => {
                  const target = e.target as HTMLDivElement
                  const newContent = target.innerHTML

                  console.log('OnInput - Content change:', {
                    oldLength: scriptContent?.length || 0,
                    newLength: newContent?.length || 0,
                    preview: newContent.substring(0, 50) + '...',
                    changed: newContent !== scriptContent
                  })

                  // Update state immediately but only if content has actually changed
                  if (newContent !== scriptContent) {
                    setScriptContent(newContent)
                  }
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLDivElement
                  // Preserve the exact HTML content including all formatting
                  const newContent = target.innerHTML

                  console.log('OnBlur - Final content capture:', {
                    length: newContent.length,
                    preview: newContent.substring(0, 100) + '...',
                    scriptId: editingScript?.id
                  })

                  setScriptContent(newContent)

                  // Auto-save on blur to prevent content loss
                  if (editingScript && newContent.trim()) {
                    localStorage.setItem(`script_${editingScript.id}`, newContent)
                    const timestamp = new Date().toLocaleString()
                    localStorage.setItem(`script_${editingScript.id}_autosave_time`, timestamp)
                    console.log('Auto-saved to localStorage:', newContent.length, 'characters')
                  }
                }}
              />
              {scriptContent === '' && (
                <div className="absolute top-4 left-4 text-gray-400 pointer-events-none p-6" style={{ fontSize: `${editorFontSize}px`, fontFamily: 'Georgia, serif' }}>
                  Start writing your ceremony script here...
                  <br /><br />
                  Use the formatting tools above:
                  <br />• <strong>Bold</strong>, <em>Italic</em>, and <u>Underline</u> text
                  <br />• Color text with the color palette
                  <br />• Create bullet and numbered lists
                  <br />• Adjust font size with A+/A- buttons
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="px-4 py-2 bg-gray-50 border-t text-sm text-gray-600 flex justify-between items-center">
              <div>
                Words: {scriptContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length} |
                <span className={`
                  ${(() => {
                    const charCount = scriptContent.replace(/<[^>]*>/g, '').length;
                    if (charCount < 50) return 'text-red-600 font-medium';
                    if (charCount > 6500) return 'text-orange-600 font-medium';
                    if (charCount > 7000) return 'text-red-600 font-medium';
                    return 'text-gray-600';
                  })()}
                `}>
                  Characters: {scriptContent.replace(/<[^>]*>/g, '').length}/7,000
                </span> |
                Lines: {scriptContent.split(/<br\s*\/?>/gi).length}
              </div>
              <div className="flex items-center space-x-1">
                <span>Font Size: {editorFontSize}px</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={autoSave}
                  className="text-xs"
                >
                  Auto-save
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              <div>
                <span className="font-medium">Last saved:</span> {editingScript?.lastModified || 'Never'}
              </div>
              <div className={`text-xs mt-1 ${(() => {
                const charCount = scriptContent.replace(/<[^>]*>/g, '').length;
                if (charCount < 50) return 'text-red-600';
                if (charCount > 7000) return 'text-red-600';
                return 'text-gray-400';
              })()}`}>
                {(() => {
                  const charCount = scriptContent.replace(/<[^>]*>/g, '').length;
                  if (charCount < 50) return `Need ${50 - charCount} more characters to save`;
                  if (charCount > 7000) return `${charCount - 7000} characters over limit`;
                  return 'Requirements: 50-7,000 characters';
                })()}
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowScriptEditorDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveScript}
                className="bg-pink-500 hover:bg-pink-600"
                disabled={(() => {
                  const charCount = scriptContent.replace(/<[^>]*>/g, '').length;
                  return charCount < 50 || charCount > 7000;
                })()}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Script
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
