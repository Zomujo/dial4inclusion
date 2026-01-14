"use client";

import { useCallback, useMemo, useState } from "react";
import {
  assignComplaint as assignComplaintApi,
  getDistrictOfficers,
  type ApiComplaint,
  type ApiUser,
} from "@/lib/api";
import { districtOptions } from "../utils/constants";

interface UseAssignmentOptions {
  token: string | null;
  currentUser: ApiUser | null;
  activeComplaint: ApiComplaint | null;
  onComplaintUpdate: (complaint: ApiComplaint) => void;
  onSuccess: (detail: string) => void;
  onStatsRefresh?: () => void;
}

export function useAssignment({
  token,
  currentUser,
  activeComplaint,
  onComplaintUpdate,
  onSuccess,
  onStatsRefresh,
}: UseAssignmentOptions) {
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [expectedResolutionDate, setExpectedResolutionDate] = useState("");
  const [districtOfficers, setDistrictOfficers] = useState<ApiUser[]>([]);
  const [districtOfficersLoading, setDistrictOfficersLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const complaintDistrict = activeComplaint?.district;

  const eligibleDistrictOfficers = useMemo(() => {
    if (!complaintDistrict) return districtOfficers;
    return districtOfficers.filter((o) => o.district === complaintDistrict);
  }, [districtOfficers, complaintDistrict]);

  const complaintDistrictLabel = useMemo(() => {
    const match = districtOptions.find((d) => d.value === complaintDistrict);
    return match?.label ?? complaintDistrict ?? "";
  }, [complaintDistrict]);

  const clearAssignmentError = useCallback(() => {
    setAssignmentError(null);
  }, []);

  const fetchDistrictOfficers = useCallback(async () => {
    if (!token) return;
    if (
      currentUser?.role !== "admin" &&
      currentUser?.role !== "district_officer"
    )
      return;
    setDistrictOfficersLoading(true);
    try {
      const response = await getDistrictOfficers(
        token,
        complaintDistrict ?? undefined
      );
      setDistrictOfficers(response.rows || []);
    } catch (error) {
      console.error("Failed to load district officers:", error);
    } finally {
      setDistrictOfficersLoading(false);
    }
  }, [token, currentUser?.role, complaintDistrict]);

  const handleOpenAssignmentModal = useCallback(() => {
    setAssignmentModal(true);
    setAssignmentError(null);
    setAssignee("");
    fetchDistrictOfficers();
  }, [fetchDistrictOfficers]);

  const handleAssign = useCallback(async () => {
    if (!token) {
      setAssignmentError("Session expired. Please sign in again.");
      return;
    }
    if (!activeComplaint) {
      setAssignmentError("No active complaint selected.");
      return;
    }
    if (!assignee) {
      setAssignmentError("Please select a district officer.");
      return;
    }

    const officer = districtOfficers.find((o) => o.id === assignee);
    if (complaintDistrict && officer?.district !== complaintDistrict) {
      setAssignmentError(
        `Please select a district officer in ${complaintDistrictLabel}.`
      );
      return;
    }
    if (!expectedResolutionDate) {
      setAssignmentError("Expected resolution date is required.");
      return;
    }

    setAssigning(true);
    setAssignmentError(null);
    try {
      const expectedDate = new Date(expectedResolutionDate).toISOString();
      const complaint = await assignComplaintApi(token, activeComplaint.id, {
        assignedToId: assignee,
        expectedResolutionDate: expectedDate,
      });
      onComplaintUpdate(complaint);
      const assignedOfficer = districtOfficers.find((o) => o.id === assignee);
      onSuccess(assignedOfficer?.fullName || assignee);
      setAssignmentModal(false);
      setAssignee("");
      setExpectedResolutionDate("");
      if (currentUser?.role === "admin") {
        onStatsRefresh?.();
      }
    } catch (error) {
      console.error("Failed to assign complaint:", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Failed to assign complaint";
      const normalized = message.toLowerCase().replace(/\s+/g, "");
      if (
        normalized.includes("expectedresolutiondate") &&
        (normalized.includes("shouldnotbeempty") ||
          normalized.includes("min") ||
          normalized.includes("minimalalloweddate"))
      ) {
        setAssignmentError(
          "Please set an expected resolution date (it must be in the future)."
        );
      } else {
        setAssignmentError(message);
      }
    } finally {
      setAssigning(false);
    }
  }, [
    token,
    activeComplaint,
    assignee,
    expectedResolutionDate,
    districtOfficers,
    complaintDistrict,
    complaintDistrictLabel,
    currentUser?.role,
    onComplaintUpdate,
    onSuccess,
    onStatsRefresh,
  ]);

  const closeAssignmentModal = useCallback(() => {
    setAssignmentModal(false);
    setAssignee("");
    setExpectedResolutionDate("");
    setAssignmentError(null);
  }, []);

  return {
    // State
    assignmentModal,
    assignee,
    expectedResolutionDate,
    districtOfficers,
    eligibleDistrictOfficers,
    districtOfficersLoading,
    assigning,
    assignmentError,
    // Setters
    setAssignee,
    setExpectedResolutionDate,
    // Actions
    fetchDistrictOfficers,
    handleOpenAssignmentModal,
    handleAssign,
    closeAssignmentModal,
    clearAssignmentError,
  };
}
