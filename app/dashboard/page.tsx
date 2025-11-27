"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getComplaints,
  submitComplaint as submitComplaintApi,
  type ApiComplaint,
  type ApiUser,
} from "@/lib/api";
import { clearAuth, loadAuth } from "@/lib/storage";

const insights = [
  { label: "Active Cases", value: 42, change: "+6", trend: "up", color: "blue" },
  { label: "Avg Response", value: "18h", change: "-2h", trend: "down", color: "green" },
  { label: "Resolution Rate", value: "87%", change: "+5%", trend: "up", color: "purple" },
  { label: "Overdue Cases", value: 5, change: "+2", trend: "up", color: "red" },
];

const tabs = [
  { id: "cases", label: "Cases" },
  { id: "monitoring", label: "Monitoring" },
  { id: "ussd", label: "USSD Flow" },
];

const alertFeed = [
  {
    id: "AL-901",
    district: "Ablekuma Central",
    caseId: "AC-204",
    message: "Initial response overdue (48h).",
    timestamp: "32m ago",
  },
  {
    id: "AL-876",
    district: "Obuasi Municipal",
    caseId: "OB-118",
    message: "Navigator note missing after field visit.",
    timestamp: "1h ago",
  },
  {
    id: "AL-844",
    district: "Upper Denkyira East",
    caseId: "UE-077",
    message: "Escalated for discrimination complaint.",
    timestamp: "3h ago",
  },
];

