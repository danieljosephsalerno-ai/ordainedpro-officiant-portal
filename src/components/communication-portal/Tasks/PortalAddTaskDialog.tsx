"use client"

import { AddTaskDialog } from "@/components/AddTaskDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalAddTaskDialog() {
  const {
    showAddTaskDialog,
    setShowAddTaskDialog,
    handleAddTask,
  } = useCommunicationPortal()

  return (
    <>
      {/* Add Task Dialog */}
      <AddTaskDialog
        isOpen={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        onAddTask={handleAddTask}
      />
    </>
  )
}
