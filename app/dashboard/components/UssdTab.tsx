"use client";

import { useState } from "react";
import { baseFlow, ussdPaths } from "../utils/constants";

interface UssdTabProps {
  compact?: boolean;
}

export function UssdTab({ compact }: UssdTabProps) {
  const [activePath, setActivePath] = useState<"report" | "info" | "navigator">(
    "report"
  );

  const mainMenuHint =
    activePath === "report"
      ? "Input: 1 (Report a problem)"
      : activePath === "info"
      ? "Input: 2 (Ask for info)"
      : "Input: 3 (Speak to a Navigator)";

  return (
    <div className="space-y-6">
      {!compact && (
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
            {ussdPaths[activePath].map((step, index) => (
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
}

