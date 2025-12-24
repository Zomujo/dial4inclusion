"use client";

import type { NavigatorUpdate, ApiComplaint } from "@/lib/api";
import { formatComplaintDate, formatComplaintStatus } from "../utils/formatters";

interface NavigatorUpdatesProps {
  navigatorUpdates: NavigatorUpdate[];
}

export function NavigatorUpdates({ navigatorUpdates }: NavigatorUpdatesProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-900">Navigator Updates</h3>
      {navigatorUpdates.length === 0 && (
        <p className="text-sm text-gray-600">No navigator updates yet.</p>
      )}
      <div className="space-y-4 max-h-96 overflow-auto">
        {navigatorUpdates.map((update) => (
          <div key={update.id} className="rounded-lg bg-gray-50 p-4">
            <div className="mb-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">
                {update.navigatorName}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {update.complaintTitle}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  update.oldStatus === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : update.oldStatus === "in_progress"
                    ? "bg-blue-100 text-blue-800"
                    : update.oldStatus === "escalated"
                    ? "bg-red-100 text-red-800"
                    : update.oldStatus === "resolved"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {formatComplaintStatus(update.oldStatus as ApiComplaint["status"])}
              </span>
              <span className="text-gray-400">→</span>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  update.newStatus === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : update.newStatus === "in_progress"
                    ? "bg-blue-100 text-blue-800"
                    : update.newStatus === "escalated"
                    ? "bg-red-100 text-red-800"
                    : update.newStatus === "resolved"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {formatComplaintStatus(update.newStatus as ApiComplaint["status"])}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {formatComplaintDate(update.updatedAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

