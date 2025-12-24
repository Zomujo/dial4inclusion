"use client";

import type { ApiUser } from "@/lib/api";

interface AssignmentModalProps {
  assignee: string;
  setAssignee: (value: string) => void;
  expectedResolutionDate: string;
  setExpectedResolutionDate: (value: string) => void;
  districtOfficers: ApiUser[];
  districtOfficersLoading: boolean;
  assigning: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  onAssign: () => void;
  onClose: () => void;
}

export function AssignmentModal({
  assignee,
  setAssignee,
  expectedResolutionDate,
  setExpectedResolutionDate,
  districtOfficers,
  districtOfficersLoading,
  assigning,
  errorMessage,
  onClearError,
  onAssign,
  onClose,
}: AssignmentModalProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900">
          Assign Complaint
        </h3>
        <div className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {errorMessage}
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Assign to District Officer
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={assignee}
              onChange={(e) => {
                onClearError();
                setAssignee(e.target.value);
              }}
              disabled={districtOfficersLoading}
            >
              <option value="">
                {districtOfficersLoading
                  ? "Loading..."
                  : "Select district officer"}
              </option>
              {districtOfficers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.fullName} - {officer.district} ({officer.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Expected Resolution Date
            </label>
            <p className="mb-2 text-xs text-gray-500">Required</p>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={expectedResolutionDate}
              onChange={(e) => {
                onClearError();
                setExpectedResolutionDate(e.target.value);
              }}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              onClick={onClose}
              disabled={assigning}
            >
              Cancel
            </button>
            <button
              disabled={assigning}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              onClick={onAssign}
            >
              {assigning ? "Assigning..." : "Assign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
