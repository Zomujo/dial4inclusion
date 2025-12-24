"use client";

import { useCallback, useState } from "react";
import {
  assignComplaint as assignComplaintApi,
  getDistrictOfficers,
  type ApiComplaint,
  type ApiUser,
} from "@/lib/api";

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

  const fetchDistrictOfficers = useCallback(async () => {
    if (!token) return;
    if (currentUser?.role !== "admin") return;
    setDistrictOfficersLoading(true);
    try {
      const response = await getDistrictOfficers(token);
      setDistrictOfficers(response.rows || []);
    } catch (error) {
      console.error("Failed to load district officers:", error);
    } finally {
      setDistrictOfficersLoading(false);
    }
  }, [token, currentUser?.role]);

  const handleOpenAssignmentModal = useCallback(() => {
    setAssignmentModal(true);
    if (districtOfficers.length === 0) {
      fetchDistrictOfficers();
    }
  }, [districtOfficers.length, fetchDistrictOfficers]);

  const handleAssign = useCallback(async () => {
    if (!token || !activeComplaint || !assignee) return;
    setAssigning(true);
    try {
      const expectedDate = expectedResolutionDate
        ? new Date(expectedResolutionDate).toISOString()
        : undefined;
      const complaint = await assignComplaintApi(token, activeComplaint.id, {
        assignedToId: assignee,
        expectedResolutionDate: expectedDate,
      });
      onComplaintUpdate(complaint);
      const officer = districtOfficers.find((o) => o.id === assignee);
      onSuccess(officer?.fullName || assignee);
      setAssignmentModal(false);
      setAssignee("");
      setExpectedResolutionDate("");
      if (currentUser?.role === "admin") {
        onStatsRefresh?.();
      }
    } catch (error) {
      console.error("Failed to assign complaint:", error);
      alert(
        error instanceof Error ? error.message : "Failed to assign complaint"
      );
    } finally {
      setAssigning(false);
    }
  }, [
    token,
    activeComplaint,
    assignee,
    expectedResolutionDate,
    districtOfficers,
    currentUser?.role,
    onComplaintUpdate,
    onSuccess,
    onStatsRefresh,
  ]);

  const closeAssignmentModal = useCallback(() => {
    setAssignmentModal(false);
    setAssignee("");
    setExpectedResolutionDate("");
  }, []);

  return {
    // State
    assignmentModal,
    assignee,
    expectedResolutionDate,
    districtOfficers,
    districtOfficersLoading,
    assigning,
    // Setters
    setAssignee,
    setExpectedResolutionDate,
    // Actions
    fetchDistrictOfficers,
    handleOpenAssignmentModal,
    handleAssign,
    closeAssignmentModal,
  };
}

