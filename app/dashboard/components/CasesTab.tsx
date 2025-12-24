"use client";

import type { ApiComplaint } from "@/lib/api";
import { CasesTable } from "./CasesTable";
import { EscalationsSection } from "./EscalationsSection";
import { districtOptions } from "../utils/constants";

interface CasesTabProps {
  isAdmin: boolean;
  isDistrictOfficer: boolean;
  escalatedToMe: ApiComplaint[];
  filteredComplaints: ApiComplaint[];
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  selectedCase: string | null;
  statusUpdatingId: string | null;
  onSelect: (id: string) => void;
  onUpdateStatus: (
    complaintId: string,
    newStatus: ApiComplaint["status"]
  ) => void;
  adminDistrict?: string;
  onAdminDistrictChange?: (district: string) => void;
}

export function CasesTab({
  isAdmin,
  isDistrictOfficer,
  escalatedToMe,
  filteredComplaints,
  statusFilter,
  setStatusFilter,
  selectedCase,
  statusUpdatingId,
  onSelect,
  onUpdateStatus,
  adminDistrict,
  onAdminDistrictChange,
}: CasesTabProps) {
  return (
    <div className="space-y-6">
      {/* Escalations Section - Only for admins */}
      {isAdmin && (
        <EscalationsSection
          escalatedToMe={escalatedToMe}
          statusUpdatingId={statusUpdatingId}
          onSelect={onSelect}
          onUpdateStatus={onUpdateStatus}
        />
      )}

      {/* Cases Tab Content */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isAdmin
              ? "Case Management"
              : isDistrictOfficer
              ? "Assigned Cases"
              : "My Cases"}
          </h2>
          <p className="text-gray-600">
            {isAdmin
              ? "Monitor and triage incoming PWD complaints"
              : isDistrictOfficer
              ? "Cases assigned to you for resolution"
              : "Cases you've reported from the field"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              {districtOptions.map((d) => {
                const active = adminDistrict === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => onAdminDistrictChange?.(d.value)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          )}
          <select
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All statuses</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Escalated</option>
            <option>Resolved</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>

      <div>
        <CasesTable
          complaints={filteredComplaints}
          selectedCase={selectedCase}
          onSelect={onSelect}
          showDistrictColumn={!isAdmin}
        />
      </div>
    </div>
  );
}
