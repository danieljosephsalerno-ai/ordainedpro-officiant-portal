"use client"

import { PortalAddTaskDialog } from "./Tasks/PortalAddTaskDialog"
import { PortalScheduleMeetingDialog } from "./Meetings/PortalScheduleMeetingDialog"
import { PortalContractUploadDialog } from "./Contracts/PortalContractUploadDialog"
import { PortalEditWeddingDetailsDialog } from "./CeremoniesCouples/PortalEditWeddingDetailsDialog"
import { PortalAddWeddingEventDialog } from "./Meetings/PortalAddWeddingEventDialog"
import { PortalEditMeetingDialog } from "./Meetings/PortalEditMeetingDialog"
import { PortalFileViewerDialog } from "./Files/PortalFileViewerDialog"
import { PortalContractViewerDialog } from "./Contracts/PortalContractViewerDialog"
import { PortalSendContractEmailDialog } from "./Contracts/PortalSendContractEmailDialog"
import { PortalSendPaymentReminderDialog } from "./Payments/PortalSendPaymentReminderDialog"
import { PortalGenerateInvoiceDialog } from "./Payments/PortalGenerateInvoiceDialog"
import { PortalScriptEditorDialog } from "./Scripts/PortalScriptEditorDialog"
import { PortalScriptViewerDialog } from "./Scripts/PortalScriptViewerDialog"
import { PortalShareScriptDialog } from "./Scripts/PortalShareScriptDialog"
import { PortalOfficiantDashboardDialog } from "./CeremoniesCouples/PortalOfficiantDashboardDialog"
import { PortalViewInvoiceDialog } from "./Payments/PortalViewInvoiceDialog"
import { PortalRecordPaymentDialog } from "./Payments/PortalRecordPaymentDialog"

export function PortalDialogs() {
  return (
    <>
      <PortalAddTaskDialog />
      <PortalScheduleMeetingDialog />
      <PortalContractUploadDialog />
      <PortalEditWeddingDetailsDialog />
      <PortalAddWeddingEventDialog />
      <PortalEditMeetingDialog />
      <PortalFileViewerDialog />
      <PortalContractViewerDialog />
      <PortalSendContractEmailDialog />
      <PortalSendPaymentReminderDialog />
      <PortalGenerateInvoiceDialog />
      <PortalScriptEditorDialog />
      <PortalScriptViewerDialog />
      <PortalShareScriptDialog />
      <PortalOfficiantDashboardDialog />
      <PortalViewInvoiceDialog />
      <PortalRecordPaymentDialog />
    </>
  )
}
