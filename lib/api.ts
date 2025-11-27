const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

interface ApiErrorPayload {
  error?: {
    message?: string;
    details?: unknown;
  };
}

class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
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
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const payload = (await response
    .json()
    .catch(() => ({}))) as ApiErrorPayload & T;

  if (!response.ok) {
    const message =
      (payload as ApiErrorPayload)?.error?.message ??
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload.error?.details);
  }

  return payload as T;
}

export interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin' | 'navigator';
}

export interface ApiComplaint {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string | null;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  assignedNavigatorId: string | null;
  expectedResolutionDate: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: ApiUser;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function registerUser(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getProfile(token: string): Promise<{ user: ApiUser }> {
  return apiFetch<{ user: ApiUser }>('/auth/me', {
    method: 'GET',
    token,
  });
}

export async function getComplaints(token: string): Promise<{
  complaints: ApiComplaint[];
}> {
  return apiFetch<{ complaints: ApiComplaint[] }>('/complaints', {
    method: 'GET',
    token,
  });
}

export async function submitComplaint(
  token: string,
  input: {
    title: string;
    description: string;
    category?: string;
  }
): Promise<{ complaint: ApiComplaint }> {
  return apiFetch<{ complaint: ApiComplaint }>('/complaints', {
    method: 'POST',
    body: JSON.stringify(input),
    token,
  });
}

export async function getNavigators(token: string): Promise<{
  navigators: ApiUser[];
}> {
  return apiFetch<{ navigators: ApiUser[] }>('/users/navigators', {
    method: 'GET',
    token,
  });
}

export async function assignComplaint(
  token: string,
  complaintId: string,
  input: {
    navigatorId: string;
    expectedResolutionDate?: string;
  }
): Promise<{ complaint: ApiComplaint }> {
  return apiFetch<{ complaint: ApiComplaint }>(`/complaints/${complaintId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(input),
    token,
  });
}

export async function updateComplaintStatus(
  token: string,
  complaintId: string,
  input: {
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  }
): Promise<{ complaint: ApiComplaint }> {
  return apiFetch<{ complaint: ApiComplaint }>(`/complaints/${complaintId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(input),
    token,
  });
}

export interface ComplaintStats {
  activeCases: number;
  avgResponseHours: number;
  resolutionRate: number;
  overdueCases: number;
}

export async function getComplaintStats(token: string): Promise<{
  stats: ComplaintStats;
}> {
  return apiFetch<{ stats: ComplaintStats }>('/complaints/stats', {
    method: 'GET',
    token,
  });
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
): Promise<{ updates: NavigatorUpdate[] }> {
  const params = limit ? `?limit=${limit}` : '';
  return apiFetch<{ updates: NavigatorUpdate[] }>(`/complaints/navigator-updates${params}`, {
    method: 'GET',
    token,
  });
}

export async function getOverdueComplaints(token: string): Promise<{
  complaints: ApiComplaint[];
}> {
  return apiFetch<{ complaints: ApiComplaint[] }>('/complaints/overdue', {
    method: 'GET',
    token,
  });
}

export { ApiError };

