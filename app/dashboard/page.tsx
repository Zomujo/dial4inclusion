"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  assignComplaint as assignComplaintApi,
  escalateComplaint as escalateComplaintApi,
  getAdmins,
  getComplaintStats,
  getComplaints,
  getNavigatorUpdates,
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
    assistiveDevice: "none",
    issueTypes: [] as string[],
    requestType: "",
    gender: "male",
    language: "english",
    description: "",
    otherCategory: "",
    otherAssistiveDevice: "",
    otherIssueType: "",
    otherRequest: "",
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
  const [assignee, setAssignee] = useState("");
  const [expectedResolutionDate, setExpectedResolutionDate] = useState("");
  const [targetAdmin, setTargetAdmin] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [navigators, setNavigators] = useState<ApiUser[]>([]);
  const [admins, setAdmins] = useState<ApiUser[]>([]);
  const [navigatorsLoading, setNavigatorsLoading] = useState(false);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: "assign" | "escalate";
    detail: string;
  } | null>(null);
  const [webFlowStep, setWebFlowStep] = useState(0);
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

  const refreshComplaints = async () => {
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
  };

  useEffect(() => {
    if (!token) return;
    refreshComplaints();
    if (currentUser?.role === "admin") {
      refreshStats();
      refreshNavigatorUpdates();
      refreshOverdueComplaints();
      // Load navigators and admins for displaying names in case details
      fetchNavigators();
      fetchAdmins();
    }
  }, [token, currentUser?.role]);

  useEffect(() => {
    if (activeTab === "monitoring" && token && currentUser?.role === "admin") {
      refreshNavigatorUpdates();
      refreshOverdueComplaints();
    }
  }, [activeTab, token, currentUser?.role]);

  const refreshStats = async () => {
    if (!token) return;
    try {
      const stats = await getComplaintStats(token);
      setMonitoringStats(stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const refreshNavigatorUpdates = async () => {
    if (!token) return;
    try {
      const updates = await getNavigatorUpdates(token, 10);
      setNavigatorUpdates(updates);
    } catch (error) {
      console.error("Failed to load navigator updates:", error);
    }
  };

  const refreshOverdueComplaints = async () => {
    if (!token) return;
    try {
      const complaints = await getOverdueComplaints(token);
      setOverdueComplaints(complaints);
    } catch (error) {
      console.error("Failed to load overdue complaints:", error);
    }
  };

  const fetchNavigators = async () => {
    if (!token || currentUser?.role !== "admin") return;
    setNavigatorsLoading(true);
    try {
      const response = await getNavigators(token);
      setNavigators(response.rows || []);
    } catch (error) {
      console.error("Failed to load navigators:", error);
    } finally {
      setNavigatorsLoading(false);
    }
  };

  const handleOpenAssignmentModal = () => {
    setAssignmentModal(true);
    if (navigators.length === 0) {
      fetchNavigators();
    }
  };

  const handleOpenEscalationModal = () => {
    setEscalationModal(true);
    if (admins.length === 0) {
      fetchAdmins();
    }
  };

  const fetchAdmins = async () => {
    if (!token || currentUser?.role !== "admin") return;
    setAdminsLoading(true);
    try {
      const response = await getAdmins(token);
      // Include all admins (including current user)
      setAdmins(response.rows || []);
    } catch (error) {
      console.error("Failed to load admins:", error);
    } finally {
      setAdminsLoading(false);
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
      const navigator = navigators.find((n) => n.id === assignee);
      setLastAction({
        type: "assign",
        detail: navigator?.fullName || assignee,
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
      const result = await submitComplaintApi(token, {
        fullName: complaintForm.fullName,
        age: parseInt(complaintForm.age) || 0,
        phoneNumber: complaintForm.phoneNumber,
        caregiverPhoneNumber: complaintForm.caregiverPhoneNumber,
        district: complaintForm.district,
        category: complaintForm.category,
        assistiveDevice: complaintForm.assistiveDevice,
        issueTypes: complaintForm.issueTypes,
        requestType: complaintForm.requestType,
        gender: complaintForm.gender,
        language: complaintForm.language,
        description: complaintForm.description,
        otherCategory: complaintForm.otherCategory || undefined,
        otherAssistiveDevice: complaintForm.otherAssistiveDevice || undefined,
        otherIssueType: complaintForm.otherIssueType || undefined,
        otherRequest: complaintForm.otherRequest || undefined,
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
        assistiveDevice: "none",
        issueTypes: [],
        requestType: "",
        gender: "male",
        language: "english",
        description: "",
        otherCategory: "",
        otherAssistiveDevice: "",
        otherIssueType: "",
        otherRequest: "",
      });
      setComplaintStatus(
        `Complaint submitted successfully. Code: ${result.code}`
      );
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
    if (statusFilter === "All statuses") {
      return liveComplaints;
    }

    const statusMap: Record<string, ApiComplaint["status"]> = {
      Pending: "pending",
      "In Progress": "in_progress",
      Escalated: "escalated",
      Resolved: "resolved",
      Rejected: "rejected",
    };

    const backendStatus = statusMap[statusFilter];
    if (!backendStatus) return liveComplaints;
    return liveComplaints.filter((c) => c.status === backendStatus);
  }, [liveComplaints, statusFilter]);

  const activeComplaint =
    filteredComplaints.find((c) => c.id === selectedCase) ??
    filteredComplaints[0] ??
    null;

  const handleSelect = (id: string) => {
    setSelectedCase(id);
    setLastAction(null);
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

  const renderWebFlowReference = () => {
    const steps = [
      {
        title: "Select district",
        details: "Ablekuma Central • Obuasi Municipal • Upper Denkyira East",
      },
      {
        title: "Choose issue",
        details:
          "Disability Fund Delay, Inaccessible Building, Discrimination / Abuse, Other",
      },
      {
        title: "Describe and confirm",
        details:
          "Share short description, add category, and submit for navigator follow-up",
      },
    ];

    return (
      <div className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="rounded-xl border border-white bg-white p-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {step.title}
                </p>
                <p className="text-xs text-gray-600">{step.details}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                            value={complaint.status}
                            onChange={async (e) => {
                              e.stopPropagation();
                              if (!token) return;
                              const newStatus = e.target
                                .value as ApiComplaint["status"];
                              try {
                                const updated = await updateComplaintStatusApi(
                                  token,
                                  complaint.id,
                                  {
                                    status: newStatus,
                                  }
                                );
                                setLiveComplaints((prev) =>
                                  prev.map((c) =>
                                    c.id === updated.id ? updated : c
                                  )
                                );
                                refreshStats();
                              } catch (error) {
                                console.error(
                                  "Failed to update status:",
                                  error
                                );
                                alert(
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to update status"
                                );
                              }
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
                  {isAdmin ? "Case Management" : "My Assigned Cases"}
                </h2>
                <p className="text-gray-600">
                  {isAdmin
                    ? "Monitor and triage incoming PWD complaints"
                    : "View and manage your assigned cases"}
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

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              {/* Cases Table */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="font-semibold text-gray-900">Active Cases</h3>
                  <p className="text-sm text-gray-600">
                    {filteredComplaints.length} cases showing
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

              {/* Case Details */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Case Details
                </h3>
                {activeComplaint && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Case ID
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {activeComplaint.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Phone Number
                      </p>
                      <p className="text-gray-900">
                        {activeComplaint.phoneNumber}
                      </p>
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
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Description
                      </p>
                      <p className="text-gray-700 whitespace-pre-line">
                        {activeComplaint.description ||
                          "No description provided"}
                      </p>
                    </div>
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
                    {activeComplaint.language && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Language
                        </p>
                        <p className="text-gray-700">
                          {activeComplaint.language}
                        </p>
                      </div>
                    )}
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
                            : "Assigned Navigator"}
                        </p>
                        <p className="text-gray-700">
                          {navigators.find(
                            (n) => n.id === activeComplaint.assignedToId
                          )?.fullName ||
                            admins.find(
                              (a) => a.id === activeComplaint.assignedToId
                            )?.fullName ||
                            activeComplaint.assignedTo?.fullName ||
                            "Unknown"}
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
                    <div className="space-y-3 pt-4">
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            onClick={handleOpenAssignmentModal}
                          >
                            Assign
                          </button>
                          <button
                            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                            onClick={handleOpenEscalationModal}
                          >
                            Escalate
                          </button>
                        </div>
                      )}
                      {(isAdmin || isNavigator) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Update Status
                          </label>
                          <select
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            value={activeComplaint.status}
                            onChange={async (e) => {
                              if (!token) return;
                              const newStatus = e.target
                                .value as ApiComplaint["status"];
                              try {
                                const complaint =
                                  await updateComplaintStatusApi(
                                    token,
                                    activeComplaint.id,
                                    {
                                      status: newStatus,
                                    }
                                  );
                                setLiveComplaints((prev) =>
                                  prev.map((c) =>
                                    c.id === complaint.id ? complaint : c
                                  )
                                );
                                if (isAdmin) {
                                  refreshStats();
                                }
                              } catch (error) {
                                console.error(
                                  "Failed to update status:",
                                  error
                                );
                                alert(
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to update status"
                                );
                              }
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
                )}
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
            {isAdmin && (
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
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
    </div>
  );
}
