"use client";

import { useCallback, useState } from "react";
import {
  escalateComplaint as escalateComplaintApi,
  getAdmins,
  type ApiComplaint,
  type ApiUser,
} from "@/lib/api";

interface UseEscalationOptions {
  token: string | null;
  currentUser: ApiUser | null;
  activeComplaint: ApiComplaint | null;
  onComplaintUpdate: (complaint: ApiComplaint) => void;
  onSuccess: (detail: string) => void;
  onStatsRefresh?: () => void;
}

export function useEscalation({
  token,
  currentUser,
  activeComplaint,
  onComplaintUpdate,
  onSuccess,
  onStatsRefresh,
}: UseEscalationOptions) {
  const [escalationModal, setEscalationModal] = useState(false);
  const [targetAdmin, setTargetAdmin] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [admins, setAdmins] = useState<ApiUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalationError, setEscalationError] = useState<string | null>(null);

  const clearEscalationError = useCallback(() => {
    setEscalationError(null);
  }, []);

  const fetchAdmins = useCallback(async () => {
    if (!token) return;
    if (
      currentUser?.role !== "admin" &&
      currentUser?.role !== "district_officer"
    )
      return;
    setAdminsLoading(true);
    try {
      const response = await getAdmins(token);
      setAdmins(response.rows || []);
      if (response.rows?.length === 0) {
        console.warn(
          "No admins found. Backend may be filtering by district incorrectly."
        );
      }
    } catch (error) {
      console.error("Failed to load admins:", error);
    } finally {
      setAdminsLoading(false);
    }
  }, [token, currentUser?.role]);

  const handleOpenEscalationModal = useCallback(() => {
    setEscalationModal(true);
    setEscalationError(null);
    if (admins.length === 0) {
      fetchAdmins();
    }
  }, [admins.length, fetchAdmins]);

  const handleEscalate = useCallback(async () => {
    if (!token) {
      setEscalationError("Session expired. Please sign in again.");
      return;
    }
    if (!activeComplaint) {
      setEscalationError("No active complaint selected.");
      return;
    }
    if (!targetAdmin) {
      setEscalationError("Please select an admin to escalate to.");
      return;
    }
    if (!escalationReason.trim()) {
      setEscalationError("Please provide an escalation reason.");
      return;
    }

    setEscalating(true);
    setEscalationError(null);
    try {
      const complaint = await escalateComplaintApi(token, activeComplaint.id, {
        assignedToId: targetAdmin,
        escalationReason: escalationReason,
      });
      onComplaintUpdate(complaint);
      const admin = admins.find((a) => a.id === targetAdmin);
      onSuccess(admin?.fullName || targetAdmin);
      setEscalationModal(false);
      setTargetAdmin("");
      setEscalationReason("");
      if (currentUser?.role === "admin") {
        onStatsRefresh?.();
      }
    } catch (error) {
      console.error("Failed to escalate complaint:", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Failed to escalate complaint";
      setEscalationError(message);
    } finally {
      setEscalating(false);
    }
  }, [
    token,
    activeComplaint,
    targetAdmin,
    escalationReason,
    admins,
    currentUser?.role,
    onComplaintUpdate,
    onSuccess,
    onStatsRefresh,
  ]);

  const closeEscalationModal = useCallback(() => {
    setEscalationModal(false);
    setTargetAdmin("");
    setEscalationReason("");
    setEscalationError(null);
  }, []);

  return {
    // State
    escalationModal,
    targetAdmin,
    escalationReason,
    admins,
    adminsLoading,
    escalating,
    escalationError,
    // Setters
    setTargetAdmin,
    setEscalationReason,
    // Actions
    fetchAdmins,
    handleOpenEscalationModal,
    handleEscalate,
    closeEscalationModal,
    clearEscalationError,
  };
}

