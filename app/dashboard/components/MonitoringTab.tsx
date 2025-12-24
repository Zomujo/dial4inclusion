"use client";

import type { ApiComplaint, NavigatorUpdate } from "@/lib/api";
import { MetricsGrid } from "./MetricsGrid";
import { AlertsSection } from "./AlertsSection";
import { NavigatorUpdates } from "./NavigatorUpdates";

interface MetricItem {
  label: string;
  value: number | string;
  change: string;
  trend: "up" | "down";
  color: "blue" | "green" | "purple" | "red";
}

interface MonitoringTabProps {
  monitoringMetrics: MetricItem[];
  overdueComplaints: ApiComplaint[];
  navigatorUpdates: NavigatorUpdate[];
}

export function MonitoringTab({
  monitoringMetrics,
  overdueComplaints,
  navigatorUpdates,
}: MonitoringTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Monitoring Dashboard
        </h2>
        <p className="text-gray-600">Track performance metrics and alerts</p>
      </div>

      {/* Metrics Grid */}
      <MetricsGrid metrics={monitoringMetrics} />

      {/* Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AlertsSection overdueComplaints={overdueComplaints} />
        <NavigatorUpdates navigatorUpdates={navigatorUpdates} />
      </div>
    </div>
  );
}

