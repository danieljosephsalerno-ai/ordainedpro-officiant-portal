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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Edit,
  Trash2,
  FileText,
  Bell,
  Heart,
  ArrowLeft,
  Users,
  RefreshCw,
} from "lucide-react";
import { ScheduleMeetingDialog, Meeting } from "@/components/ScheduleMeetingDialog";
import Link from "next/link";

interface Couple {
  id: number;
  bride_name: string;
  groom_name: string;
}

export function CalendarSection() {
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showScheduleMeetingDialog, setShowScheduleMeetingDialog] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showEditMeetingDialog, setShowEditMeetingDialog] = useState(false);
  const [editMeetingForm, setEditMeetingForm] = useState({
    id: 0,
    subject: "",
    date: "",
    time: "",
    duration: 60,
    meetingType: "in-person",
    location: "",
    body: "",
  });
  const [addEventForm, setAddEventForm] = useState({
    subject: "",
    date: "",
    time: "",
    category: "rehearsal",
    details: "",
  });
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Couple selection state - CRITICAL FOR DATA ISOLATION
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState<number | null>(null);
  const [selectedCouple, setSelectedCouple] = useState<Couple | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "couple">("all"); // Toggle between all meetings or couple-specific

  // Fetch user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch couples and meetings when user changes
  useEffect(() => {
    if (user) {
      fetchCouples();
      fetchMeetings();
    }
  }, [user]);

  // Fetch wedding events when couple selection changes
  useEffect(() => {
    if (user) {
      fetchWeddingEvents();
      // Update selected couple object
      const couple = couples.find(c => c.id === selectedCoupleId);
      setSelectedCouple(couple || null);
    }
  }, [selectedCoupleId, couples, user]);

  // Real-time meetings subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("realtime-meetings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meetings",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchMeetings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Real-time wedding events subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("realtime-wedding-events")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wedding_events",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchWeddingEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedCoupleId]);

  const fetchCouples = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("couples")
        .select("id, bride_name, groom_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCouples(data);
      }
    } catch (err) {
      console.error("Error fetching couples:", err);
    }
  };

  const fetchMeetings = async () => {
    if (!user) return;

    setLoadingMeetings(true);
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching meetings:", error);
        setMeetings([]);
        return;
      }

      if (!data || data.length === 0) {
        setMeetings([]);
        return;
      }

      const formatted = data.map((m: any) => ({
        id: m.id,
        couple_id: m.couple_id,
        subject: m.title,
        title: m.title,
        date: m.date,
        time: m.time,
        location: m.location || "TBD",
        body: m.notes || "",
        notes: m.notes || "",
        meetingType: m.location ? "in-person" : "video",
        duration: m.duration || 60,
        status: new Date(m.date) < new Date() ? "completed" : "pending",
        responseDeadline: new Date(m.date).toISOString(),
        attendees: [],
      })) as Meeting[];

      setMeetings(formatted);
    } catch (err) {
      console.error("Unexpected error fetching meetings:", err);
    } finally {
      setLoadingMeetings(false);
    }
  };

  // Fetch wedding events - filtered by couple_id when selected
  const fetchWeddingEvents = async () => {
    if (!user) return;

    setLoadingEvents(true);
    try {
      let query = supabase
        .from("wedding_events")
        .select("*")
        .eq("user_id", user.id);

      // ⚠️ CRITICAL: Filter by couple_id when a couple is selected
      if (selectedCoupleId) {
        query = query.eq("couple_id", selectedCoupleId);
      }

      const { data, error } = await query.order("date", { ascending: true });

      if (error) {
        console.error("Error fetching wedding events:", error);
        setUpcomingEvents([]);
        return;
      }

      setUpcomingEvents(data || []);
    } catch (err) {
      console.error("Unexpected error fetching events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    if (!meetingId) return;

    const confirmDelete = confirm("Are you sure you want to delete this meeting?");
    if (!confirmDelete) return;

    const previousMeetings = meetings;
    setMeetings((prev) => prev.filter((meeting) => meeting.id !== meetingId));

    try {
      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", meetingId);

      if (error) {
        console.error("Error deleting meeting:", error);
        alert("Failed to delete meeting. Please try again.");
        setMeetings(previousMeetings);
        return;
      }
    } catch (err) {
      console.error("Unexpected error deleting meeting:", err);
      alert("Unexpected error occurred. Please try again.");
      setMeetings(previousMeetings);
    }
  };

  const handleEditMeeting = (meeting: any) => {
    setEditMeetingForm({
      id: meeting.id,
      subject: meeting.subject,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      meetingType: meeting.meetingType,
      location: meeting.location,
      body: meeting.body || "",
    });
    setShowEditMeetingDialog(true);
  };

  const handleUpdateMeeting = async () => {
    if (!editMeetingForm.id) return;

    try {
      setMeetings((prev) =>
        prev.map((meeting) =>
          meeting.id === editMeetingForm.id
            ? {
                ...meeting,
                title: editMeetingForm.subject,
                subject: editMeetingForm.subject,
                date: editMeetingForm.date,
                time: editMeetingForm.time,
                duration: editMeetingForm.duration,
                meetingType: editMeetingForm.meetingType as "in-person" | "video" | "phone",
                location: editMeetingForm.location,
                notes: editMeetingForm.body,
              }
            : meeting
        )
      );

      const { error } = await supabase
        .from("meetings")
        .update({
          title: editMeetingForm.subject,
          date: editMeetingForm.date,
          time: editMeetingForm.time,
          location: editMeetingForm.location,
          notes: editMeetingForm.body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editMeetingForm.id);

      if (error) {
        console.error("Error updating meeting:", error);
        alert("Failed to update meeting. Please try again.");
        return;
      }

      setShowEditMeetingDialog(false);
      setEditMeetingForm({
        id: 0,
        subject: "",
        date: "",
        time: "",
        duration: 60,
        meetingType: "in-person",
        location: "",
        body: "",
      });

      fetchMeetings();
    } catch (err) {
      console.error("Unexpected error updating meeting:", err);
      alert("Unexpected error occurred. Please try again.");
    }
  };

  const handleAddWeddingEvent = async () => {
    if (!addEventForm.subject || !addEventForm.date || !addEventForm.time) {
      alert("Please fill in all required fields (Subject, Date, and Time).");
      return;
    }

    try {
      if (!user) {
        alert("You must be signed in to add an event.");
        return;
      }

      const newEvent = {
        user_id: user.id,
        couple_id: selectedCoupleId || null,
        subject: addEventForm.subject,
        date: addEventForm.date,
        time: addEventForm.time,
        category: addEventForm.category || "other",
        details: addEventForm.details,
      };

      const { data, error } = await supabase
        .from("wedding_events")
        .insert([newEvent])
        .select("*")
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        alert("Failed to save event. Please check Supabase table permissions.");
        return;
      }

      const savedEvent = {
        ...data,
        location: "Venue TBD",
        title: addEventForm.subject,
        type: addEventForm.category,
      };

      setUpcomingEvents([...upcomingEvents, savedEvent]);

      setAddEventForm({
        subject: "",
        date: "",
        time: "",
        category: "rehearsal",
        details: "",
      });
      setShowAddEventDialog(false);

      alert("Wedding event added successfully!");
    } catch (err) {
      console.error("Unexpected error while adding event:", err);
      alert("Something went wrong while adding the event.");
    }
  };

  const handleDeleteWeddingEvent = async (eventId: number) => {
    if (!eventId) return;

    const confirmDelete = confirm("Are you sure you want to delete this wedding event?");
    if (!confirmDelete) return;

    const previousEvents = upcomingEvents;
    setUpcomingEvents((prev) => prev.filter((event) => event.id !== eventId));

    try {
      const { error } = await supabase
        .from("wedding_events")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error("Error deleting wedding event:", error);
        alert("Failed to delete event. Please try again.");
        setUpcomingEvents(previousEvents);
        return;
      }
    } catch (err) {
      console.error("Unexpected error deleting event:", err);
      alert("Unexpected error occurred while deleting the event.");
      setUpcomingEvents(previousEvents);
    }
  };

  const handleScheduleMeeting = async (
    meetingData: Omit<Meeting, "id" | "createdDate" | "status" | "reminderSent" | "calendarInviteSent">
  ) => {
    try {
      if (!user) {
        alert("You must be signed in to schedule a meeting.");
        return;
      }

      const { data, error } = await supabase
        .from("meetings")
        .insert([{
          user_id: user.id,
          title: meetingData.subject,
          date: meetingData.date,
          time: meetingData.time,
          location: meetingData.location,
          notes: meetingData.body,
          duration: meetingData.duration || 60,
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating meeting:", error);
        alert("Failed to create meeting.");
        return;
      }

      fetchMeetings();
      setShowScheduleMeetingDialog(false);
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "declined":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMeetingStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
      case "accepted":
        return "✅";
      case "pending":
        return "⏳";
      case "declined":
        return "❌";
      default:
        return "📅";
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "💻";
      case "phone":
        return "📞";
      case "in-person":
        return "👥";
      default:
        return "📅";
    }
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
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendar & Events</h1>
                <p className="text-blue-600 font-medium">Schedule meetings and manage wedding events</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Couple Filter for Wedding Events - DATA ISOLATION */}
        <Card className="border-purple-200 shadow-md mb-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-purple-900">Filter Wedding Events by Couple</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchCouples();
                  fetchWeddingEvents();
                }}
                className="text-purple-600 border-purple-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <CardDescription>
              Select a couple to view their specific wedding events, or view all events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCoupleId?.toString() || "all"}
              onValueChange={(value) => setSelectedCoupleId(value === "all" ? null : parseInt(value))}
            >
              <SelectTrigger className="w-full md:w-96 border-purple-200">
                <SelectValue placeholder="Select a couple or view all..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Couples (View All Events)</SelectItem>
                {couples.map((couple) => (
                  <SelectItem key={couple.id} value={couple.id.toString()}>
                    {couple.bride_name} & {couple.groom_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCouple && (
              <div className="mt-3 text-sm text-purple-700">
                <span className="font-medium">Viewing events for:</span>{" "}
                {selectedCouple.bride_name} & {selectedCouple.groom_name}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scheduled Meetings */}
          <Card className="border-blue-100 shadow-md flex flex-col min-h-[450px]">
            <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50">
              <CardTitle className="text-blue-900">Scheduled Meetings</CardTitle>
              <CardDescription>Meetings with calendar invite status tracking</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col flex-1">
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                {loadingMeetings ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>Loading meetings...</p>
                  </div>
                ) : meetings.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No meetings scheduled yet</p>
                  </div>
                ) : (
                  meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="border border-blue-100 rounded-xl p-4 bg-gradient-to-r from-sky-50 to-blue-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">
                          {meeting.subject}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={getMeetingStatusColor(meeting.status)}>
                            {getMeetingStatusIcon(meeting.status)}{" "}
                            {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {new Date(meeting.date).toLocaleDateString()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMeeting(meeting)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-blue-500" />
                          {meeting.time} ({meeting.duration} minutes)
                        </div>
                        <div className="flex items-center">
                          <span className="text-lg mr-1">{getMeetingTypeIcon(meeting.meetingType)}</span>
                          {meeting.meetingType === "in-person"
                            ? meeting.location
                            : meeting.meetingType.charAt(0).toUpperCase() + meeting.meetingType.slice(1)}
                        </div>
                        {meeting.status === "pending" && (
                          <div className="flex items-center text-orange-600">
                            <Bell className="w-4 h-4 mr-2" />
                            Response due: {new Date(meeting.responseDeadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {meeting.body && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {meeting.body}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-auto pt-6">
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  onClick={() => setShowScheduleMeetingDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule New Meeting
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wedding Events - Filtered by Selected Couple */}
          <Card className="border-blue-100 shadow-md flex flex-col min-h-[450px]">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-purple-900">
                Wedding Events
                {selectedCouple && (
                  <span className="text-sm font-normal text-purple-600 ml-2">
                    ({selectedCouple.bride_name} & {selectedCouple.groom_name})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {selectedCouple
                  ? `Showing events for ${selectedCouple.bride_name} & ${selectedCouple.groom_name}`
                  : "Showing all wedding events - select a couple above to filter"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col flex-1">
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                {loadingEvents ? (
                  <div className="text-center py-6 text-gray-500">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                    <p>Loading events...</p>
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No wedding events scheduled yet</p>
                    {selectedCouple && (
                      <p className="text-xs mt-1">for {selectedCouple.bride_name} & {selectedCouple.groom_name}</p>
                    )}
                  </div>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border border-purple-100 rounded-xl p-4 bg-gradient-to-r from-purple-50 to-pink-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{event.subject}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="border-purple-200 text-purple-700">
                            {new Date(event.date).toLocaleDateString()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWeddingEvent(event.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-purple-500" />
                          {event.time}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-purple-500" />
                          {event.location || "No location"}
                        </div>
                      </div>
                      {event.details && (
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <p className="font-medium text-purple-900 mb-2 flex items-center">
                            <FileText className="w-4 h-4 mr-1" /> Additional Details:
                          </p>
                          <p className="text-gray-700 bg-white/50 p-3 rounded border border-purple-100 leading-relaxed">
                            {event.details}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-auto pt-6">
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600"
                  onClick={() => setShowAddEventDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Wedding Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Schedule Meeting Dialog */}
      <ScheduleMeetingDialog
        isOpen={showScheduleMeetingDialog}
        onOpenChange={setShowScheduleMeetingDialog}
        onScheduleMeeting={handleScheduleMeeting}
      />

      {/* Edit Meeting Dialog */}
      <Dialog open={showEditMeetingDialog} onOpenChange={setShowEditMeetingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>Update the meeting details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-subject">Subject</Label>
              <Input
                id="edit-subject"
                value={editMeetingForm.subject}
                onChange={(e) => setEditMeetingForm({ ...editMeetingForm, subject: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editMeetingForm.date}
                  onChange={(e) => setEditMeetingForm({ ...editMeetingForm, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editMeetingForm.time}
                  onChange={(e) => setEditMeetingForm({ ...editMeetingForm, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editMeetingForm.location}
                onChange={(e) => setEditMeetingForm({ ...editMeetingForm, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editMeetingForm.body}
                onChange={(e) => setEditMeetingForm({ ...editMeetingForm, body: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditMeetingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMeeting} className="bg-blue-500 hover:bg-blue-600">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Wedding Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Wedding Event</DialogTitle>
            <DialogDescription>Add a new wedding-related event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="event-subject">Event Name</Label>
              <Input
                id="event-subject"
                value={addEventForm.subject}
                onChange={(e) => setAddEventForm({ ...addEventForm, subject: e.target.value })}
                placeholder="e.g., Wedding Rehearsal"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={addEventForm.date}
                  onChange={(e) => setAddEventForm({ ...addEventForm, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="event-time">Time</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={addEventForm.time}
                  onChange={(e) => setAddEventForm({ ...addEventForm, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="event-category">Category</Label>
              <Select
                value={addEventForm.category}
                onValueChange={(value) => setAddEventForm({ ...addEventForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rehearsal">Rehearsal</SelectItem>
                  <SelectItem value="ceremony">Ceremony</SelectItem>
                  <SelectItem value="preparation">Preparation</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="event-details">Details</Label>
              <Textarea
                id="event-details"
                value={addEventForm.details}
                onChange={(e) => setAddEventForm({ ...addEventForm, details: e.target.value })}
                rows={3}
                placeholder="Additional details about the event..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAddEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWeddingEvent} className="bg-purple-500 hover:bg-purple-600">
              Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
