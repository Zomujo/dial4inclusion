"use client";

import type { ApiComplaint } from "@/lib/api";
import {
  formatComplaintDate,
  formatComplaintStatus,
  formatDisplayText,
} from "../utils/formatters";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface CasesTableProps {
  complaints: ApiComplaint[];
  selectedCase: string | null;
  onSelect: (id: string) => void;
  showDistrictColumn?: boolean;
  // Server-side pagination props
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading?: boolean;
}

export function CasesTable({
  complaints,
  selectedCase,
  onSelect,
  showDistrictColumn = true,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  loading = false,
}: CasesTableProps) {
  const totalPages = Math.ceil(total / pageSize);

  const handlePageSizeChange = (newSize: number) => {
    onPageSizeChange(newSize);
    onPageChange(1); // Reset to first page when changing page size
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="font-semibold text-gray-900">Active Cases</h3>
        <p className="text-sm text-gray-600">{total} total cases</p>
        <p className="mt-1 text-xs text-gray-500">
          Click a case row to open details.
        </p>
      </div>
      <div className="max-h-128 overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        )}
        <table className="w-full">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ID
              </th>
              {showDistrictColumn && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  District
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Category
              </th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Expected Resolution
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {complaints.length === 0 ? (
              <tr>
                <td
                  colSpan={showDistrictColumn ? 6 : 5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No cases found.
                </td>
              </tr>
            ) : (
              complaints.map((c) => (
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
                  {showDistrictColumn && (
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDisplayText(c.district)}
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDisplayText(c.category)}
                  </td>
                  <td
                    className="hidden lg:table-cell px-6 py-4 text-sm text-gray-700"
                    title={c.description ?? ""}
                  >
                    <span className="block max-w-md truncate">
                      {c.description?.trim() ? c.description : "—"}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-700">
                    {c.expectedResolutionDate
                      ? formatComplaintDate(c.expectedResolutionDate)
                      : "—"}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {total > 0 && (
        <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Showing {Math.min((page - 1) * pageSize + 1, total)}–
              {Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onPageChange(1)}
                disabled={page === 1 || loading}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                title="First page"
              >
                ««
              </button>
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                «
              </button>
              <span className="flex items-center px-2 text-sm text-gray-700">
                {page} / {totalPages || 1}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                »
              </button>
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages || loading}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                title="Last page"
              >
                »»
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
