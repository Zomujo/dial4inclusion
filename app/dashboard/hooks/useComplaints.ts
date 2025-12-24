"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import {
  getComplaints,
  getComplaint,
  getUser,
  submitComplaint as submitComplaintApi,
  updateComplaintStatus as updateComplaintStatusApi,
  type ApiComplaint,
  type ApiUser,
} from "@/lib/api";
import {
  getStatusLabel,
  getFriendlyStatusUpdateError,
} from "../utils/formatters";

export interface ComplaintFormState {
  fullName: string;
  age: string;
  phoneNumber: string;
  caregiverPhoneNumber: string;
  category: string;
  district: string;
  primaryDisabilityCategory: string;
  otherDisability: string;
  assistiveDevice: string;
  otherAssistiveDevice: string;
  issueTypes: string[];
  otherIssueType: string;
  requestType: string;
  requestDescription: string;
  otherRequest: string;
  gender: string;
  language: string;
  description: string;
  otherCategory: string;
  complaintType: "general" | "detailed";
}

const initialFormState: ComplaintFormState = {
  fullName: "",
  age: "",
  phoneNumber: "",
  caregiverPhoneNumber: "",
  category: "",
  district: "",
  primaryDisabilityCategory: "",
  otherDisability: "",
  assistiveDevice: "none",
  otherAssistiveDevice: "",
  issueTypes: [],
  otherIssueType: "",
  requestType: "",
  requestDescription: "",
  otherRequest: "",
  gender: "male",
  language: "english",
  description: "",
  otherCategory: "",
  complaintType: "general",
};

interface UseComplaintsOptions {
  token: string | null;
  currentUser: ApiUser | null;
  onStatsRefresh?: () => void;
}

