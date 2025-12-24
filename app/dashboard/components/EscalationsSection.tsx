"use client";

import type { ApiComplaint } from "@/lib/api";
import {
  formatDisplayText,
  getStatusSelectClassName,
} from "../utils/formatters";

interface EscalationsSectionProps {
  escalatedToMe: ApiComplaint[];
  statusUpdatingId: string | null;
  onSelect: (id: string) => void;
  onUpdateStatus: (complaintId: string, newStatus: ApiComplaint["status"]) => void;
}

export function EscalationsSection({
  escalatedToMe,
  statusUpdatingId,
  onSelect,
  onUpdateStatus,
}: EscalationsSectionProps) {
  if (escalatedToMe.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-red-900">Escalations</h2>
          <p className="text-sm text-red-700">
            {escalatedToMe.length} case{escalatedToMe.length !== 1 ? "s" : ""}{" "}
            escalated to you
          </p>
        </div>
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
          {escalatedToMe.length}
        </span>
      </div>
      <div className="space-y-2">
        {escalatedToMe.map((complaint) => (
          <div
            key={complaint.id}
            className="rounded-lg border border-red-200 bg-white p-4 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onSelect(complaint.id)}
              >
                <p className="font-semibold text-gray-900">
                  {formatDisplayText(complaint.category) || "Complaint"}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                  {complaint.phoneNumber} -{" "}
                  {complaint.district?.replace(/_/g, " ")}
                </p>
                {complaint.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                    {complaint.description}
                  </p>
                )}
                {complaint.escalationReason && (
                  <p className="text-xs text-red-700 mt-1 italic">
                    Reason: {complaint.escalationReason}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <select
                  className={getStatusSelectClassName(complaint.status)}
                  value={complaint.status}
                  disabled={statusUpdatingId === complaint.id}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newStatus = e.target.value as ApiComplaint["status"];
                    onUpdateStatus(complaint.id, newStatus);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="escalated">Escalated</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

