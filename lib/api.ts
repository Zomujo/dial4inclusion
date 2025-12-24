const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3305/api/v1";

interface ApiErrorPayload {
  message?: string;
  statusCode?: number;
  data?: unknown;
}

class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const payload = (await response
    .json()
    .catch(() => ({}))) as ApiErrorPayload & { data?: T };

  if (!response.ok) {
    const message =
      (payload as ApiErrorPayload)?.message ??
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload.data);
  }

  return payload as T;
}

export interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  role: "district_officer" | "admin" | "navigator";
  district?: string | null;
}

export interface ApiComplaint {
  id: string;
  code: string;
  // PWD Personal Information
  fullName?: string;
  age?: number;
  gender?: "male" | "female" | "other" | string;
  primaryDisabilityCategory?:
    | "visual_impairment"
    | "hearing_impairment"
    | "physical_disability"
    | "intellectual_disability"
    | "psychosocial_disability"
    | "speech_impairment"
    | "multiple_disabilities"
    | "other";
  otherDisability?: string | null;
  assistiveDevice?:
    | "none"
    | "white_cane"
    | "wheelchair"
    | "crutches"
    | "hearing_aid"
    | "braille_device"
    | "other";
  otherAssistiveDevice?: string | null;
  // Contact Information
  phoneNumber: string;
  caregiverPhoneNumber?: string;
  language?: string;
  // Issue Classification
  category:
    | "disability_fund_delay"
    | "inaccessible_building"
    | "discrimination_abuse"
    | "other_issue";
  otherCategory?: string | null;
  issueTypes?: string[]; // For detailed complaints: multiple issue types
  otherIssueType?: string | null;
  // Request Information
  requestType?: string;
  requestDescription?: string;
  otherRequest?: string | null;
  // Location & Details
  district: "ablekuma_central" | "obuasi_municipal" | "upper_denkyira_east";
  description?: string;
  status: "pending" | "in_progress" | "resolved" | "rejected" | "escalated";
  assignedToId?: string | null;
  assignedTo?: ApiUser;
  createdById?: string | null;
  createdBy?: ApiUser;
  expectedResolutionDate?: string | null;
  respondedAt?: string | null;
  escalatedAt?: string | null;
  escalationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: ApiUser;
  accessToken: string;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await apiFetch<{ data: AuthResponse }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      userIdentifier: input.email,
      password: input.password,
    }),
  });
  return response.data;
}

