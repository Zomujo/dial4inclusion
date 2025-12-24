"use client";

import type { ApiComplaint } from "@/lib/api";
import { formatComplaintDate, formatComplaintStatus, formatDisplayText } from "../utils/formatters";

interface AlertsSectionProps {
  overdueComplaints: ApiComplaint[];
}

export function AlertsSection({ overdueComplaints }: AlertsSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Active Alerts</h3>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
            {overdueComplaints.length} overdue
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-auto">
        {overdueComplaints.length === 0 && (
          <p className="px-6 py-4 text-sm text-gray-600">No overdue cases.</p>
        )}
        {overdueComplaints.map((complaint) => (
          <div key={complaint.id} className="p-6">
            <div>
              <p className="font-semibold text-gray-900">
                Case {complaint.id.slice(0, 8)}
              </p>
              <p className="text-sm text-gray-700">
                {formatDisplayText(complaint.category)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Expected:{" "}
                {complaint.expectedResolutionDate
                  ? formatComplaintDate(complaint.expectedResolutionDate)
                  : "N/A"}
              </p>
              <p className="text-xs text-gray-500">
                Status: {formatComplaintStatus(complaint.status)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

