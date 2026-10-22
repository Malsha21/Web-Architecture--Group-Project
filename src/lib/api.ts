import { auth } from '../firebase';

export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

export type UserProfile = {
  uid?: string;
  id?: string;
  email?: string | null;
  role: UserRole;
  displayName?: string;
  grade?: string;
  language?: string;
  createdAt?: unknown;
};

export type QuizQuestionInput = {
  subject: string;
  grade: string;
  language: 'English' | 'Sinhala' | 'Tamil';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  correct: number;
  hint?: string;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Wait until Firebase has restored the signed-in user (e.g. after a page reload).
  await auth.authStateReady();

  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');

  const user = auth.currentUser;
  if (user) {
    headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Cannot reach the server. Please check that the backend is running.', 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || `Request failed (${response.status})`, response.status);
  }
  return data as T;
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  getMe: () => request<UserProfile>('/users/me'),

  updateMe: (body: { displayName?: string; grade?: string; language?: string }) =>
    request<{ message: string }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  listUsers: () => request<{ users: UserProfile[] }>('/users'),

  getAdminMetrics: () => request<{ users: number; active: number }>('/admin/metrics'),

  createQuizQuestion: (body: QuizQuestionInput) =>
    request<{ id: string } & QuizQuestionInput>('/quizzes', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  setRole: (uid: string, role: UserRole) =>
    request<{ message: string; uid: string; role: string }>(`/users/${uid}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
};