export async function registerUser(input: {
  email: string;
  password: string;
  fullName: string;
  role?: "district_officer" | "admin" | "navigator";
  district?: "ablekuma_central" | "obuasi_municipal" | "upper_denkyira_east";
}): Promise<AuthResponse> {
  const response = await apiFetch<{ data: AuthResponse }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function getProfile(token: string): Promise<ApiUser> {
  const response = await apiFetch<{ data: ApiUser }>("/auth/me", {
    method: "GET",
    token,
  });
  return response.data || (response as any as ApiUser);
}

export async function getComplaints(token: string): Promise<{
  rows: ApiComplaint[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const response = await apiFetch<{
    data: {
      rows: ApiComplaint[];
      total: number;
      page: number;
      pageSize: number;
    };
  }>("/complaints", {
    method: "GET",
    token,
  });
  return response.data;
}

export async function getComplaint(
  token: string,
  id: string
): Promise<ApiComplaint> {
  const response = await apiFetch<{ data: ApiComplaint }>(`/complaints/${id}`, {
    method: "GET",
    token,
  });
  return response.data;
}

export async function getUser(token: string, id: string): Promise<ApiUser> {
  const response = await apiFetch<{ data: ApiUser }>(`/users/${id}`, {
    method: "GET",
    token,
  });
  return response.data;
}

export async function submitComplaint(
  token: string,
  input: {
    // PWD Personal Information
    fullName: string;
    age: number;
    gender: string;
    primaryDisabilityCategory?: string;
    otherDisability?: string;
    assistiveDevice: string;
    otherAssistiveDevice?: string;
    // Contact Information
    phoneNumber: string;
    caregiverPhoneNumber?: string;
    language: string;
    // Issue Classification
    category: string;
    otherCategory?: string;
    issueTypes?: string[];
    otherIssueType?: string;
    // Request Information
    requestType?: string;
    requestDescription?: string;
    otherRequest?: string;
    // Location & Details
    district: string;
    description?: string;
  }
): Promise<{ code: string }> {
  const response = await apiFetch<{ data: string }>("/complaints", {
    method: "POST",
    body: JSON.stringify(input),
    token,
  });
  // Backend returns the complaint code
  return { code: response.data || "" };
}

export async function getNavigators(token: string): Promise<{
  rows: ApiUser[];
}> {
  const response = await apiFetch<{
    data: { rows: ApiUser[] };
  }>("/users?role=navigator", {
    method: "GET",
    token,
  });
  return response.data;
}

export async function getDistrictOfficers(
  token: string,
  district?: string
): Promise<{
  rows: ApiUser[];
}> {
  const qs = district
    ? `?role=district_officer&district=${encodeURIComponent(district)}`
    : `?role=district_officer`;
  const response = await apiFetch<{
    data: { rows: ApiUser[] };
  }>(`/users${qs}`, {
    method: "GET",
    token,
  });
  return response.data;
}

export async function getAdmins(token: string): Promise<{
  rows: ApiUser[];
}> {
  const response = await apiFetch<{
    data: { rows: ApiUser[] };
  }>("/users?role=admin", {
    method: "GET",
    token,
  });
  return response.data;
}

export async function assignComplaint(
  token: string,
  complaintId: string,
  input: {
    assignedToId: string;
    expectedResolutionDate?: string;
  }
): Promise<ApiComplaint> {
  const response = await apiFetch<{ data: ApiComplaint }>(
    `/complaints/${complaintId}/assign`,
    {
      method: "PUT",
      body: JSON.stringify(input),
      token,
    }
  );
  return response.data || (response as any as ApiComplaint);
}

export async function escalateComplaint(
  token: string,
  complaintId: string,
  input: {
    assignedToId: string;
    escalationReason: string;
  }
): Promise<ApiComplaint> {
  const response = await apiFetch<{ data: ApiComplaint }>(
    `/complaints/${complaintId}/escalate`,
    {
      method: "PUT",
      body: JSON.stringify(input),
      token,
    }
  );
  return response.data || (response as any as ApiComplaint);
}

export async function updateComplaintStatus(
  token: string,
  complaintId: string,
  input: {
    status: "pending" | "in_progress" | "resolved" | "rejected" | "escalated";
  }
): Promise<ApiComplaint> {
  const response = await apiFetch<{ data: ApiComplaint }>(
    `/complaints/${complaintId}/status`,
    {
      method: "PUT",
      body: JSON.stringify(input),
      token,
    }
  );
  return response.data || (response as any as ApiComplaint);
}

export interface ComplaintStats {
  activeCases: number;
  avgResponseHours: number;
  resolutionRate: number;
  overdueCases: number;
}

export async function getComplaintStats(
  token: string
): Promise<ComplaintStats> {
  // Note: These endpoints may not exist in the new backend yet
  // Returning dummy data for now
  return {
    activeCases: 0,
    avgResponseHours: 0,
    resolutionRate: 0,
    overdueCases: 0,
  };
}

export interface NavigatorUpdate {
  id: string;
  complaintId: string;
  complaintTitle: string;
  navigatorName: string;
  navigatorEmail: string;
  oldStatus: string;
  newStatus: string;
  updatedAt: string;
}

export async function getNavigatorUpdates(
  token: string,
  limit?: number
): Promise<NavigatorUpdate[]> {
  // Note: These endpoints may not exist in the new backend yet
  // Returning empty array for now
  return [];
}

export async function getOverdueComplaints(
  token: string
): Promise<ApiComplaint[]> {
  // Note: These endpoints may not exist in the new backend yet
  // Returning empty array for now
  return [];
}

export { ApiError };
