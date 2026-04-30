"use client"

import { ScheduleMeetingDialog } from "@/components/ScheduleMeetingDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalScheduleMeetingDialog() {
  const {
    showScheduleMeetingDialog,
    setShowScheduleMeetingDialog,
    editCoupleInfo,
    handleScheduleMeeting,
  } = useCommunicationPortal()

  // Don't render if editCoupleInfo is not available
  if (!editCoupleInfo?.brideName) {
    return null
  }

  return (
    <>
      {/* Schedule Meeting Dialog */}
      <ScheduleMeetingDialog
        isOpen={showScheduleMeetingDialog}
        onOpenChange={setShowScheduleMeetingDialog}
        onScheduleMeeting={handleScheduleMeeting}
        coupleEmails={[editCoupleInfo.brideEmail || '', editCoupleInfo.groomEmail || '']}
        coupleName={`${editCoupleInfo.brideName?.split(' ')[0] || 'Bride'} & ${editCoupleInfo.groomName?.split(' ')[0] || 'Groom'}`}
      />
    </>
  )
}
