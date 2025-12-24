import type { ApiComplaint } from "@/lib/api";

export const formatComplaintStatus = (status: ApiComplaint["status"]): string => {
  switch (status) {
    case "pending":
      return "Pending";
    case "in_progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
};

export const getStatusLabel = (status?: ApiComplaint["status"] | null) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "in_progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    case "rejected":
      return "Rejected";
    case "escalated":
      return "Escalated";
    default:
      return "Unknown";
  }
};

export const getStatusSelectClassName = (status: ApiComplaint["status"]) => {
  const baseClassName =
    "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  switch (status) {
    case "resolved":
      return `${baseClassName} border-green-300 bg-green-50 text-green-900 focus:border-green-500`;
    case "in_progress":
      return `${baseClassName} border-orange-300 bg-orange-50 text-orange-900 focus:border-orange-500`;
    case "pending":
      return `${baseClassName} border-yellow-300 bg-yellow-50 text-yellow-900 focus:border-yellow-500`;
    case "escalated":
      return `${baseClassName} border-red-300 bg-red-50 text-red-900 focus:border-red-500`;
    case "rejected":
    default:
      return `${baseClassName} border-gray-300 bg-white text-gray-900 focus:border-blue-500`;
  }
};

export const formatComplaintDate = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const getFriendlyStatusUpdateError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Failed to update status";
  const normalized = message.toLowerCase().replace(/\s+/g, "");
  if (normalized.includes("cannotchangeunassignedcomplaint")) {
    return "You can't change the status until the case is assigned. Assign it first.";
  }
  return message;
};

export const formatDisplayText = (text?: string | null) => {
  if (!text) return "N/A";
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

