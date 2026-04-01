"use client"

import { AlertCircle } from "lucide-react"
import { CancelMembershipButton } from "./CancelMembershipButton"
import { PauseMembershipButton } from "./PauseMembershipButton"

interface MemberActionsProps {
  memberId: string
  memberName: string
  isPaused: boolean
  isCancelled: boolean
  onRefresh: () => void
}

export function MemberActions({ 
  memberId, 
  memberName, 
  isPaused, 
  isCancelled, 
  onRefresh 
}: MemberActionsProps) {
  if (isCancelled) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">{isPaused ? "Membership is Paused" : "Manage Membership"}</p>
        </div>
        <p className="mt-1 text-sm">
          {isPaused 
            ? "This membership is currently paused. No payments are being collected."
            : "You can pause or cancel this membership at any time."}
        </p>
      </div>
      <div className="flex gap-3">
        <PauseMembershipButton 
          memberId={memberId}
          isPaused={isPaused}
          onToggle={onRefresh}
        />
        <CancelMembershipButton 
          memberId={memberId}
          memberName={memberName}
          onCancel={onRefresh}
        />
      </div>
    </div>
  )
}