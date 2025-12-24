"use client";

import type { ApiComplaint, ApiUser } from "@/lib/api";
import {
  formatComplaintDate,
  formatDisplayText,
  getStatusSelectClassName,
} from "../utils/formatters";

interface CaseDetailsModalProps {
  activeComplaint: ApiComplaint;
  currentUser: ApiUser;
  isAdmin: boolean;
  isDistrictOfficer: boolean;
  districtOfficers: ApiUser[];
  navigators: ApiUser[];
  admins: ApiUser[];
  lastAction: { type: "assign" | "escalate"; detail: string } | null;
  statusUpdateFeedback: { kind: "success" | "error"; message: string } | null;
  statusUpdatingId: string | null;
  creatorLoadingIds: Record<string, boolean>;
  assignedLoadingIds: Record<string, boolean>;
  onClose: () => void;
  onOpenAssignmentModal: () => void;
  onOpenEscalationModal: () => void;
  onUpdateStatus: (
    complaintId: string,
    newStatus: ApiComplaint["status"]
  ) => void;
}

export function CaseDetailsModal({
  activeComplaint,
  currentUser,
  isAdmin,
  isDistrictOfficer,
  districtOfficers,
  navigators,
  admins,
  lastAction,
  statusUpdateFeedback,
  statusUpdatingId,
  creatorLoadingIds,
  assignedLoadingIds,
  onClose,
  onOpenAssignmentModal,
  onOpenEscalationModal,
  onUpdateStatus,
}: CaseDetailsModalProps) {
  const getAssignedToName = () => {
    if (activeComplaint.assignedToId === currentUser?.id) {
      return `${currentUser.fullName} (You)`;
    }
    return (
      districtOfficers.find((d) => d.id === activeComplaint.assignedToId)
        ?.fullName ||
      navigators.find((n) => n.id === activeComplaint.assignedToId)?.fullName ||
      admins.find((a) => a.id === activeComplaint.assignedToId)?.fullName ||
      activeComplaint.assignedTo?.fullName ||
      "Unassigned"
    );
  };

  const getCreatedByName = () => {
    if (activeComplaint.createdById === currentUser?.id) {
      return `${currentUser.fullName} (You)`;
    }

    return (
      navigators.find((n) => n.id === activeComplaint.createdById)?.fullName ||
      districtOfficers.find((d) => d.id === activeComplaint.createdById)
        ?.fullName ||
      admins.find((a) => a.id === activeComplaint.createdById)?.fullName ||
      activeComplaint.createdBy?.fullName ||
      "Unknown"
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-600">Case Details</p>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeComplaint.id}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Phone Number
            </p>
            <p className="text-gray-900">{activeComplaint.phoneNumber}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              District
            </p>
            <p className="text-gray-700">
              {formatDisplayText(activeComplaint.district)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Category
            </p>
            <p className="text-gray-700">
              {formatDisplayText(activeComplaint.category)}
            </p>
          </div>

          {activeComplaint.fullName && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Full Name
              </p>
              <p className="text-gray-700">{activeComplaint.fullName}</p>
            </div>
          )}

          {activeComplaint.age && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Age
              </p>
              <p className="text-gray-700">{activeComplaint.age}</p>
            </div>
          )}

          {activeComplaint.gender && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Gender
              </p>
              <p className="text-gray-700">
                {activeComplaint.gender.charAt(0).toUpperCase() +
                  activeComplaint.gender.slice(1)}
              </p>
            </div>
          )}

          {activeComplaint.primaryDisabilityCategory && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Disability Category
              </p>
              <p className="text-gray-700">
                {formatDisplayText(activeComplaint.primaryDisabilityCategory)}
                {activeComplaint.otherDisability &&
                  `: ${activeComplaint.otherDisability}`}
              </p>
            </div>
          )}

          {activeComplaint.assistiveDevice && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Assistive Device
              </p>
              <p className="text-gray-700">
                {formatDisplayText(activeComplaint.assistiveDevice)}
                {activeComplaint.otherAssistiveDevice &&
                  `: ${activeComplaint.otherAssistiveDevice}`}
              </p>
            </div>
          )}

          {activeComplaint.caregiverPhoneNumber && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Caregiver Phone
              </p>
              <p className="text-gray-700">
                {activeComplaint.caregiverPhoneNumber}
              </p>
            </div>
          )}

          {activeComplaint.language && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Language
              </p>
              <p className="text-gray-700">{activeComplaint.language}</p>
            </div>
          )}

          {activeComplaint.issueTypes &&
            activeComplaint.issueTypes.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Issue Types
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeComplaint.issueTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                    >
                      {formatDisplayText(type)}
                    </span>
                  ))}
                </div>
                {activeComplaint.otherIssueType && (
                  <p className="mt-1 text-sm text-gray-600">
                    Other: {activeComplaint.otherIssueType}
                  </p>
                )}
              </div>
            )}

          {activeComplaint.requestType && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Request Type
              </p>
              <p className="text-gray-700">
                {formatDisplayText(activeComplaint.requestType)}
                {activeComplaint.otherRequest &&
                  `: ${activeComplaint.otherRequest}`}
              </p>
            </div>
          )}

          {activeComplaint.requestDescription && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Request Details
              </p>
              <p className="whitespace-pre-line text-gray-700">
                {activeComplaint.requestDescription}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Description
            </p>
            <p className="whitespace-pre-line text-gray-700">
              {activeComplaint.description || "No description provided"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Created
            </p>
            <p className="text-gray-700">
              {formatComplaintDate(activeComplaint.createdAt)}
            </p>
          </div>

          {activeComplaint.createdById && !isDistrictOfficer && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Created By
              </p>
              <p className="text-gray-700">
                {creatorLoadingIds?.[activeComplaint.createdById]
                  ? "Loading..."
                  : getCreatedByName()}
              </p>
            </div>
          )}

          {activeComplaint.assignedToId && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {activeComplaint.status === "escalated"
                  ? "Escalated To"
                  : "Assigned To"}
              </p>
              <p className="text-gray-700">
                {activeComplaint.assignedToId &&
                assignedLoadingIds?.[activeComplaint.assignedToId]
                  ? "Loading..."
                  : getAssignedToName()}
              </p>
            </div>
          )}

          {activeComplaint.expectedResolutionDate && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Expected Resolution
              </p>
              <p className="text-gray-700">
                {formatComplaintDate(activeComplaint.expectedResolutionDate)}
              </p>
            </div>
          )}

          {activeComplaint.status === "escalated" &&
            activeComplaint.escalationReason && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Escalation Reason
                </p>
                <p className="whitespace-pre-line text-gray-700">
                  {activeComplaint.escalationReason}
                </p>
              </div>
            )}

          {lastAction && (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {lastAction.type === "assign"
                ? `Assigned to ${lastAction.detail}`
                : `Escalated to ${lastAction.detail}`}
            </div>
          )}

          {statusUpdateFeedback && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                statusUpdateFeedback.kind === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {statusUpdateFeedback.message}
            </div>
          )}

          {statusUpdatingId === activeComplaint.id && (
            <div className="text-xs text-gray-500">Updating status…</div>
          )}

          <div className="space-y-3 pt-4">
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={onOpenAssignmentModal}
                >
                  Assign
                </button>
                {activeComplaint.status !== "resolved" && (
                  <button
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    onClick={onOpenEscalationModal}
                  >
                    Escalate
                  </button>
                )}
              </div>
            )}
            {isDistrictOfficer ? (
              <div className="flex items-end gap-3">
                {activeComplaint.status !== "resolved" && (
                  <button
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    onClick={onOpenEscalationModal}
                  >
                    Escalate to Admin
                  </button>
                )}
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Update Status
                  </label>
                  <select
                    className={getStatusSelectClassName(activeComplaint.status)}
                    value={activeComplaint.status}
                    disabled={statusUpdatingId === activeComplaint.id}
                    onChange={(e) => {
                      const newStatus = e.target
                        .value as ApiComplaint["status"];
                      onUpdateStatus(activeComplaint.id, newStatus);
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            ) : (
              (isAdmin || isDistrictOfficer) && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Update Status
                  </label>
                  <select
                    className={getStatusSelectClassName(activeComplaint.status)}
                    value={activeComplaint.status}
                    disabled={statusUpdatingId === activeComplaint.id}
                    onChange={(e) => {
                      const newStatus = e.target
                        .value as ApiComplaint["status"];
                      onUpdateStatus(activeComplaint.id, newStatus);
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
