"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar as CalendarIcon, Plus, Clock } from "lucide-react"
import { Meeting } from "@/components/ScheduleMeetingDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalAddWeddingEventDialog() {
  const {
    showAddEventDialog,
    setShowAddEventDialog,
    addEventForm,
    setAddEventForm,
    formatEventDate,
    handleAddWeddingEvent,
  } = useCommunicationPortal()

  return (
    <>
      {/* Add Wedding Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-purple-900 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Add Wedding Event
            </DialogTitle>
            <DialogDescription>
              Create a new wedding event with custom details, date, time and category
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Subject Field */}
            <div className="space-y-2">
              <Label htmlFor="eventSubject" className="text-sm font-medium text-gray-700">
                Event Subject *
              </Label>
              <Input
                id="eventSubject"
                value={addEventForm.subject}
                onChange={(e) => setAddEventForm({...addEventForm, subject: e.target.value})}
                placeholder="e.g., Wedding Rehearsal, Photo Session, Reception Setup"
                className="border-purple-200 focus:border-purple-500"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate" className="text-sm font-medium text-gray-700">
                  Date *
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={addEventForm.date}
                  onChange={(e) => setAddEventForm({...addEventForm, date: e.target.value})}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventTime" className="text-sm font-medium text-gray-700">
                  Time *
                </Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={addEventForm.time}
                  onChange={(e) => setAddEventForm({...addEventForm, time: e.target.value})}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="eventCategory" className="text-sm font-medium text-gray-700">
                Category
              </Label>
              <Select value={addEventForm.category} onValueChange={(value) => setAddEventForm({...addEventForm, category: value})}>
                <SelectTrigger className="border-purple-200 focus:border-purple-500">
                  <SelectValue placeholder="Select event category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rehearsal">Rehearsal</SelectItem>
                  <SelectItem value="ceremony">Ceremony</SelectItem>
                  <SelectItem value="reception">Reception</SelectItem>
                  <SelectItem value="photo-session">Photo Session</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <Label htmlFor="eventDetails" className="text-sm font-medium text-gray-700">
                Additional Details
              </Label>
              <Textarea
                id="eventDetails"
                value={addEventForm.details}
                onChange={(e) => setAddEventForm({...addEventForm, details: e.target.value})}
                placeholder="Add any special instructions, notes, or additional information about this event..."
                className="min-h-[100px] border-purple-200 focus:border-purple-500"
              />
            </div>

            {/* Preview */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3">Event Preview</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900">{addEventForm.subject || 'Event Subject'}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1 text-purple-500" />
                    <span className="text-gray-600">
                      {addEventForm.date ? formatEventDate(addEventForm.date) : 'Date not set'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-purple-500" />
                    <span className="text-gray-600">{addEventForm.time || 'Time not set'}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="border-purple-200 text-purple-700">
                    {addEventForm.category.charAt(0).toUpperCase() + addEventForm.category.slice(1).replace('-', ' ')}
                  </Badge>
                </div>
                {addEventForm.details && (
                  <div className="mt-2">
                    <p className="text-gray-600 text-xs">{addEventForm.details}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowAddEventDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddWeddingEvent}
              className="bg-purple-500 hover:bg-purple-600"
              disabled={!addEventForm.subject || !addEventForm.date || !addEventForm.time}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
