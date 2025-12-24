"use client";

import type { ApiUser } from "@/lib/api";

interface EscalationModalProps {
  targetAdmin: string;
  setTargetAdmin: (value: string) => void;
  escalationReason: string;
  setEscalationReason: (value: string) => void;
  admins: ApiUser[];
  adminsLoading: boolean;
  escalating: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  onEscalate: () => void;
  onClose: () => void;
  onRefreshAdmins?: () => void;
}

export function EscalationModal({
  targetAdmin,
  setTargetAdmin,
  escalationReason,
  setEscalationReason,
  admins,
  adminsLoading,
  escalating,
  errorMessage,
  onClearError,
  onEscalate,
  onRefreshAdmins,
  onClose,
}: EscalationModalProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900">
          Escalate Complaint
        </h3>
        <div className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {errorMessage}
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Escalate to Admin
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={targetAdmin}
              onChange={(e) => {
                onClearError();
                setTargetAdmin(e.target.value);
              }}
              disabled={adminsLoading}
            >
              <option value="">
                {adminsLoading ? "Loading..." : "Select admin"}
              </option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.fullName} ({admin.email})
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center justify-between">
              {!adminsLoading && admins.length === 0 && (
                <p className="text-xs text-gray-500">No admins available.</p>
              )}
              <button
                type="button"
                onClick={() => onRefreshAdmins?.()}
                className="text-xs text-blue-600 hover:underline"
              >
                Refresh list
              </button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Escalation Reason
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={4}
              value={escalationReason}
              onChange={(e) => {
                onClearError();
                setEscalationReason(e.target.value);
              }}
              placeholder="Explain why this complaint needs escalation..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              onClick={onClose}
              disabled={escalating}
            >
              Cancel
            </button>
            <button
              disabled={!targetAdmin || !escalationReason || escalating}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              onClick={onEscalate}
            >
              {escalating ? "Escalating..." : "Escalate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
