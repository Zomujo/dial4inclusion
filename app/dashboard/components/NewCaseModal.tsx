"use client";

import { FormEvent } from "react";
import type { ComplaintFormState } from "../hooks/useComplaints";
import {
  districtOptions,
  categoryOptions,
  assistiveDeviceOptions,
  requestTypeOptions,
  issueTypeOptions,
} from "../utils/constants";

interface NewCaseModalProps {
  complaintForm: ComplaintFormState;
  setComplaintForm: React.Dispatch<React.SetStateAction<ComplaintFormState>>;
  complaintSubmitting: boolean;
  complaintStatus: string | null;
  complaintsError: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function NewCaseModal({
  complaintForm,
  setComplaintForm,
  complaintSubmitting,
  complaintStatus,
  complaintsError,
  onSubmit,
  onClose,
}: NewCaseModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Submit New Complaint
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
                      complaintType: e.target.value as "general" | "detailed",
                    }))
                  }
                  className="sr-only"
                />
                <div className="text-center">
                  <p className="font-semibold text-gray-900">General Report</p>
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
                      complaintType: e.target.value as "general" | "detailed",
                    }))
                  }
                  className="sr-only"
                />
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Detailed Report</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Full information with personal details
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Contact Information - Always required */}
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Contact Information</h3>

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
            <h3 className="font-semibold text-gray-900">Complaint Details</h3>

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
                  {districtOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
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
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {complaintForm.category === "other" && (
              <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  Specify Other Category *
                </span>
                <input
                  type="text"
                  required
                  placeholder="Please specify the category"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={complaintForm.otherCategory}
                  onChange={(e) =>
                    setComplaintForm((prev) => ({
                      ...prev,
                      otherCategory: e.target.value,
                    }))
                  }
                />
              </label>
            )}

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
                    {assistiveDeviceOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
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
                    {requestTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
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
              </>
            )}

            {complaintForm.complaintType === "detailed" && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  Issue Types * (select all that apply)
                </span>
                <div className="grid gap-2 md:grid-cols-2">
                  {issueTypeOptions.map((issue) => (
                    <label
                      key={issue.value}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={complaintForm.issueTypes.includes(issue.value)}
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
              onClick={onClose}
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
  );
}
