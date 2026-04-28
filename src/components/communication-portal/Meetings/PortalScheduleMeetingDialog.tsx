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

  return (
    <>
      {/* Schedule Meeting Dialog */}
      <ScheduleMeetingDialog
        isOpen={showScheduleMeetingDialog}
        onOpenChange={setShowScheduleMeetingDialog}
        onScheduleMeeting={handleScheduleMeeting}
        coupleEmails={[editCoupleInfo.brideEmail, editCoupleInfo.groomEmail]}
        coupleName={`${editCoupleInfo.brideName.split(' ')[0]} & ${editCoupleInfo.groomName.split(' ')[0]}`}
      />
    </>
  )
}
