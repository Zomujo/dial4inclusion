"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  assignComplaint as assignComplaintApi,
  escalateComplaint as escalateComplaintApi,
  getAdmins,
  getComplaintStats,
  getComplaints,
  getNavigatorUpdates,
  getDistrictOfficers,
  getNavigators,
  getOverdueComplaints,
  submitComplaint as submitComplaintApi,
  updateComplaintStatus as updateComplaintStatusApi,
  type ApiComplaint,
  type ApiUser,
  type NavigatorUpdate,
} from "@/lib/api";
import { clearAuth, loadAuth } from "@/lib/storage";

const tabs = [
  { id: "cases", label: "Cases" },
  { id: "monitoring", label: "Monitoring" },
  { id: "ussd", label: "USSD Flow" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [liveComplaints, setLiveComplaints] = useState<ApiComplaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);
  const [complaintForm, setComplaintForm] = useState({
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
    issueTypes: [] as string[],
    otherIssueType: "",
    requestType: "",
    requestDescription: "",
    otherRequest: "",
    gender: "male",
    language: "english",
    description: "",
    otherCategory: "",
    complaintType: "general" as "general" | "detailed",
  });
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("cases");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [overdueComplaints, setOverdueComplaints] = useState<ApiComplaint[]>(
    []
  );
  const [navigatorUpdates, setNavigatorUpdates] = useState<NavigatorUpdate[]>(
    []
  );
  const [activePath, setActivePath] = useState<"report" | "info" | "navigator">(
    "report"
  );
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [escalationModal, setEscalationModal] = useState(false);
  const [newCaseModal, setNewCaseModal] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [expectedResolutionDate, setExpectedResolutionDate] = useState("");
  const [targetAdmin, setTargetAdmin] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [navigators, setNavigators] = useState<ApiUser[]>([]);
  const [districtOfficers, setDistrictOfficers] = useState<ApiUser[]>([]);
  const [admins, setAdmins] = useState<ApiUser[]>([]);
  const [districtOfficersLoading, setDistrictOfficersLoading] = useState(false);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: "assign" | "escalate";
    detail: string;
  } | null>(null);
  const [statusUpdateFeedback, setStatusUpdateFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [monitoringStats, setMonitoringStats] = useState<{
    activeCases: number;
    avgResponseHours: number;
    resolutionRate: number;
    overdueCases: number;
  } | null>(null);

  // Metrics for Monitoring tab
  const monitoringMetrics = useMemo(
    () => [
      {
        label: "Active Cases",
        value: monitoringStats?.activeCases ?? 0,
        change: "0",
        trend: "up" as const,
        color: "blue" as const,
      },
      {
        label: "Avg Response",
        value: `${monitoringStats?.avgResponseHours ?? 0}h`,
        change: "0h",
        trend: "down" as const,
        color: "green" as const,
      },
      {
        label: "Resolution Rate",
        value: `${monitoringStats?.resolutionRate ?? 0}%`,
        change: "0%",
        trend: "up" as const,
        color: "purple" as const,
      },
      {
        label: "Overdue Cases",
        value: monitoringStats?.overdueCases ?? 0,
        change: "0",
        trend: "up" as const,
        color: "red" as const,
      },
    ],
    [monitoringStats]
  );

  useEffect(() => {
    const stored = loadAuth();
    if (!stored) {
      setCheckingAuth(false);
      router.replace("/");
      return;
    }
    setToken(stored.token);
    setCurrentUser(stored.user);
    setCheckingAuth(false);
  }, [router]);

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

  const refreshStats = useCallback(async () => {
    if (!token) return;
    try {
      const stats = await getComplaintStats(token);
      setMonitoringStats(stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, [token]);

  const refreshNavigatorUpdates = useCallback(async () => {
    if (!token) return;
    try {
      const updates = await getNavigatorUpdates(token, 10);
      setNavigatorUpdates(updates);
    } catch (error) {
      console.error("Failed to load navigator updates:", error);
    }
  }, [token]);

  const refreshOverdueComplaints = useCallback(async () => {
    if (!token) return;
    try {
      const complaints = await getOverdueComplaints(token);
      setOverdueComplaints(complaints);
    } catch (error) {
      console.error("Failed to load overdue complaints:", error);
    }
  }, [token]);

  const fetchNavigators = useCallback(async () => {
    if (!token || currentUser?.role !== "admin") return;
    try {
      const response = await getNavigators(token);
      setNavigators(response.rows || []);
    } catch (error) {
      console.error("Failed to load navigators:", error);
    }
  }, [token, currentUser?.role]);

  const fetchDistrictOfficers = useCallback(async () => {
    if (!token) return;
    // Only admins can fetch district officers list (backend permission)
    // Navigators will see assigned names via complaint.assignedTo object from backend
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

  const fetchAdmins = useCallback(async () => {
    if (!token) return;
    // Allow both admins and district officers to fetch admins (for escalation)
    if (
      currentUser?.role !== "admin" &&
      currentUser?.role !== "district_officer"
    )
      return;
    setAdminsLoading(true);
    try {
      const response = await getAdmins(token);
      // Backend filters by district, so district officers only see admins from their district
      // This is a backend issue - admins should not be district-filtered
      // See BACKEND_ISSUES.md Issue 1.4
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

  useEffect(() => {
    if (!token) return;
    refreshComplaints();
    if (currentUser?.role === "admin") {
      refreshStats();
      refreshNavigatorUpdates();
      refreshOverdueComplaints();
      // Load navigators, district officers, and admins for displaying names in case details
      fetchNavigators();
      fetchDistrictOfficers();
      fetchAdmins();
    }
  }, [
    token,
    currentUser?.role,
    fetchNavigators,
    fetchDistrictOfficers,
    fetchAdmins,
    refreshComplaints,
    refreshNavigatorUpdates,
    refreshOverdueComplaints,
    refreshStats,
  ]);

  useEffect(() => {
    if (activeTab === "monitoring" && token && currentUser?.role === "admin") {
      refreshNavigatorUpdates();
      refreshOverdueComplaints();
    }
  }, [
    activeTab,
    token,
    currentUser?.role,
    refreshNavigatorUpdates,
    refreshOverdueComplaints,
  ]);

  const handleOpenAssignmentModal = () => {
    setAssignmentModal(true);
    if (districtOfficers.length === 0) {
      fetchDistrictOfficers();
    }
  };

  const handleOpenEscalationModal = () => {
    setEscalationModal(true);
    if (admins.length === 0) {
      fetchAdmins();
    }
  };

  const handleAssign = async () => {
    if (!token || !activeComplaint || !assignee) return;
    setAssigning(true);
    try {
      // Convert datetime-local to ISO string
      const expectedDate = expectedResolutionDate
        ? new Date(expectedResolutionDate).toISOString()
        : undefined;
      const complaint = await assignComplaintApi(token, activeComplaint.id, {
        assignedToId: assignee,
        expectedResolutionDate: expectedDate,
      });
      // Update the complaint in the list
      setLiveComplaints((prev) =>
        prev.map((c) => (c.id === complaint.id ? complaint : c))
      );
      const officer = districtOfficers.find((o) => o.id === assignee);
      setLastAction({
        type: "assign",
        detail: officer?.fullName || assignee,
      });
      setAssignmentModal(false);
      setAssignee("");
      setExpectedResolutionDate("");
      // Refresh stats if admin
      if (currentUser?.role === "admin") {
        refreshStats();
      }
    } catch (error) {
      console.error("Failed to assign complaint:", error);
      alert(
        error instanceof Error ? error.message : "Failed to assign complaint"
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleEscalate = async () => {
    if (!token || !activeComplaint || !targetAdmin || !escalationReason) return;
    setEscalating(true);
    try {
      const complaint = await escalateComplaintApi(token, activeComplaint.id, {
        assignedToId: targetAdmin,
        escalationReason: escalationReason,
      });
      // Update the complaint in the list
      setLiveComplaints((prev) =>
        prev.map((c) => (c.id === complaint.id ? complaint : c))
      );
      const admin = admins.find((a) => a.id === targetAdmin);
      setLastAction({
        type: "escalate",
        detail: admin?.fullName || targetAdmin,
      });
      setEscalationModal(false);
      setTargetAdmin("");
      setEscalationReason("");
      // Refresh stats
      if (currentUser?.role === "admin") {
        refreshStats();
      }
    } catch (error) {
      console.error("Failed to escalate complaint:", error);
      alert(
        error instanceof Error ? error.message : "Failed to escalate complaint"
      );
    } finally {
      setEscalating(false);
    }
  };

  const getStatusLabel = (status?: ApiComplaint["status"] | null) => {
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

  const getFriendlyStatusUpdateError = (error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Failed to update status";
    const normalized = message.toLowerCase().replace(/\s+/g, "");
    if (normalized.includes("cannotchangeunassignedcomplaint")) {
      return "You can’t change the status until the case is assigned. Assign it first.";
    }
    return message;
  };

  const handleUpdateStatus = async (
    complaintId: string,
    newStatus: ApiComplaint["status"]
  ) => {
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
        message: "You can’t change the status until the case is assigned.",
      });
      return;
    }

    if (current.status === newStatus) return;

    const previousStatus = current.status;
    setStatusUpdatingId(complaintId);
    setStatusUpdateFeedback(null);

    // Optimistic UI update so the user sees immediate feedback.
    setLiveComplaints((prev) =>
      prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
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
        refreshStats();
      }
    } catch (error) {
      // Roll back optimistic update.
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
  };

  const handleLogout = () => {
    clearAuth();
    router.replace("/");
  };

  const handleComplaintSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setComplaintSubmitting(true);
    setComplaintStatus(null);
    setComplaintsError(null);
    try {
      // Use defaults for general mode, actual values for detailed mode
      const isDetailed = complaintForm.complaintType === "detailed";

      const result = await submitComplaintApi(token, {
        // PWD Personal Information
        fullName: isDetailed ? complaintForm.fullName : "Anonymous",
        age: isDetailed ? parseInt(complaintForm.age) || 18 : 18,
        gender: isDetailed ? complaintForm.gender : "other",
        primaryDisabilityCategory: isDetailed
          ? complaintForm.primaryDisabilityCategory
          : undefined,
        otherDisability: complaintForm.otherDisability || undefined,
        assistiveDevice: isDetailed ? complaintForm.assistiveDevice : "none",
        otherAssistiveDevice: complaintForm.otherAssistiveDevice || undefined,
        // Contact Information
        phoneNumber: complaintForm.phoneNumber,
        caregiverPhoneNumber: isDetailed
          ? complaintForm.caregiverPhoneNumber || undefined
          : undefined,
        language: isDetailed ? complaintForm.language : "english",
        // Issue Classification
        category: complaintForm.category,
        otherCategory: complaintForm.otherCategory || undefined,
        issueTypes: isDetailed ? complaintForm.issueTypes : undefined,
        otherIssueType: complaintForm.otherIssueType || undefined,
        // Request Information
        requestType: isDetailed ? complaintForm.requestType : undefined,
        requestDescription: complaintForm.requestDescription || undefined,
        otherRequest: complaintForm.otherRequest || undefined,
        // Location & Details
        district: complaintForm.district,
        description: complaintForm.description,
      });

      // Refresh complaints list after submission
      await refreshComplaints();

      setComplaintForm({
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
      });
      setComplaintStatus(
        `Complaint submitted successfully. Code: ${result.code}`
      );

      // Close modal after 2 seconds
      setTimeout(() => {
        setNewCaseModal(false);
        setComplaintStatus(null);
      }, 2000);
    } catch (error) {
      setComplaintStatus(null);
      setComplaintsError(
        error instanceof Error ? error.message : "Failed to submit complaint"
      );
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const formatComplaintStatus = (status: ApiComplaint["status"]): string => {
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

  const getStatusSelectClassName = (status: ApiComplaint["status"]) => {
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

  const formatComplaintDate = (date: string) =>
    new Date(date).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const escalatedToMe = useMemo(() => {
    if (!currentUser || currentUser.role !== "admin") return [];
    return liveComplaints.filter(
      (c) => c.status === "escalated" && c.assignedToId === currentUser.id
    );
  }, [liveComplaints, currentUser]);

  const filteredComplaints = useMemo(() => {
    // For navigators: backend already filters complaints by district
    // TODO: Once backend adds createdById tracking, filter to show only complaints created by this navigator
    // For now, navigators see all complaints from their district (backend filtering)

    // For district officers: show only complaints assigned to them
    let complaints = liveComplaints;
    if (currentUser?.role === "district_officer") {
      complaints = liveComplaints.filter((c) => {
        if (c.assignedToId !== currentUser.id) return false;
        // Some backends may omit district on the user; only enforce if available.
        if (
          currentUser.district &&
          c.district &&
          c.district !== currentUser.district
        )
          return false;
        return true;
      });
    }

    // Then apply status filter
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

  const handleSelect = (id: string) => {
    setSelectedCase(id);
    setLastAction(null);
    setStatusUpdateFeedback(null);
    setAssignmentModal(false);
    setEscalationModal(false);
    setAssignee("");
    setExpectedResolutionDate("");
    setTargetAdmin("");
    setEscalationReason("");
  };

  const closeCaseDetailsModal = () => {
    setSelectedCase(null);
    setLastAction(null);
    setStatusUpdateFeedback(null);
    setAssignmentModal(false);
    setEscalationModal(false);
    setAssignee("");
    setExpectedResolutionDate("");
    setTargetAdmin("");
    setEscalationReason("");
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Checking session…</p>
      </div>
    );
  }

  if (!token || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Redirecting to sign in…</p>
      </div>
    );
  }

  const isAdmin = currentUser.role === "admin";
  const isNavigator = currentUser.role === "navigator";
  const isDistrictOfficer = currentUser.role === "district_officer";

  const mainMenuHint =
    activePath === "report"
      ? "Input: 1 (Report a problem)"
      : activePath === "info"
      ? "Input: 2 (Ask for info)"
      : "Input: 3 (Speak to a Navigator)";

  const baseFlow = [
    {
      level: "L0",
      title: "District selection",
      prompt:
        "Welcome to Dial4Inclusion! Select your District:\n1. Ablekuma Central\n2. Obuasi Municipal\n3. Upper Denkyira East",
      userAction: "Input: 2",
      rationale: "Fast routing. User only needs district number.",
    },
    {
      level: "L1",
      title: "Main menu",
      prompt:
        "How can we help PWDs in Obuasi?\n1. Report a problem\n2. Ask for info\n3. Speak to a Navigator",
      userAction: "",
      rationale: "Clear choices, option 3 hands off to human quickly.",
    },
  ];

  const paths = {
    report: [
      {
        level: "L2",
        title: "Issue & details",
        prompt:
          "Select the main issue:\n1. Disability Fund Delay\n2. Inaccessible Building\n3. Discrimination / Abuse\n4. Other Service Issue\nThen type brief details (50 chars).",
        userAction: "Input: 2 and detail (e.g., No ramp at health center).",
        rationale:
          "Combines category selection + short context to keep flow efficient.",
      },
      {
        level: "L3",
        title: "Confirmation",
        prompt:
          "Thank you! Report logged (ID: [XXXX]). A Navigator may call you back.",
        userAction: "Session ends",
        rationale: "Positive feedback that report succeeded.",
      },
    ],
    info: [
      {
        level: "L2",
        title: "Select topic",
        prompt:
          "Choose a frequently asked question:\n1. Timeline for resolution\n2. Any fees involved?\n3. Who follows up after I report?",
        userAction: "Input: 1, 2, or 3",
        rationale: "Keeps the info menu short and memorable for USSD users.",
      },
      {
        level: "L3",
        title: "Share answer + next step",
        prompt:
          "Display the answer for the selected topic.\nOffer option: 'Press 1 to speak to a Navigator if you still need help.'",
        userAction: "Input: 1 to connect with Navigator or 0 to end session",
        rationale: "Allows user to transition to human support seamlessly.",
      },
    ],
    navigator: [
      {
        level: "L2",
        title: "Navigator connect",
        prompt:
          "You selected Speak to a Navigator. We will call you back within 15 minutes. Press 1 to confirm.",
        userAction: "Input: 1",
        rationale: "Reduces anxiety; call comes to the user.",
      },
      {
        level: "L3",
        title: "Call-back trigger",
        prompt: "Confirmed! Please ensure your line is open. Thank you.",
        userAction: "Session ends",
        rationale: "Back-end triggers call from local Civic Navigator.",
      },
    ],
  };

  const renderUssdFlow = (options?: { compact?: boolean }) => (
    <div className="space-y-6">
      {!options?.compact && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            USSD Flow Reference
          </h2>
          <p className="text-gray-600">
            Interactive guide for Navigator training
          </p>
        </div>
      )}

      {/* Case Details Modal */}
      {selectedCase && activeComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeCaseDetailsModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  Case Details
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeComplaint.id}
                </h2>
              </div>
              <button
                onClick={closeCaseDetailsModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Phone Number
                </p>
                <p className="text-gray-900">{activeComplaint.phoneNumber}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  District
                </p>
                <p className="text-gray-700">
                  {activeComplaint.district
                    ?.replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Category
                </p>
                <p className="text-gray-700">
                  {activeComplaint.category
                    ?.replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                </p>
              </div>

              {activeComplaint.fullName && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Full Name
                  </p>
                  <p className="text-gray-700">{activeComplaint.fullName}</p>
                </div>
              )}

              {activeComplaint.age && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Age
                  </p>
                  <p className="text-gray-700">{activeComplaint.age}</p>
                </div>
              )}

              {activeComplaint.gender && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Gender
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.gender.charAt(0).toUpperCase() +
                      activeComplaint.gender.slice(1)}
                  </p>
                </div>
              )}

              {activeComplaint.primaryDisabilityCategory && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Disability Category
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.primaryDisabilityCategory
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    {activeComplaint.otherDisability &&
                      `: ${activeComplaint.otherDisability}`}
                  </p>
                </div>
              )}

              {activeComplaint.assistiveDevice && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Assistive Device
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.assistiveDevice
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    {activeComplaint.otherAssistiveDevice &&
                      `: ${activeComplaint.otherAssistiveDevice}`}
                  </p>
                </div>
              )}

              {activeComplaint.caregiverPhoneNumber && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Caregiver Phone
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.caregiverPhoneNumber}
                  </p>
                </div>
              )}

              {activeComplaint.language && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Language
                  </p>
                  <p className="text-gray-700">{activeComplaint.language}</p>
                </div>
              )}

              {activeComplaint.issueTypes &&
                activeComplaint.issueTypes.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Issue Types
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeComplaint.issueTypes.map((type) => (
                        <span
                          key={type}
                          className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                        >
                          {type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                    {activeComplaint.otherIssueType && (
                      <p className="text-sm text-gray-600 mt-1">
                        Other: {activeComplaint.otherIssueType}
                      </p>
                    )}
                  </div>
                )}

              {activeComplaint.requestType && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Request Type
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.requestType
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    {activeComplaint.otherRequest &&
                      `: ${activeComplaint.otherRequest}`}
                  </p>
                </div>
              )}

              {activeComplaint.requestDescription && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Request Details
                  </p>
                  <p className="text-gray-700 whitespace-pre-line">
                    {activeComplaint.requestDescription}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Description
                </p>
                <p className="text-gray-700 whitespace-pre-line">
                  {activeComplaint.description || "No description provided"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Created
                </p>
                <p className="text-gray-700">
                  {formatComplaintDate(activeComplaint.createdAt)}
                </p>
              </div>

              {activeComplaint.assignedToId && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {activeComplaint.status === "escalated"
                      ? "Escalated To"
                      : "Assigned To"}
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.assignedToId === currentUser?.id
                      ? `${currentUser.fullName} (You)`
                      : districtOfficers.find(
                          (d) => d.id === activeComplaint.assignedToId
                        )?.fullName ||
                        navigators.find(
                          (n) => n.id === activeComplaint.assignedToId
                        )?.fullName ||
                        admins.find(
                          (a) => a.id === activeComplaint.assignedToId
                        )?.fullName ||
                        activeComplaint.assignedTo?.fullName ||
                        "Unassigned"}
                  </p>
                </div>
              )}

              {activeComplaint.expectedResolutionDate && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Expected Resolution
                  </p>
                  <p className="text-gray-700">
                    {formatComplaintDate(
                      activeComplaint.expectedResolutionDate
                    )}
                  </p>
                </div>
              )}

              {activeComplaint.status === "escalated" &&
                activeComplaint.escalationReason && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Escalation Reason
                    </p>
                    <p className="text-gray-700 whitespace-pre-line">
                      {activeComplaint.escalationReason}
                    </p>
                  </div>
                )}

              {lastAction && (
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  {lastAction.type === "assign"
                    ? `Assigned to ${lastAction.detail}`
                    : `Escalated to ${lastAction.detail}`}
                </div>
              )}

              {statusUpdateFeedback && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    statusUpdateFeedback.kind === "success"
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {statusUpdateFeedback.message}
                </div>
              )}

              {statusUpdatingId === activeComplaint.id && (
                <div className="text-xs text-gray-500">Updating status…</div>
              )}

              {statusUpdateFeedback && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    statusUpdateFeedback.kind === "success"
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {statusUpdateFeedback.message}
                </div>
              )}

              {statusUpdatingId === activeComplaint.id && (
                <div className="text-xs text-gray-500">Updating status…</div>
              )}

              <div className="space-y-3 pt-4">
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      onClick={handleOpenAssignmentModal}
                    >
                      Assign
                    </button>
                    {activeComplaint.status !== "resolved" && (
                      <button
                        className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        onClick={handleOpenEscalationModal}
                      >
                        Escalate
                      </button>
                    )}
                  </div>
                )}
                {isDistrictOfficer && activeComplaint.status !== "resolved" && (
                  <button
                    className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    onClick={handleOpenEscalationModal}
                  >
                    Escalate to Admin
                  </button>
                )}
                {(isAdmin || isDistrictOfficer) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Update Status
                    </label>
                    <select
                      className={getStatusSelectClassName(
                        activeComplaint.status
                      )}
                      value={activeComplaint.status}
                      disabled={statusUpdatingId === activeComplaint.id}
                      onChange={(e) => {
                        const newStatus = e.target
                          .value as ApiComplaint["status"];
                        handleUpdateStatus(activeComplaint.id, newStatus);
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { id: "report", label: "Path 1: Report Problem" },
          { id: "info", label: "Path 2: Ask for Info" },
          { id: "navigator", label: "Path 3: Speak to Navigator" },
        ].map((path) => (
          <button
            key={path.id}
            onClick={() =>
              setActivePath(path.id as "report" | "info" | "navigator")
            }
            className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
              activePath === path.id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {path.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Entry Flow</h3>
          <div className="space-y-4">
            {baseFlow.map((step, index) => (
              <div key={step.level} className="rounded-lg bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {step.title}
                  </span>
                </div>
                <p className="mb-2 whitespace-pre-line text-sm text-gray-700">
                  {step.prompt}
                </p>
                <p className="text-xs font-semibold text-blue-600">
                  {step.level === "L1" ? mainMenuHint : step.userAction}
                </p>
                <p className="text-xs text-gray-500">{step.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">
            {activePath === "report"
              ? "Report Problem Flow"
              : activePath === "info"
              ? "Ask for Info Flow"
              : "Navigator Connection Flow"}
          </h3>
          <div className="space-y-4">
            {paths[activePath].map((step, index) => (
              <div key={step.level} className="rounded-lg bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                    {index + 3}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {step.title}
                  </span>
                </div>
                <p className="mb-2 whitespace-pre-line text-sm text-gray-700">
                  {step.prompt}
                </p>
                <p className="text-xs font-semibold text-green-600">
                  {step.userAction}
                </p>
                <p className="text-xs text-gray-500">{step.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "cases":
        return (
          <div className="space-y-6">
            {/* Escalations Section - Only for admins */}
            {isAdmin && escalatedToMe.length > 0 && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-red-900">
                      Escalations
                    </h2>
                    <p className="text-sm text-red-700">
                      {escalatedToMe.length} case
                      {escalatedToMe.length !== 1 ? "s" : ""} escalated to you
                    </p>
                  </div>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                    {escalatedToMe.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {escalatedToMe.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="rounded-lg border border-red-200 bg-white p-4 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleSelect(complaint.id)}
                        >
                          <p className="font-semibold text-gray-900">
                            {complaint.category
                              ?.replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                              "Complaint"}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {complaint.phoneNumber} -{" "}
                            {complaint.district?.replace(/_/g, " ")}
                          </p>
                          {complaint.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                              {complaint.description}
                            </p>
                          )}
                          {complaint.escalationReason && (
                            <p className="text-xs text-red-700 mt-1 italic">
                              Reason: {complaint.escalationReason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            className={getStatusSelectClassName(
                              complaint.status
                            )}
                            value={complaint.status}
                            disabled={statusUpdatingId === complaint.id}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newStatus = e.target
                                .value as ApiComplaint["status"];
                              handleUpdateStatus(complaint.id, newStatus);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="escalated">Escalated</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              {/* Cases Table */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="font-semibold text-gray-900">Active Cases</h3>
                  <p className="text-sm text-gray-600">
                    {filteredComplaints.length} cases showing
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Click a case row to open details.
                  </p>
                </div>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          District
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredComplaints.map((c) => (
                        <tr
                          key={c.id}
                          className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedCase === c.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleSelect(c.id)}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {c.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {c.district
                              ?.replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                              "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {c.category
                              ?.replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                              "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                c.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : c.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : c.status === "escalated"
                                  ? "bg-red-100 text-red-800"
                                  : c.status === "resolved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {formatComplaintStatus(c.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case "monitoring":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Monitoring Dashboard
              </h2>
              <p className="text-gray-600">
                Track performance metrics and alerts
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {monitoringMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {metric.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metric.value}
                      </p>
                    </div>
                    <div
                      className={`rounded-full p-3 ${
                        metric.color === "blue"
                          ? "bg-blue-100"
                          : metric.color === "green"
                          ? "bg-green-100"
                          : metric.color === "purple"
                          ? "bg-purple-100"
                          : "bg-red-100"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 ${
                          metric.color === "blue"
                            ? "bg-blue-500"
                            : metric.color === "green"
                            ? "bg-green-500"
                            : metric.color === "purple"
                            ? "bg-purple-500"
                            : "bg-red-500"
                        } rounded`}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span
                      className={`text-sm font-semibold ${
                        metric.color === "green"
                          ? "text-green-600"
                          : metric.color === "red"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {metric.change}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      vs last week
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Alerts Section */}
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Active Alerts
                    </h3>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                      {overdueComplaints.length} overdue
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200 max-h-96 overflow-auto">
                  {overdueComplaints.length === 0 && (
                    <p className="px-6 py-4 text-sm text-gray-600">
                      No overdue cases.
                    </p>
                  )}
                  {overdueComplaints.map((complaint) => (
                    <div key={complaint.id} className="p-6">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Case {complaint.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-700">
                          {complaint.category
                            ?.replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Expected:{" "}
                          {complaint.expectedResolutionDate
                            ? formatComplaintDate(
                                complaint.expectedResolutionDate
                              )
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

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Navigator Updates
                </h3>
                {navigatorUpdates.length === 0 && (
                  <p className="text-sm text-gray-600">
                    No navigator updates yet.
                  </p>
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
                          {formatComplaintStatus(
                            update.oldStatus as ApiComplaint["status"]
                          )}
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
                          {formatComplaintStatus(
                            update.newStatus as ApiComplaint["status"]
                          )}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {formatComplaintDate(update.updatedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "ussd":
        return renderUssdFlow();

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Dial4Inclusion
              </h1>
              <p className="text-sm text-gray-600">PWD Response Dashboard</p>
            </div>
            {(isAdmin || isNavigator) && (
              <div className="flex rounded-lg bg-gray-100 p-1">
                {(isAdmin
                  ? tabs
                  : tabs.filter((t) => t.id !== "monitoring")
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {(isAdmin || isNavigator) && !isDistrictOfficer && (
              <button
                onClick={() => setNewCaseModal(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + New Case
              </button>
            )}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {currentUser.fullName.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden text-left text-xs leading-tight text-gray-600 sm:block">
                  {currentUser.fullName}
                </span>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-60 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-xl">
                  <p className="font-semibold text-gray-900">
                    {currentUser.fullName}
                  </p>
                  <p className="text-xs text-gray-600">{currentUser.email}</p>
                  <p className="text-xs capitalize text-gray-500">
                    Role: {currentUser.role}
                  </p>
                  <button
                    className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      refreshComplaints();
                      setProfileMenuOpen(false);
                    }}
                    disabled={complaintsLoading}
                  >
                    {complaintsLoading ? "Syncing…" : "Sync latest"}
                  </button>
                  <button
                    className="mt-2 w-full rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800"
                    onClick={handleLogout}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{renderTabContent()}</main>

      {/* New Case Modal */}
      {newCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Submit New Complaint
              </h2>
              <button
                onClick={() => {
                  setNewCaseModal(false);
                  setComplaintStatus(null);
                  setComplaintsError(null);
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              {/* Complaint Type Selector */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-semibold text-blue-900 mb-3">
                  Select submission type:
                </p>
                <div className="flex gap-3">
                  <label
                    className={`flex-1 cursor-pointer rounded-lg border-2 p-3 transition-all ${
                      complaintForm.complaintType === "general"
                        ? "border-blue-600 bg-blue-100"
                        : "border-gray-300 bg-white hover:border-blue-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="complaintType"
                      value="general"
                      checked={complaintForm.complaintType === "general"}
                      onChange={(e) =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          complaintType: e.target.value as
                            | "general"
                            | "detailed",
                        }))
                      }
                      className="sr-only"
                    />
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">
                        General Report
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Basic information only
                      </p>
                    </div>
                  </label>
                  <label
                    className={`flex-1 cursor-pointer rounded-lg border-2 p-3 transition-all ${
                      complaintForm.complaintType === "detailed"
                        ? "border-blue-600 bg-blue-100"
                        : "border-gray-300 bg-white hover:border-blue-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="complaintType"
                      value="detailed"
                      checked={complaintForm.complaintType === "detailed"}
                      onChange={(e) =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          complaintType: e.target.value as
                            | "general"
                            | "detailed",
                        }))
                      }
                      className="sr-only"
                    />
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">
                        Detailed Report
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Full information with personal details
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Contact Information - Always required */}
              <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">
                  Contact Information
                </h3>

                <label className="block space-y-1">
                  <span className="text-sm font-medium text-gray-700">
                    Phone Number *
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="+233551234567"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={complaintForm.phoneNumber}
                    onChange={(e) =>
                      setComplaintForm((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {/* Additional Personal Information - Only for detailed */}
              {complaintForm.complaintType === "detailed" && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900">
                    Additional Personal Details
                  </h3>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Full Name *
                    </span>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={complaintForm.fullName}
                      onChange={(e) =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-gray-700">
                        Age *
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        max="150"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={complaintForm.age}
                        onChange={(e) =>
                          setComplaintForm((prev) => ({
                            ...prev,
                            age: e.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-gray-700">
                        Gender *
                      </span>
                      <select
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={complaintForm.gender}
                        onChange={(e) =>
                          setComplaintForm((prev) => ({
                            ...prev,
                            gender: e.target.value,
                          }))
                        }
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Primary Disability Category *
                    </span>
                    <select
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={complaintForm.primaryDisabilityCategory}
                      onChange={(e) =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          primaryDisabilityCategory: e.target.value,
                        }))
                      }
                    >
                      <option value="">Choose category</option>
                      <option value="visual_impairment">
                        Visual Impairment
                      </option>
                      <option value="hearing_impairment">
                        Hearing Impairment
                      </option>
                      <option value="physical_disability">
                        Physical Disability
                      </option>
                      <option value="intellectual_disability">
                        Intellectual Disability
                      </option>
                      <option value="psychosocial_disability">
                        Psychosocial Disability
                      </option>
                      <option value="speech_impairment">
                        Speech Impairment
                      </option>
                      <option value="multiple_disabilities">
                        Multiple Disabilities
                      </option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  {complaintForm.primaryDisabilityCategory === "other" && (
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-gray-700">
                        Specify Other Disability *
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Please specify the disability"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={complaintForm.otherDisability}
                        onChange={(e) =>
                          setComplaintForm((prev) => ({
                            ...prev,
                            otherDisability: e.target.value,
                          }))
                        }
                      />
                    </label>
                  )}

                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Caregiver Phone (Optional)
                    </span>
                    <input
                      type="tel"
                      placeholder="+233551234567"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={complaintForm.caregiverPhoneNumber}
                      onChange={(e) =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          caregiverPhoneNumber: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Language *
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g., English, Twi, Ga"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={complaintForm.language}
                      onChange={(e) =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              )}

              {/* Complaint Details */}
              <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">
                  Complaint Details
                </h3>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      District *
                    </span>
                    <select
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={complaintForm.district}
                      onChange={(e) =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          district: e.target.value,
                        }))
                      }
                    >
                      <option value="">Choose district</option>
                      <option value="ablekuma_central">Ablekuma Central</option>
                      <option value="obuasi_municipal">Obuasi Municipal</option>
                      <option value="upper_denkyira_east">
                        Upper Denkyira East
                      </option>
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Category *
                    </span>
                    <select
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={complaintForm.category}
                      onChange={(e) =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                    >
                      <option value="">Choose category</option>
                      <option value="disability_fund_delay">
                        Disability Fund Delay
                      </option>
                      <option value="inaccessible_building">
                        Inaccessible Building
                      </option>
                      <option value="discrimination_abuse">
                        Discrimination / Abuse
                      </option>
                      <option value="other_issue">Other Issue</option>
                    </select>
                  </label>
                </div>

                {complaintForm.complaintType === "detailed" && (
                  <>
                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-gray-700">
                        Assistive Device Used *
                      </span>
                      <select
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={complaintForm.assistiveDevice}
                        onChange={(e) =>
                          setComplaintForm((prev) => ({
                            ...prev,
                            assistiveDevice: e.target.value,
                          }))
                        }
                      >
                        <option value="">Choose device</option>
                        <option value="none">None</option>
                        <option value="white_cane">White Cane</option>
                        <option value="wheelchair">Wheelchair</option>
                        <option value="crutches">Crutches</option>
                        <option value="hearing_aid">Hearing Aid</option>
                        <option value="braille_device">Braille Device</option>
                        <option value="other">Other</option>
                      </select>
                    </label>

                    {complaintForm.assistiveDevice === "other" && (
                      <label className="block space-y-1">
                        <span className="text-sm font-medium text-gray-700">
                          Specify Other Device *
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Please specify the assistive device"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          value={complaintForm.otherAssistiveDevice}
                          onChange={(e) =>
                            setComplaintForm((prev) => ({
                              ...prev,
                              otherAssistiveDevice: e.target.value,
                            }))
                          }
                        />
                      </label>
                    )}

                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-gray-700">
                        Request Type *
                      </span>
                      <select
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={complaintForm.requestType}
                        onChange={(e) =>
                          setComplaintForm((prev) => ({
                            ...prev,
                            requestType: e.target.value,
                          }))
                        }
                      >
                        <option value="">Choose request type</option>
                        <option value="assistive_device_support">
                          Assistive Device Support
                        </option>
                        <option value="health_rehabilitation">
                          Health / Rehabilitation Support
                        </option>
                        <option value="mental_health_counselling">
                          Mental Health Counselling
                        </option>
                        <option value="financial_assistance">
                          Financial Assistance
                        </option>
                        <option value="legal_social_welfare">
                          Legal / Social Welfare Support
                        </option>
                        <option value="education_training">
                          Education / Training
                        </option>
                        <option value="accessibility_improvement">
                          Accessibility Improvement
                        </option>
                        <option value="employment_skills">
                          Employment / Skills Support
                        </option>
                        <option value="community_inclusion">
                          Community Inclusion
                        </option>
                        <option value="documentation_help">
                          Documentation Help (NHIS, Ghana Card)
                        </option>
                        <option value="transportation_assistance">
                          Transportation Assistance
                        </option>
                        <option value="other">Other</option>
                      </select>
                    </label>

                    {complaintForm.requestType === "other" && (
                      <label className="block space-y-1">
                        <span className="text-sm font-medium text-gray-700">
                          Specify Other Request *
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Please specify the request type"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          value={complaintForm.otherRequest}
                          onChange={(e) =>
                            setComplaintForm((prev) => ({
                              ...prev,
                              otherRequest: e.target.value,
                            }))
                          }
                        />
                      </label>
                    )}

                    <label className="block space-y-1">
                      <span className="text-sm font-medium text-gray-700">
                        What exactly is the person requesting? (Optional)
                      </span>
                      <textarea
                        rows={3}
                        placeholder="Provide specific details about what the PWD is requesting..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={complaintForm.requestDescription}
                        onChange={(e) =>
                          setComplaintForm((prev) => ({
                            ...prev,
                            requestDescription: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </>
                )}

                {complaintForm.complaintType === "detailed" && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">
                      Issue Types * (select all that apply)
                    </span>
                    <div className="grid gap-2 md:grid-cols-2">
                      {[
                        {
                          value: "access_to_healthcare",
                          label: "Access to Healthcare",
                        },
                        {
                          value: "access_to_mental_health",
                          label: "Access to Mental Health Support",
                        },
                        {
                          value: "discrimination_stigma",
                          label: "Discrimination or Stigma",
                        },
                        {
                          value: "physical_accessibility",
                          label: "Physical Accessibility Challenge",
                        },
                        { value: "education_issue", label: "Education Issue" },
                        {
                          value: "employment_livelihood",
                          label: "Employment / Livelihood",
                        },
                        {
                          value: "social_protection",
                          label: "Social Protection (LEAP, Disability Fund)",
                        },
                        {
                          value: "assistive_device_need",
                          label: "Assistive Device Need",
                        },
                        {
                          value: "gbv_safety_concern",
                          label: "Gender-Based Violence / Safety",
                        },
                        {
                          value: "legal_human_rights",
                          label: "Legal / Human Rights Issue",
                        },
                        {
                          value: "community_participation",
                          label: "Community Participation Barrier",
                        },
                        {
                          value: "lack_of_documentation",
                          label: "Lack of Documentation",
                        },
                        { value: "other", label: "Other" },
                      ].map((issue) => (
                        <label
                          key={issue.value}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={complaintForm.issueTypes.includes(
                              issue.value
                            )}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setComplaintForm((prev) => ({
                                ...prev,
                                issueTypes: checked
                                  ? [...prev.issueTypes, issue.value]
                                  : prev.issueTypes.filter(
                                      (t) => t !== issue.value
                                    ),
                              }));
                            }}
                          />
                          <span className="text-sm text-gray-700">
                            {issue.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    {complaintForm.issueTypes.includes("other") && (
                      <input
                        type="text"
                        required
                        placeholder="Please specify other issue type"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none mt-2"
                        value={complaintForm.otherIssueType}
                        onChange={(e) =>
                          setComplaintForm((prev) => ({
                            ...prev,
                            otherIssueType: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                )}

                <label className="block space-y-1">
                  <span className="text-sm font-medium text-gray-700">
                    Description
                  </span>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    rows={3}
                    value={complaintForm.description}
                    onChange={(e) =>
                      setComplaintForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {complaintStatus && (
                <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  {complaintStatus}
                </p>
              )}
              {complaintsError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {complaintsError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNewCaseModal(false);
                    setComplaintStatus(null);
                    setComplaintsError(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={complaintSubmitting}
                >
                  {complaintSubmitting ? "Submitting..." : "Submit Complaint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {assignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              Assign Complaint
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Assign to District Officer
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
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
                  Expected Resolution Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={expectedResolutionDate}
                  onChange={(e) => setExpectedResolutionDate(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setAssignmentModal(false);
                    setAssignee("");
                    setExpectedResolutionDate("");
                  }}
                  disabled={assigning}
                >
                  Cancel
                </button>
                <button
                  disabled={!assignee || assigning}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  onClick={handleAssign}
                >
                  {assigning ? "Assigning..." : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {escalationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              Escalate Complaint
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Escalate to Admin
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={targetAdmin}
                  onChange={(e) => setTargetAdmin(e.target.value)}
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
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Escalation Reason
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  rows={4}
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="Explain why this complaint needs escalation..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setEscalationModal(false);
                    setTargetAdmin("");
                    setEscalationReason("");
                  }}
                  disabled={escalating}
                >
                  Cancel
                </button>
                <button
                  disabled={!targetAdmin || !escalationReason || escalating}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                  onClick={handleEscalate}
                >
                  {escalating ? "Escalating..." : "Escalate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Details Modal */}
      {selectedCase && activeComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeCaseDetailsModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  Case Details
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeComplaint.id}
                </h2>
              </div>
              <button
                onClick={closeCaseDetailsModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Phone Number
                </p>
                <p className="text-gray-900">{activeComplaint.phoneNumber}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  District
                </p>
                <p className="text-gray-700">
                  {activeComplaint.district
                    ?.replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Category
                </p>
                <p className="text-gray-700">
                  {activeComplaint.category
                    ?.replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A"}
                </p>
              </div>

              {activeComplaint.fullName && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Full Name
                  </p>
                  <p className="text-gray-700">{activeComplaint.fullName}</p>
                </div>
              )}

              {activeComplaint.age && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Age
                  </p>
                  <p className="text-gray-700">{activeComplaint.age}</p>
                </div>
              )}

              {activeComplaint.gender && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Gender
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.gender.charAt(0).toUpperCase() +
                      activeComplaint.gender.slice(1)}
                  </p>
                </div>
              )}

              {activeComplaint.primaryDisabilityCategory && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Disability Category
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.primaryDisabilityCategory
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    {activeComplaint.otherDisability &&
                      `: ${activeComplaint.otherDisability}`}
                  </p>
                </div>
              )}

              {activeComplaint.assistiveDevice && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Assistive Device
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.assistiveDevice
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    {activeComplaint.otherAssistiveDevice &&
                      `: ${activeComplaint.otherAssistiveDevice}`}
                  </p>
                </div>
              )}

              {activeComplaint.caregiverPhoneNumber && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Caregiver Phone
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.caregiverPhoneNumber}
                  </p>
                </div>
              )}

              {activeComplaint.language && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Language
                  </p>
                  <p className="text-gray-700">{activeComplaint.language}</p>
                </div>
              )}

              {activeComplaint.issueTypes &&
                activeComplaint.issueTypes.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Issue Types
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {activeComplaint.issueTypes.map((type) => (
                        <span
                          key={type}
                          className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                        >
                          {type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                    {activeComplaint.otherIssueType && (
                      <p className="mt-1 text-sm text-gray-600">
                        Other: {activeComplaint.otherIssueType}
                      </p>
                    )}
                  </div>
                )}

              {activeComplaint.requestType && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Request Type
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.requestType
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    {activeComplaint.otherRequest &&
                      `: ${activeComplaint.otherRequest}`}
                  </p>
                </div>
              )}

              {activeComplaint.requestDescription && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Request Details
                  </p>
                  <p className="whitespace-pre-line text-gray-700">
                    {activeComplaint.requestDescription}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Description
                </p>
                <p className="whitespace-pre-line text-gray-700">
                  {activeComplaint.description || "No description provided"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Created
                </p>
                <p className="text-gray-700">
                  {formatComplaintDate(activeComplaint.createdAt)}
                </p>
              </div>

              {activeComplaint.assignedToId && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {activeComplaint.status === "escalated"
                      ? "Escalated To"
                      : "Assigned To"}
                  </p>
                  <p className="text-gray-700">
                    {activeComplaint.assignedToId === currentUser?.id
                      ? `${currentUser.fullName} (You)`
                      : districtOfficers.find(
                          (d) => d.id === activeComplaint.assignedToId
                        )?.fullName ||
                        navigators.find(
                          (n) => n.id === activeComplaint.assignedToId
                        )?.fullName ||
                        admins.find(
                          (a) => a.id === activeComplaint.assignedToId
                        )?.fullName ||
                        activeComplaint.assignedTo?.fullName ||
                        "Unassigned"}
                  </p>
                </div>
              )}

              {activeComplaint.expectedResolutionDate && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Expected Resolution
                  </p>
                  <p className="text-gray-700">
                    {formatComplaintDate(
                      activeComplaint.expectedResolutionDate
                    )}
                  </p>
                </div>
              )}

              {activeComplaint.status === "escalated" &&
                activeComplaint.escalationReason && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Escalation Reason
                    </p>
                    <p className="whitespace-pre-line text-gray-700">
                      {activeComplaint.escalationReason}
                    </p>
                  </div>
                )}

              {lastAction && (
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  {lastAction.type === "assign"
                    ? `Assigned to ${lastAction.detail}`
                    : `Escalated to ${lastAction.detail}`}
                </div>
              )}

              {statusUpdateFeedback && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    statusUpdateFeedback.kind === "success"
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {statusUpdateFeedback.message}
                </div>
              )}

              {statusUpdatingId === activeComplaint.id && (
                <div className="text-xs text-gray-500">Updating status…</div>
              )}

              <div className="space-y-3 pt-4">
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      onClick={handleOpenAssignmentModal}
                    >
                      Assign
                    </button>
                    {activeComplaint.status !== "resolved" && (
                      <button
                        className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        onClick={handleOpenEscalationModal}
                      >
                        Escalate
                      </button>
                    )}
                  </div>
                )}
                {isDistrictOfficer ? (
                  <div className="flex items-end gap-3">
                    {activeComplaint.status !== "resolved" && (
                      <button
                        className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        onClick={handleOpenEscalationModal}
                      >
                        Escalate to Admin
                      </button>
                    )}
                    <div className="flex-1">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Update Status
                      </label>
                      <select
                        className={getStatusSelectClassName(
                          activeComplaint.status
                        )}
                        value={activeComplaint.status}
                        disabled={statusUpdatingId === activeComplaint.id}
                        onChange={(e) => {
                          const newStatus = e.target
                            .value as ApiComplaint["status"];
                          handleUpdateStatus(activeComplaint.id, newStatus);
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  (isAdmin || isDistrictOfficer) && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Update Status
                      </label>
                      <select
                        className={getStatusSelectClassName(
                          activeComplaint.status
                        )}
                        value={activeComplaint.status}
                        disabled={statusUpdatingId === activeComplaint.id}
                        onChange={(e) => {
                          const newStatus = e.target
                            .value as ApiComplaint["status"];
                          handleUpdateStatus(activeComplaint.id, newStatus);
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