export function useComplaints({
  token,
  currentUser,
  onStatsRefresh,
}: UseComplaintsOptions) {
  const [liveComplaints, setLiveComplaints] = useState<ApiComplaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);
  const [complaintForm, setComplaintForm] =
    useState<ComplaintFormState>(initialFormState);
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [statusUpdateFeedback, setStatusUpdateFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{
    type: "assign" | "escalate";
    detail: string;
  } | null>(null);
  const [creatorLoadingIds, setCreatorLoadingIds] = useState<
    Record<string, boolean>
  >({});
  const [assignedLoadingIds, setAssignedLoadingIds] = useState<
    Record<string, boolean>
  >({});

  const refreshComplaints = useCallback(async () => {
    if (!token) return;
    setComplaintsLoading(true);
    setComplaintsError(null);
    try {
      const response = await getComplaints(token);
      setLiveComplaints(response.rows || []);
    } catch (error) {
      setComplaintsError(
        error instanceof Error ? error.message : "Failed to load complaints"
      );
    } finally {
      setComplaintsLoading(false);
    }
  }, [token]);

  const handleComplaintSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!token) return;
      setComplaintSubmitting(true);
      setComplaintStatus(null);
      setComplaintsError(null);
      try {
        const isDetailed = complaintForm.complaintType === "detailed";

        const result = await submitComplaintApi(token, {
          fullName: isDetailed ? complaintForm.fullName : "Anonymous",
          age: isDetailed ? parseInt(complaintForm.age) || 18 : 18,
          gender: isDetailed ? complaintForm.gender : "other",
          primaryDisabilityCategory: isDetailed
            ? complaintForm.primaryDisabilityCategory
            : undefined,
          otherDisability: complaintForm.otherDisability || undefined,
          assistiveDevice: isDetailed ? complaintForm.assistiveDevice : "none",
          otherAssistiveDevice: complaintForm.otherAssistiveDevice || undefined,
          phoneNumber: complaintForm.phoneNumber,
          caregiverPhoneNumber: isDetailed
            ? complaintForm.caregiverPhoneNumber || undefined
            : undefined,
          language: isDetailed ? complaintForm.language : "english",
          category: complaintForm.category,
          otherCategory: complaintForm.otherCategory || undefined,
          issueTypes: isDetailed ? complaintForm.issueTypes : undefined,
          otherIssueType: complaintForm.otherIssueType || undefined,
          requestType: isDetailed ? complaintForm.requestType : undefined,
          requestDescription: complaintForm.requestDescription || undefined,
          otherRequest: complaintForm.otherRequest || undefined,
          district: complaintForm.district,
          description: complaintForm.description,
        });

        await refreshComplaints();

        setComplaintForm(initialFormState);
        setComplaintStatus(
          `Complaint submitted successfully. Code: ${result.code}`
        );

        return result;
      } catch (error) {
        setComplaintStatus(null);
        setComplaintsError(
          error instanceof Error ? error.message : "Failed to submit complaint"
        );
        return null;
      } finally {
        setComplaintSubmitting(false);
      }
    },
    [token, complaintForm, refreshComplaints]
  );

  const handleUpdateStatus = useCallback(
    async (complaintId: string, newStatus: ApiComplaint["status"]) => {
      if (!token) {
        setStatusUpdateFeedback({
          kind: "error",
          message: "Session expired. Please sign in again.",
        });
        return;
      }

      const current = liveComplaints.find((c) => c.id === complaintId);
      if (!current) {
        setStatusUpdateFeedback({
          kind: "error",
          message: "This case is no longer available. Please refresh.",
        });
        return;
      }

      if (
        currentUser?.role === "district_officer" &&
        current.assignedToId &&
        current.assignedToId !== currentUser.id
      ) {
        setStatusUpdateFeedback({
          kind: "error",
          message: "You can only change the status of cases assigned to you.",
        });
        return;
      }

      if (currentUser?.role === "district_officer" && !current.assignedToId) {
        setStatusUpdateFeedback({
          kind: "error",
          message: "You can't change the status until the case is assigned.",
        });
        return;
      }

      if (current.status === newStatus) return;

      const previousStatus = current.status;
      setStatusUpdatingId(complaintId);
      setStatusUpdateFeedback(null);

      setLiveComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId ? { ...c, status: newStatus } : c
        )
      );

      try {
        const updated = await updateComplaintStatusApi(token, complaintId, {
          status: newStatus,
        });
        const finalStatus = updated?.status ?? newStatus;
        setLiveComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId
              ? {
                  ...c,
                  ...updated,
                  id: c.id,
                  status: finalStatus,
                }
              : c
          )
        );
        setStatusUpdateFeedback({
          kind: "success",
          message: `Status updated to ${getStatusLabel(finalStatus)}.`,
        });
        if (currentUser?.role === "admin") {
          onStatsRefresh?.();
        }
      } catch (error) {
        setLiveComplaints((prev) =>
          prev.map((c) =>
            c.id === complaintId ? { ...c, status: previousStatus } : c
          )
        );
        setStatusUpdateFeedback({
          kind: "error",
          message: getFriendlyStatusUpdateError(error),
        });
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [token, liveComplaints, currentUser, onStatsRefresh]
  );

  const escalatedToMe = useMemo(() => {
    if (!currentUser || currentUser.role !== "admin") return [];
    return liveComplaints.filter(
      (c) => c.status === "escalated" && c.assignedToId === currentUser.id
    );
  }, [liveComplaints, currentUser]);

  const filteredComplaints = useMemo(() => {
    let complaints = liveComplaints;

    if (currentUser?.role === "district_officer") {
      complaints = liveComplaints.filter((c) => {
        if (c.assignedToId !== currentUser.id) return false;
        if (
          currentUser.district &&
          c.district &&
          c.district !== currentUser.district
        )
          return false;
        return true;
      });
    }

    // Navigators should only see complaints they created
    if (currentUser?.role === "navigator") {
      complaints = liveComplaints.filter(
        (c) => c.createdById === currentUser.id
      );
    }

    if (statusFilter === "All statuses") {
      return complaints;
    }

    const statusMap: Record<string, ApiComplaint["status"]> = {
      Pending: "pending",
      "In Progress": "in_progress",
      Escalated: "escalated",
      Resolved: "resolved",
      Rejected: "rejected",
    };

    const backendStatus = statusMap[statusFilter];
    if (!backendStatus) return complaints;
    return complaints.filter((c) => c.status === backendStatus);
  }, [liveComplaints, statusFilter, currentUser]);

  const activeComplaint = selectedCase
    ? liveComplaints.find((c) => c.id === selectedCase) ?? null
    : filteredComplaints[0] ?? null;

  const handleSelect = useCallback(
    async (id: string) => {
      setSelectedCase(id);
      setLastAction(null);
      setStatusUpdateFeedback(null);

      if (!token) return;

      const canFetchUsersById =
        currentUser?.role === "admin" || currentUser?.role === "navigator";

      try {
        const full = await getComplaint(token, id);
        let merged = { ...full } as ApiComplaint;

        // If backend didn't include related `createdBy`, try fetching the user directly
        if (
          canFetchUsersById &&
          full.createdById &&
          !full.createdBy?.fullName
        ) {
          setCreatorLoadingIds((s) => ({ ...s, [full.createdById!]: true }));
          try {
            const user = await getUser(token, full.createdById);
            merged = { ...merged, createdBy: user };
          } catch (err) {
            // ignore — we'll fall back to local lists or 'Unknown'
          } finally {
            setCreatorLoadingIds((s) => ({ ...s, [full.createdById!]: false }));
          }
        }

        // If backend didn't include related `assignedTo`, try fetching that user too
        if (
          canFetchUsersById &&
          full.assignedToId &&
          !full.assignedTo?.fullName
        ) {
          setAssignedLoadingIds((s) => ({ ...s, [full.assignedToId!]: true }));
          try {
            const user = await getUser(token, full.assignedToId);
            merged = { ...merged, assignedTo: user };
          } catch (err) {
            // ignore — we'll fall back to local lists or 'Unassigned'
          } finally {
            setAssignedLoadingIds((s) => ({
              ...s,
              [full.assignedToId!]: false,
            }));
          }
        }

        setLiveComplaints((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...merged } : c))
        );
      } catch (error) {
        setComplaintsError(
          error instanceof Error ? error.message : "Failed to load case details"
        );
      }
    },
    [token, currentUser?.role]
  );

  const closeCaseDetailsModal = useCallback(() => {
    setSelectedCase(null);
    setLastAction(null);
    setStatusUpdateFeedback(null);
  }, []);

  const updateComplaintInList = useCallback((complaint: ApiComplaint) => {
    setLiveComplaints((prev) =>
      prev.map((c) => (c.id === complaint.id ? complaint : c))
    );
  }, []);

  const resetComplaintForm = useCallback(() => {
    setComplaintForm(initialFormState);
    setComplaintStatus(null);
    setComplaintsError(null);
  }, []);

  return {
    // State
    liveComplaints,
    complaintsLoading,
    complaintsError,
    complaintForm,
    complaintSubmitting,
    complaintStatus,
    statusFilter,
    selectedCase,
    statusUpdateFeedback,
    statusUpdatingId,
    lastAction,
    escalatedToMe,
    filteredComplaints,
    activeComplaint,
    // Setters
    setComplaintForm,
    setStatusFilter,
    setSelectedCase,
    setLastAction,
    setComplaintsError,
    setComplaintStatus,
    // Actions
    refreshComplaints,
    handleComplaintSubmit,
    handleUpdateStatus,
    handleSelect,
    closeCaseDetailsModal,
    updateComplaintInList,
    resetComplaintForm,
    creatorLoadingIds,
    assignedLoadingIds,
  };
}
