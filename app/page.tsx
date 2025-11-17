"use client";

import { useMemo, useState } from "react";

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

const cases = [
  {
    id: "AC-204",
    district: "Ablekuma Central",
    language: "Ga",
    issue: "Inaccessible Building",
    status: "New",
    loggedAt: "08:22",
    demographics: "Female • Mobility aid",
    officer: "Ama T.",
    navigator: "Selorm",
  },
  {
    id: "OB-118",
    district: "Obuasi Municipal",
    language: "Twi",
    issue: "Disability Fund Delay",
    status: "In Progress",
    loggedAt: "09:04",
    demographics: "Male • Vision",
    officer: "Kojo B.",
    navigator: "Akos",
  },
  {
    id: "UE-077",
    district: "Upper Denkyira East",
    language: "Fante",
    issue: "Discrimination / Abuse",
    status: "Escalated",
    loggedAt: "07:41",
    demographics: "Woman • Hearing",
    officer: "Serwaa D.",
    navigator: "Musa",
  },
  {
    id: "OB-099",
    district: "Obuasi Municipal",
    language: "English",
    issue: "Other Service Issue",
    status: "Resolved",
    loggedAt: "06:10",
    demographics: "Man • Albino",
    officer: "Kojo B.",
    navigator: "Akos",
  },
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


export default function Home() {
  const [activeTab, setActiveTab] = useState("cases");
  const [districtFilter, setDistrictFilter] = useState("All districts");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [selectedCase, setSelectedCase] = useState(cases[0].id);
  const [activeAlerts, setActiveAlerts] = useState(alertFeed);
  const [activePath, setActivePath] = useState<"report" | "info" | "navigator">("report");
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [lastAction, setLastAction] = useState<{ type: "assign" | "escalate"; detail: string } | null>(null);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const districtMatch =
        districtFilter === "All districts" || c.district === districtFilter;
      const statusMatch =
        statusFilter === "All statuses" || c.status === statusFilter;
      return districtMatch && statusMatch;
    });
  }, [districtFilter, statusFilter]);

  const activeCase = filteredCases.find((c) => c.id === selectedCase) ?? filteredCases[0];

  const handleSelect = (id: string) => {
    setSelectedCase(id);
    setLastAction(null);
    setAssignmentModal(false);
    setAssignee("");
  };

  const handleDismissAlert = (id: string) => {
    setActiveAlerts((current) => current.filter((alert) => alert.id !== id));
  };

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
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                >
                  <option>All districts</option>
                  <option>Ablekuma Central</option>
                  <option>Obuasi Municipal</option>
                  <option>Upper Denkyira East</option>
                </select>
                <select
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All statuses</option>
                  <option>New</option>
                  <option>In Progress</option>
                  <option>Escalated</option>
                  <option>Resolved</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              {/* Cases Table */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="font-semibold text-gray-900">Active Cases</h3>
                  <p className="text-sm text-gray-600">{filteredCases.length} cases showing</p>
                </div>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">District</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Issue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredCases.map((c) => (
                        <tr
                          key={c.id}
                          className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedCase === c.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleSelect(c.id)}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{c.district}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{c.issue}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              c.status === "New" ? "bg-yellow-100 text-yellow-800" :
                              c.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                              c.status === "Escalated" ? "bg-red-100 text-red-800" :
                              "bg-green-100 text-green-800"
                            }`}>
                              {c.status}
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
                <h3 className="font-semibold text-gray-900 mb-4">Case Details</h3>
                {activeCase && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Case ID</p>
                      <p className="text-lg font-semibold text-gray-900">{activeCase.id}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Issue Type</p>
                      <p className="text-gray-900">{activeCase.issue}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Demographics</p>
                      <p className="text-gray-700">{activeCase.demographics}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Assignment</p>
                      <p className="text-gray-700">Officer: {activeCase.officer}</p>
                      <p className="text-gray-700">Navigator: {activeCase.navigator}</p>
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
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">USSD Flow Reference</h2>
              <p className="text-gray-600">Interactive guide for Navigator training</p>
        </div>

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
              {/* Base Flow */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Entry Flow</h3>
                <div className="space-y-4">
                  {baseFlow.map((step, index) => (
                    <div key={step.level} className="rounded-lg bg-gray-50 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-gray-900">{step.title}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line mb-2">{step.prompt}</p>
                      <p className="text-xs text-blue-600 font-semibold">
                        {step.level === "L1" ? mainMenuHint : step.userAction}
                      </p>
                      <p className="text-xs text-gray-500">{step.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Path-specific Flow */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {activePath === "report"
                      ? "Report Problem Flow"
                      : activePath === "info"
                        ? "Ask for Info Flow"
                        : "Navigator Connection Flow"}
                  </h3>
                  <div className="space-y-4">
                    {paths[activePath].map((step, index) => (
                      <div key={step.level} className="rounded-lg bg-gray-50 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                            {index + 3}
                          </span>
                          <span className="font-semibold text-gray-900">{step.title}</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line mb-2">{step.prompt}</p>
                        <p className="text-xs text-green-600 font-semibold">{step.userAction}</p>
                        <p className="text-xs text-gray-500">{step.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dial4Inclusion</h1>
                <p className="text-sm text-gray-600">PWD Response Dashboard</p>
              </div>
              
              {/* Tab Navigation */}
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
            </div>

            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              + New Case
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {renderTabContent()}
      </main>
      {assignmentModal && activeCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign case {activeCase.id}
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