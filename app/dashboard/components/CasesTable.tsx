"use client";

import type { ApiComplaint } from "@/lib/api";
import { formatComplaintStatus, formatDisplayText } from "../utils/formatters";

interface CasesTableProps {
  complaints: ApiComplaint[];
  selectedCase: string | null;
  onSelect: (id: string) => void;
}

export function CasesTable({
  complaints,
  selectedCase,
  onSelect,
}: CasesTableProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="font-semibold text-gray-900">Active Cases</h3>
        <p className="text-sm text-gray-600">{complaints.length} cases showing</p>
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
            {complaints.map((c) => (
              <tr
                key={c.id}
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedCase === c.id ? "bg-blue-50" : ""
                }`}
                onClick={() => onSelect(c.id)}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {c.id.slice(0, 8)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatDisplayText(c.district)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatDisplayText(c.category)}
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
  );
}