const navigatorNotes = [
  {
    id: "NV-501",
    district: "Obuasi Municipal",
    note: "Visited market, ramps now accessible. Waiting for officer confirmation.",
    status: "Awaiting officer",
    time: "Today • 09:15",
  },
  {
    id: "NV-499",
    district: "Ablekuma Central",
    note: "PWD confirmed call-back received, still no fund release timeline shared.",
    status: "Needs update",
    time: "Yesterday • 17:40",
  },
  {
    id: "NV-492",
    district: "Upper Denkyira East",
    note: "Assembly agreed to install signage; inspection scheduled Friday.",
    status: "On track",
    time: "Yesterday • 11:05",
  },
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
    title: "",
    description: "",
    category: "",
    district: "",
    issue: "",
  });
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("cases");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState(alertFeed);
  const [activePath, setActivePath] = useState<"report" | "info" | "navigator">("report");
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [lastAction, setLastAction] =
    useState<{ type: "assign" | "escalate"; detail: string } | null>(null);
  const [webFlowStep, setWebFlowStep] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

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
      const { complaints } = await getComplaints(token);
      setLiveComplaints(complaints);
    } catch (error) {
      setComplaintsError(
        error instanceof Error ? error.message : "Failed to load complaints",
      );
    } finally {
      setComplaintsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    refreshComplaints();
  }, [token]);

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
      const { complaint } = await submitComplaintApi(token, {
        title: complaintForm.issue || complaintForm.title,
        description: `${complaintForm.description}${
          complaintForm.district ? `\nDistrict: ${complaintForm.district}` : ""
        }`,
        category: complaintForm.category || undefined,
      });
      setLiveComplaints((current) => [complaint, ...current]);
      setComplaintForm({
        title: "",
        description: "",
        category: "",
        district: "",
        issue: "",
      });
      setWebFlowStep(3);
      setComplaintStatus("Complaint submitted successfully.");
    } catch (error) {
      setComplaintStatus(null);
      setComplaintsError(
        error instanceof Error ? error.message : "Failed to submit complaint",
      );
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const formatComplaintStatus = (
    status: ApiComplaint["status"],
  ): string => {
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

  const filteredComplaints = useMemo(() => {
    if (statusFilter === "All statuses") {
      return liveComplaints;
    }

    const statusMap: Record<string, ApiComplaint["status"]> = {
      Pending: "pending",
      "In Progress": "in_progress",
      Resolved: "resolved",
      Rejected: "rejected",
    };

    const backendStatus = statusMap[statusFilter];
    if (!backendStatus) return liveComplaints;
    return liveComplaints.filter((c) => c.status === backendStatus);
  }, [liveComplaints, statusFilter]);

  const activeComplaint =
    filteredComplaints.find((c) => c.id === selectedCase) ?? filteredComplaints[0] ?? null;

  const handleSelect = (id: string) => {
    setSelectedCase(id);
    setLastAction(null);
    setAssignmentModal(false);
    setAssignee("");
  };

  const handleDismissAlert = (id: string) => {
    setActiveAlerts((current) => current.filter((alert) => alert.id !== id));
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
        prompt: "Thank you! Report logged (ID: [XXXX]). A Navigator may call you back.",
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
        <h2 className="text-xl font-semibold text-gray-900">USSD Flow Reference</h2>
        <p className="text-gray-600">Interactive guide for Navigator training</p>
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
            onClick={() => setActivePath(path.id as "report" | "info" | "navigator")}
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
                  <span className="font-semibold text-gray-900">{step.title}</span>
                </div>
                <p className="mb-2 whitespace-pre-line text-sm text-gray-700">{step.prompt}</p>
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
                  <span className="font-semibold text-gray-900">{step.title}</span>
                </div>
                <p className="mb-2 whitespace-pre-line text-sm text-gray-700">{step.prompt}</p>
                <p className="text-xs font-semibold text-green-600">{step.userAction}</p>
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
      details: "Disability Fund Delay, Inaccessible Building, Discrimination / Abuse, Other",
    },
    {
      title: "Describe and confirm",
      details: "Share short description, add category, and submit for navigator follow-up",
    },
  ];

  return (
    <div className="mt-5 space-y-3">
      {steps.map((step, index) => (
        <div key={step.title} className="rounded-xl border border-white bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{step.title}</p>
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
            {/* Cases Tab Content */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Case Management</h2>
                <p className="text-gray-600">Monitor and triage incoming PWD complaints</p>
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
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
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
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{c.title}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              c.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : c.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : c.status === "resolved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}>
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
                <h3 className="mb-4 font-semibold text-gray-900">Case Details</h3>
                {activeComplaint && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Case ID</p>
                      <p className="text-lg font-semibold text-gray-900">{activeComplaint.id}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Title
                      </p>
                      <p className="text-gray-900">{activeComplaint.title}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Description
                      </p>
                      <p className="text-gray-700 whitespace-pre-line">
                        {activeComplaint.description}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Category
                      </p>
                      <p className="text-gray-700">
                        {activeComplaint.category ?? "General"}
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
                    {lastAction && (
                      <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                        {lastAction.type === "assign"
                          ? `Assigned to ${lastAction.detail}`
                          : `Escalated to ${lastAction.detail}`}
                      </div>
                    )}
                    <div className="flex gap-2 pt-4">
                      <button
                        className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        onClick={() => setAssignmentModal(true)}
                      >
                        Assign
                      </button>
                      <button
                        className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        onClick={() => {
                          setLastAction({
                            type: "escalate",
                            detail: "Assembly supervisor",
                          });
                        }}
                      >
                        Escalate
                      </button>
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
              <h2 className="text-xl font-semibold text-gray-900">Monitoring Dashboard</h2>
              <p className="text-gray-600">Track performance metrics and alerts</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {insights.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    </div>
                    <div className={`rounded-full p-3 ${
                      metric.color === "blue" ? "bg-blue-100" :
                      metric.color === "green" ? "bg-green-100" :
                      metric.color === "purple" ? "bg-purple-100" :
                      "bg-red-100"
                    }`}>
                      <div className={`h-6 w-6 ${
                        metric.color === "blue" ? "bg-blue-500" :
                        metric.color === "green" ? "bg-green-500" :
                        metric.color === "purple" ? "bg-purple-500" :
                        "bg-red-500"
                      } rounded`}></div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className={`text-sm font-semibold ${
                      metric.trend === "up" && metric.color === "green" ? "text-green-600" :
                      metric.trend === "down" && metric.color === "green" ? "text-green-600" :
                      metric.trend === "up" && metric.color === "red" ? "text-red-600" :
                      "text-gray-600"
                    }`}>
                      {metric.change}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">vs last week</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Alerts Section */}
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Active Alerts</h3>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                      {activeAlerts.length} active
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-6">
                      <div>
                        <p className="font-semibold text-gray-900">Case {alert.caseId}</p>
                        <p className="text-sm text-gray-700">{alert.message}</p>
                        <p className="text-xs text-gray-500">{alert.district} • {alert.timestamp}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          Resolve
                        </button>
                        <button className="rounded-lg bg-gray-600 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700">
                          Snooze
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Navigator Updates</h3>
                <div className="space-y-4">
                  {navigatorNotes.slice(0, 3).map((note) => (
                    <div key={note.id} className="rounded-lg bg-gray-50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500">{note.district}</span>
                        <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">{note.status}</span>
                      </div>
                      <p className="text-sm text-gray-700">{note.note}</p>
                      <p className="text-xs text-gray-500 mt-2">{note.time}</p>
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
              <h1 className="text-xl font-bold text-gray-900">Dial4Inclusion</h1>
              <p className="text-sm text-gray-600">PWD Response Dashboard</p>
            </div>
            {isAdmin && (
              <div className="flex rounded-lg bg-gray-100 p-1">
                {tabs.map((tab) => (
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
                  <p className="font-semibold text-gray-900">{currentUser.fullName}</p>
                  <p className="text-xs text-gray-600">{currentUser.email}</p>
                  <p className="text-xs capitalize text-gray-500">Role: {currentUser.role}</p>
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
      <main className="mx-auto max-w-7xl px-6 py-8">
        {!isAdmin && (
          <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Submit a complaint
                  </h2>
                  <p className="text-sm text-gray-600">
                    Hotspot reports feed directly into navigator view
                  </p>
                </div>
                {token && (
                  <button
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={refreshComplaints}
                    disabled={complaintsLoading}
                  >
                    {complaintsLoading ? "Refreshing..." : "Refresh list"}
                  </button>
                )}
              </div>
              {token ? (
                <form
                  className="mt-6 space-y-5 rounded-2xl border border-gray-200 p-5 shadow-sm"
                  onSubmit={handleComplaintSubmit}
                >
                  {webFlowStep === 0 && (
                    <>
                      <p className="text-sm font-semibold text-gray-700">
                        Step 1: Select your district
                      </p>
                      <select
                        required
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        value={complaintForm.district}
                        onChange={(event) => {
                          setComplaintStatus(null);
                          setComplaintForm((prev) => ({
                            ...prev,
                            district: event.target.value,
                          }));
                        }}
                      >
                        <option value="">Choose district</option>
                        <option value="Ablekuma Central">Ablekuma Central</option>
                        <option value="Obuasi Municipal">Obuasi Municipal</option>
                        <option value="Upper Denkyira East">Upper Denkyira East</option>
                      </select>
                      <div className="flex justify-between">
                        <span />
                        <button
                          type="button"
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
                          disabled={!complaintForm.district}
                          onClick={() => setWebFlowStep(1)}
                        >
                          Continue
                        </button>
                      </div>
                    </>
                  )}

                  {webFlowStep === 1 && (
                    <>
                      <p className="text-sm font-semibold text-gray-700">
                        Step 2: Choose the issue
                      </p>
                      <div className="space-y-2">
                        {[
                          "Disability Fund Delay",
                          "Inaccessible Building",
                          "Discrimination / Abuse",
                          "Other Service Issue",
                        ].map((issue) => (
                          <label
                            key={issue}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 ${
                              complaintForm.issue === issue
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <input
                              type="radio"
                              className="h-4 w-4"
                              checked={complaintForm.issue === issue}
                              onChange={() => {
                                setComplaintStatus(null);
                                setComplaintForm((prev) => ({
                                  ...prev,
                                  issue,
                                  title: issue,
                                }));
                              }}
                            />
                            <span className="text-sm text-gray-800">{issue}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-between">
                        <button
                          type="button"
                          className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                          onClick={() => setWebFlowStep(0)}
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
                          disabled={!complaintForm.issue}
                          onClick={() => setWebFlowStep(2)}
                        >
                          Continue
                        </button>
                      </div>
                    </>
                  )}

                  {webFlowStep === 2 && (
                    <>
                      <p className="text-sm font-semibold text-gray-700">
                        Step 3: Describe & submit
                      </p>
                      <label className="block space-y-1">
                        <span className="text-sm font-medium text-gray-700">
                          Description
                        </span>
                        <textarea
                          required
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                          rows={4}
                          value={complaintForm.description}
                          onChange={(event) => {
                            setComplaintStatus(null);
                            setComplaintForm((prev) => ({
                              ...prev,
                              description: event.target.value,
                            }));
                          }}
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-sm font-medium text-gray-700">
                          Category (optional)
                        </span>
                        <input
                          type="text"
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                          value={complaintForm.category}
                          onChange={(event) => {
                            setComplaintStatus(null);
                            setComplaintForm((prev) => ({
                              ...prev,
                              category: event.target.value,
                            }));
                          }}
                        />
                      </label>
                      {complaintStatus && (
                        <p className="text-sm text-emerald-600">{complaintStatus}</p>
                      )}
                      {complaintsError && (
                        <p className="text-sm text-red-600">{complaintsError}</p>
                      )}
                      <div className="flex justify-between">
                        <button
                          type="button"
                          className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                          onClick={() => setWebFlowStep(1)}
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
                          disabled={
                            complaintSubmitting ||
                            !complaintForm.description ||
                            !complaintForm.issue ||
                            !complaintForm.district
                          }
                        >
                          {complaintSubmitting ? "Submitting..." : "Submit complaint"}
                        </button>
                      </div>
                    </>
                  )}

                  {webFlowStep === 3 && (
                    <div className="space-y-4 text-center">
                      <p className="text-sm font-semibold text-emerald-700">
                        Complaint received
                      </p>
                      <p className="text-sm text-gray-600">
                        Thank you. A navigator will review your report and follow up if
                        more details are needed.
                      </p>
                      <button
                        type="button"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        onClick={() => {
                          setComplaintStatus(null);
                          setWebFlowStep(0);
                        }}
                      >
                        Submit another complaint
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <p className="mt-6 text-sm text-gray-600">
                  Sign in to file and view complaints.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Web app flow reference
              </h2>
              <p className="text-sm text-gray-600">
                Mirrors the steps you just followed on this form
              </p>
              {renderWebFlowReference()}
            </div>
          </div>
        </section>
        )}
        {!isAdmin && (
          <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">My complaints</h2>
                <p className="text-sm text-gray-600">
                  Complaints you’ve submitted and their current status
                </p>
              </div>
              <button
                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                onClick={refreshComplaints}
                disabled={complaintsLoading}
              >
                {complaintsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <h3 className="mb-3 text-base font-semibold text-gray-900">
                Recent complaints
              </h3>
              {complaintsLoading && (
                <p className="text-sm text-gray-600">Loading data...</p>
              )}
              {!complaintsLoading && liveComplaints.length === 0 && (
                <p className="text-sm text-gray-600">No complaints yet.</p>
              )}
              <div className="space-y-3">
                {liveComplaints.slice(0, 5).map((complaint) => (
                  <div
                    key={complaint.id}
                    className="rounded-xl border border-white bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{complaint.title}</p>
                      <span className="text-xs font-semibold text-gray-500">
                        {formatComplaintStatus(complaint.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{complaint.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>Category: {complaint.category ?? "General"}</span>
                      <span>{formatComplaintDate(complaint.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {isAdmin && renderTabContent()}
      </main>
      {assignmentModal && activeComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign case {activeComplaint.id}
              </h3>
              <button
                className="text-gray-500 hover:text-gray-900"
                onClick={() => setAssignmentModal(false)}
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Pick a Navigator to take ownership of this case.
            </p>
            <select
              className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
            >
              <option value="">Select Navigator</option>
              <option value="Selorm">Selorm</option>
              <option value="Akos">Akos</option>
              <option value="Musa">Musa</option>
              <option value="Ama T.">Ama T.</option>
            </select>
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setAssignmentModal(false)}
              >
                Cancel
              </button>
              <button
                disabled={!assignee}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                onClick={() => {
                  if (!assignee) return;
                  setLastAction({ type: "assign", detail: assignee });
                  setAssignmentModal(false);
                  setAssignee("");
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}