"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  ArrowLeft,
  Users,
  FileText,
  Heart,
  BookOpen,
  Camera,
  User,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Crown,
  Sparkles,
  CircleDot,
  Music,
  Video,
  UserCheck,
  Baby,
  Award
} from "lucide-react"

export function CeremonyDetailsForm({ onBack }: { onBack?: () => void }) {

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      // Close the tab/window when opened in a new tab
      window.close()
      // If window.close() doesn't work (some browsers block it), navigate to home
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    }
  }
  // Track last saved time
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // Form state for all sections
  const [formData, setFormData] = useState({
    // Couple & Ceremony Information
    brideName: "",
    groomName: "",
    dateEntered: new Date().toISOString().split('T')[0],
    ceremonyDate: "",
    ceremonyTime: "",
    location: "",
    phone: "",
    email: "",
    instagram: "",
    attendees: "",
    livestream: false,
    outOfTownGuests: "",
    couldNotAttend: "",
    mentionOfPassing: "",
    takingLastName: "",
    firstMarriage: "",
    attendingChildren: "",
    blendedFamily: false,

    // Legal & Formal Details
    licenses: false,
    selfProvidedWitnesses: false,

    // Ceremony Structure & Style
    tone: "",
    religiousCeremony: "",
    customsTraditions: "",
    officiantIntroPreferences: "",
    givenAway: "",
    turnOutTogether: false,
    unpluggedCeremony: false,
    selfiMoment: false,
    ceremonyFirstTouch: false,
    loveStory: "",
    insideJokes: "",
    communityVowsCeremony: false,

    // Vows & Readings
    personalVows: "",
    traditionalModernVows: "",
    repeatingVow: "",
    communityVows: "",
    readings: "",
    lettersPoems: "",
    giftGiving: false,

    // Unity Ceremony & Symbols
    unityService: "",
    rings: "",

    // Wedding Party & Roles
    weddingParty: "",
    bestPerson: "",
    maidOfHonor: "",
    flowerGirl: "",
    ringBearer: "",

    // Vendors & Support Team
    photographerName: "",
    photographerContact: "",
    photographerSocial: "",
    videoName: "",
    videoContact: "",
    videoSocial: "",
    djName: "",
    djContact: "",
    djSocial: "",
    docName: "",
    docContact: "",
    docSocial: "",

    // Officiant Details
    officiantName: "",
    officiantColors: "",
    invitedToReception: false,

    // Payments & Notes
    serviceTotal: "",
    deposit: "",
    accommodations: "",
    notes: ""
  })

  // Load saved ceremony details from localStorage on component mount
  useEffect(() => {
    try {
      const savedDetails = localStorage.getItem('ceremonyDetails')
      if (savedDetails) {
        const parsedDetails = JSON.parse(savedDetails)
        // Remove metadata fields before setting form data
        const { lastUpdated, savedAt, ...cleanFormData } = parsedDetails
        setFormData(prevData => ({
          ...prevData,
          ...cleanFormData
        }))
        setLastSaved(savedAt || null)
        console.log("Loaded saved ceremony details from localStorage")
      }
    } catch (error) {
      console.error("Error loading ceremony details:", error)
    }
  }, [])

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    try {
      // Save the ceremony details to localStorage
      const savedDetails = localStorage.getItem('ceremonyDetails')
      let detailsData = savedDetails ? JSON.parse(savedDetails) : {}

      const savedTime = new Date().toLocaleString()

      // Store the form data with a timestamp
      detailsData = {
        ...formData,
        lastUpdated: new Date().toISOString(),
        savedAt: savedTime
      }

      localStorage.setItem('ceremonyDetails', JSON.stringify(detailsData))
      setLastSaved(savedTime)

      console.log("Ceremony details saved successfully:", detailsData)
      alert("✅ Ceremony details saved successfully!\n\nYour information has been securely stored and will be available when you return to the portal.")
    } catch (error) {
      console.error("Error saving ceremony details:", error)
      alert("⚠️ There was an error saving your ceremony details. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleBack} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portal
              </Button>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ceremony Details Form</h1>
                <p className="text-blue-600 font-medium">Comprehensive Wedding Planning Information</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  Entry Date: {formData.dateEntered}
                </Badge>
                {lastSaved && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ✓ Last saved: {lastSaved}
                  </p>
                )}
              </div>
              <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">
                <Save className="w-4 h-4 mr-2" />
                Save Details
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Section 1: Couple & Ceremony Information */}
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Couple & Ceremony Information
              </CardTitle>
              <CardDescription>Basic details about the couple and their ceremony</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brideName">Bride Name</Label>
                  <Input
                    id="brideName"
                    value={formData.brideName}
                    onChange={(e) => handleInputChange('brideName', e.target.value)}
                    placeholder="Enter bride's full name"
                  />
                </div>
                <div>
                  <Label htmlFor="groomName">Groom Name</Label>
                  <Input
                    id="groomName"
                    value={formData.groomName}
                    onChange={(e) => handleInputChange('groomName', e.target.value)}
                    placeholder="Enter groom's full name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ceremonyDate">Ceremony Date</Label>
                  <Input
                    id="ceremonyDate"
                    type="date"
                    value={formData.ceremonyDate}
                    onChange={(e) => handleInputChange('ceremonyDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ceremonyTime">Time</Label>
                  <Input
                    id="ceremonyTime"
                    type="time"
                    value={formData.ceremonyTime}
                    onChange={(e) => handleInputChange('ceremonyTime', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Venue name and address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Contact phone"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Contact email"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    placeholder="@username"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="attendees">Attendees</Label>
                  <Input
                    id="attendees"
                    type="number"
                    value={formData.attendees}
                    onChange={(e) => handleInputChange('attendees', e.target.value)}
                    placeholder="Number of guests"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="livestream"
                    checked={formData.livestream}
                    onCheckedChange={(checked: boolean) => handleInputChange('livestream', checked)}
                  />
                  <Label htmlFor="livestream">Livestream</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="outOfTownGuests">Out of Town Guests</Label>
                  <Input
                    id="outOfTownGuests"
                    value={formData.outOfTownGuests}
                    onChange={(e) => handleInputChange('outOfTownGuests', e.target.value)}
                    placeholder="Number or details"
                  />
                </div>
                <div>
                  <Label htmlFor="couldNotAttend">Could Not Attend</Label>
                  <Input
                    id="couldNotAttend"
                    value={formData.couldNotAttend}
                    onChange={(e) => handleInputChange('couldNotAttend', e.target.value)}
                    placeholder="Names or details"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mentionOfPassing">Mention of Passing</Label>
                <Textarea
                  id="mentionOfPassing"
                  value={formData.mentionOfPassing}
                  onChange={(e) => handleInputChange('mentionOfPassing', e.target.value)}
                  placeholder="Details about deceased family/friends to mention"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="takingLastName">Taking Last Name</Label>
                  <Select value={formData.takingLastName} onValueChange={(value: string) => handleInputChange('takingLastName', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bride-taking-groom">Bride taking Groom's name</SelectItem>
                      <SelectItem value="groom-taking-bride">Groom taking Bride's name</SelectItem>
                      <SelectItem value="hyphenated">Hyphenated names</SelectItem>
                      <SelectItem value="keeping-own">Keeping own names</SelectItem>
                      <SelectItem value="new-name">Creating new name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="firstMarriage">First Marriage</Label>
                  <Select value={formData.firstMarriage} onValueChange={(value: string) => handleInputChange('firstMarriage', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both-first">Both first marriage</SelectItem>
                      <SelectItem value="bride-first">Bride's first marriage</SelectItem>
                      <SelectItem value="groom-first">Groom's first marriage</SelectItem>
                      <SelectItem value="both-remarrying">Both remarrying</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="attendingChildren">Attending Children</Label>
                  <Textarea
                    id="attendingChildren"
                    value={formData.attendingChildren}
                    onChange={(e) => handleInputChange('attendingChildren', e.target.value)}
                    placeholder="Names and ages of children attending"
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="blendedFamily"
                    checked={formData.blendedFamily}
                    onCheckedChange={(checked: boolean) => handleInputChange('blendedFamily', checked)}
                  />
                  <Label htmlFor="blendedFamily">Blended Family</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Legal & Formal Details */}
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-900 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Legal & Formal Details
              </CardTitle>
              <CardDescription>Required legal documentation and formalities</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="licenses"
                    checked={formData.licenses}
                    onCheckedChange={(checked: boolean) => handleInputChange('licenses', checked)}
                  />
                  <Label htmlFor="licenses">Marriage License Obtained</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selfProvidedWitnesses"
                    checked={formData.selfProvidedWitnesses}
                    onCheckedChange={(checked: boolean) => handleInputChange('selfProvidedWitnesses', checked)}
                  />
                  <Label htmlFor="selfProvidedWitnesses">Self-Provided Witnesses</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Ceremony Structure & Style */}
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Ceremony Structure & Style
              </CardTitle>
              <CardDescription>Preferences for ceremony tone, structure, and special elements</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={formData.tone} onValueChange={(value: string) => handleInputChange('tone', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ceremony tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="romantic">Romantic</SelectItem>
                      <SelectItem value="fun">Fun & Lighthearted</SelectItem>
                      <SelectItem value="spiritual">Spiritual</SelectItem>
                      <SelectItem value="traditional">Traditional</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="religiousCeremony">Religious Ceremony</Label>
                  <Select value={formData.religiousCeremony} onValueChange={(value: string) => handleInputChange('religiousCeremony', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select religious preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="christian">Christian</SelectItem>
                      <SelectItem value="catholic">Catholic</SelectItem>
                      <SelectItem value="jewish">Jewish</SelectItem>
                      <SelectItem value="muslim">Muslim</SelectItem>
                      <SelectItem value="hindu">Hindu</SelectItem>
                      <SelectItem value="interfaith">Interfaith</SelectItem>
                      <SelectItem value="spiritual">Spiritual (Non-Religious)</SelectItem>
                      <SelectItem value="secular">Secular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="customsTraditions">Customs/Traditions to Include</Label>
                <Textarea
                  id="customsTraditions"
                  value={formData.customsTraditions}
                  onChange={(e) => handleInputChange('customsTraditions', e.target.value)}
                  placeholder="Describe any cultural or family traditions to incorporate"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="officiantIntroPreferences">Officiant Introduction Preferences</Label>
                <Textarea
                  id="officiantIntroPreferences"
                  value={formData.officiantIntroPreferences}
                  onChange={(e) => handleInputChange('officiantIntroPreferences', e.target.value)}
                  placeholder="How would you like to be introduced? Any specific credentials or background to mention?"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="givenAway">Given Away</Label>
                <Input
                  id="givenAway"
                  value={formData.givenAway}
                  onChange={(e) => handleInputChange('givenAway', e.target.value)}
                  placeholder="Who is giving the bride away? (e.g., father, both parents, walking alone)"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="turnOutTogether"
                    checked={formData.turnOutTogether}
                    onCheckedChange={(checked: boolean) => handleInputChange('turnOutTogether', checked)}
                  />
                  <Label htmlFor="turnOutTogether" className="text-sm">Turn Out Together</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unpluggedCeremony"
                    checked={formData.unpluggedCeremony}
                    onCheckedChange={(checked: boolean) => handleInputChange('unpluggedCeremony', checked)}
                  />
                  <Label htmlFor="unpluggedCeremony" className="text-sm">Unplugged Ceremony</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selfiMoment"
                    checked={formData.selfiMoment}
                    onCheckedChange={(checked: boolean) => handleInputChange('selfiMoment', checked)}
                  />
                  <Label htmlFor="selfiMoment" className="text-sm">Selfie Moment</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ceremonyFirstTouch"
                    checked={formData.ceremonyFirstTouch}
                    onCheckedChange={(checked: boolean) => handleInputChange('ceremonyFirstTouch', checked)}
                  />
                  <Label htmlFor="ceremonyFirstTouch" className="text-sm">Ceremony First Touch</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="loveStory">Love Story</Label>
                <Textarea
                  id="loveStory"
                  value={formData.loveStory}
                  onChange={(e) => handleInputChange('loveStory', e.target.value)}
                  placeholder="Tell their love story - how they met, proposal story, what makes them special together"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="insideJokes">Inside Jokes or Shared Interests</Label>
                <Textarea
                  id="insideJokes"
                  value={formData.insideJokes}
                  onChange={(e) => handleInputChange('insideJokes', e.target.value)}
                  placeholder="Special moments, shared hobbies, funny stories, or inside jokes to potentially reference"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="communityVowsCeremony"
                  checked={formData.communityVowsCeremony}
                  onCheckedChange={(checked: boolean) => handleInputChange('communityVowsCeremony', checked)}
                />
                <Label htmlFor="communityVowsCeremony">Community Vows (Guests participate in supporting the marriage)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Vows & Readings */}
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-900 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Vows & Readings
              </CardTitle>
              <CardDescription>Vow preferences and ceremony readings</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="personalVows">Personal Vows</Label>
                <Select value={formData.personalVows} onValueChange={(value: string) => handleInputChange('personalVows', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vow type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="writing-own">Writing their own</SelectItem>
                    <SelectItem value="officiant-provided">Officiant provided</SelectItem>
                    <SelectItem value="hybrid">Hybrid approach</SelectItem>
                    <SelectItem value="no-personal">No personal vows</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="traditionalModernVows">Traditional/Modern Vows</Label>
                <Select value={formData.traditionalModernVows} onValueChange={(value: string) => handleInputChange('traditionalModernVows', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vow style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traditional">Traditional</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="repeatingVow">Repeating Vow</Label>
                <Input
                  id="repeatingVow"
                  value={formData.repeatingVow}
                  onChange={(e) => handleInputChange('repeatingVow', e.target.value)}
                  placeholder="Line by line or all at once?"
                />
              </div>

              <div>
                <Label htmlFor="communityVows">Community Vows</Label>
                <Textarea
                  id="communityVows"
                  value={formData.communityVows}
                  onChange={(e) => handleInputChange('communityVows', e.target.value)}
                  placeholder="Details about community participation in vows"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="readings">Readings</Label>
                <Textarea
                  id="readings"
                  value={formData.readings}
                  onChange={(e) => handleInputChange('readings', e.target.value)}
                  placeholder="Specific readings, poems, or passages they want included"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="lettersPoems">Letters/Poems</Label>
                <Textarea
                  id="lettersPoems"
                  value={formData.lettersPoems}
                  onChange={(e) => handleInputChange('lettersPoems', e.target.value)}
                  placeholder="Any special letters or poems to be read during ceremony"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="giftGiving"
                  checked={formData.giftGiving}
                  onCheckedChange={(checked: boolean) => handleInputChange('giftGiving', checked)}
                />
                <Label htmlFor="giftGiving">Gift Giving (exchange of gifts during ceremony)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Unity Ceremony & Symbols */}
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-900 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Unity Ceremony & Symbols
              </CardTitle>
              <CardDescription>Special ceremonies and symbolic elements</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="unityService">Unity Service</Label>
                <Select value={formData.unityService} onValueChange={(value: string) => handleInputChange('unityService', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unity ceremony type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="candle">Unity Candle</SelectItem>
                    <SelectItem value="sand">Sand Ceremony</SelectItem>
                    <SelectItem value="handfasting">Handfasting</SelectItem>
                    <SelectItem value="wine">Wine Ceremony</SelectItem>
                    <SelectItem value="tree-planting">Tree Planting</SelectItem>
                    <SelectItem value="stone">Stone Ceremony</SelectItem>
                    <SelectItem value="rope">Rope Ceremony</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rings">Rings</Label>
                <Textarea
                  id="rings"
                  value={formData.rings}
                  onChange={(e) => handleInputChange('rings', e.target.value)}
                  placeholder="Details about ring exchange, special meaning, or family rings"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Wedding Party & Roles */}
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-900 flex items-center">
                <Crown className="w-5 h-5 mr-2" />
                Wedding Party & Roles
              </CardTitle>
              <CardDescription>Key people in the wedding party</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="weddingParty">Wedding Party</Label>
                <Textarea
                  id="weddingParty"
                  value={formData.weddingParty}
                  onChange={(e) => handleInputChange('weddingParty', e.target.value)}
                  placeholder="List all bridesmaids, groomsmen, and their relationships"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bestPerson">Best Person</Label>
                  <Input
                    id="bestPerson"
                    value={formData.bestPerson}
                    onChange={(e) => handleInputChange('bestPerson', e.target.value)}
                    placeholder="Best man/person name and relationship"
                  />
                </div>
                <div>
                  <Label htmlFor="maidOfHonor">Maid of Honor</Label>
                  <Input
                    id="maidOfHonor"
                    value={formData.maidOfHonor}
                    onChange={(e) => handleInputChange('maidOfHonor', e.target.value)}
                    placeholder="Maid of honor name and relationship"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="flowerGirl">Flower Girl</Label>
                  <Input
                    id="flowerGirl"
                    value={formData.flowerGirl}
                    onChange={(e) => handleInputChange('flowerGirl', e.target.value)}
                    placeholder="Flower girl name and age"
                  />
                </div>
                <div>
                  <Label htmlFor="ringBearer">Ring Bearer</Label>
                  <Input
                    id="ringBearer"
                    value={formData.ringBearer}
                    onChange={(e) => handleInputChange('ringBearer', e.target.value)}
                    placeholder="Ring bearer name and age"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Vendors & Support Team */}
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-900 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Vendors & Support Team
              </CardTitle>
              <CardDescription>Contact information for key wedding vendors</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Photographer */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  Photographer
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={formData.photographerName}
                    onChange={(e) => handleInputChange('photographerName', e.target.value)}
                    placeholder="Photographer name"
                  />
                  <Input
                    value={formData.photographerContact}
                    onChange={(e) => handleInputChange('photographerContact', e.target.value)}
                    placeholder="Phone/Email"
                  />
                  <Input
                    value={formData.photographerSocial}
                    onChange={(e) => handleInputChange('photographerSocial', e.target.value)}
                    placeholder="Social media"
                  />
                </div>
              </div>

              {/* Video */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                  <Video className="w-4 h-4 mr-2" />
                  Videographer
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={formData.videoName}
                    onChange={(e) => handleInputChange('videoName', e.target.value)}
                    placeholder="Videographer name"
                  />
                  <Input
                    value={formData.videoContact}
                    onChange={(e) => handleInputChange('videoContact', e.target.value)}
                    placeholder="Phone/Email"
                  />
                  <Input
                    value={formData.videoSocial}
                    onChange={(e) => handleInputChange('videoSocial', e.target.value)}
                    placeholder="Social media"
                  />
                </div>
              </div>

              {/* DJ */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                  <Music className="w-4 h-4 mr-2" />
                  DJ/Music
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={formData.djName}
                    onChange={(e) => handleInputChange('djName', e.target.value)}
                    placeholder="DJ/Band name"
                  />
                  <Input
                    value={formData.djContact}
                    onChange={(e) => handleInputChange('djContact', e.target.value)}
                    placeholder="Phone/Email"
                  />
                  <Input
                    value={formData.djSocial}
                    onChange={(e) => handleInputChange('djSocial', e.target.value)}
                    placeholder="Social media"
                  />
                </div>
              </div>

              {/* DOC */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Day of Coordinator
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={formData.docName}
                    onChange={(e) => handleInputChange('docName', e.target.value)}
                    placeholder="Coordinator name"
                  />
                  <Input
                    value={formData.docContact}
                    onChange={(e) => handleInputChange('docContact', e.target.value)}
                    placeholder="Phone/Email"
                  />
                  <Input
                    value={formData.docSocial}
                    onChange={(e) => handleInputChange('docSocial', e.target.value)}
                    placeholder="Social media"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 8: Officiant Details */}
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Officiant Details
              </CardTitle>
              <CardDescription>Details about the officiant for the ceremony</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="officiantName">Officiant Name</Label>
                <Input
                  id="officiantName"
                  value={formData.officiantName}
                  onChange={(e) => handleInputChange('officiantName', e.target.value)}
                  placeholder="Full name for ceremony announcement"
                />
              </div>

              <div>
                <Label htmlFor="officiantColors">Officiant Colors</Label>
                <Input
                  id="officiantColors"
                  value={formData.officiantColors}
                  onChange={(e) => handleInputChange('officiantColors', e.target.value)}
                  placeholder="Preferred colors to wear or avoid"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="invitedToReception"
                  checked={formData.invitedToReception}
                  onCheckedChange={(checked: boolean) => handleInputChange('invitedToReception', checked)}
                />
                <Label htmlFor="invitedToReception">Invited to Reception</Label>
              </div>
            </CardContent>
          </Card>

          {/* Section 9: Payments & Notes */}
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-blue-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Payments & Additional Notes
              </CardTitle>
              <CardDescription>Financial details and any additional important information</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="serviceTotal">Service Total</Label>
                  <Input
                    id="serviceTotal"
                    type="number"
                    value={formData.serviceTotal}
                    onChange={(e) => handleInputChange('serviceTotal', e.target.value)}
                    placeholder="Total amount ($)"
                  />
                </div>
                <div>
                  <Label htmlFor="deposit">Deposit</Label>
                  <Input
                    id="deposit"
                    type="number"
                    value={formData.deposit}
                    onChange={(e) => handleInputChange('deposit', e.target.value)}
                    placeholder="Deposit amount ($)"
                  />
                </div>
                <div>
                  <Label htmlFor="accommodations">Accommodations</Label>
                  <Input
                    id="accommodations"
                    value={formData.accommodations}
                    onChange={(e) => handleInputChange('accommodations', e.target.value)}
                    placeholder="Hotel/travel arrangements"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any other important details, special requests, or notes about the couple and ceremony..."
                  rows={6}
                  className="min-h-[150px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button at Bottom */}
        <div className="mt-8 flex justify-center">
          <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 px-8 py-3 text-lg">
            <Save className="w-5 h-5 mr-2" />
            Save All Ceremony Details
          </Button>
        </div>
      </div>
    </div>
  )
}
