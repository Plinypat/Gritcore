import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Project, Sheet, Issue, AIReview } from '@gritcore/types';

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  setTokens: (token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, token, refreshToken) =>
        set({ user, token, refreshToken, isAuthenticated: true }),
      logout: () =>
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
    }),
    {
      name: 'gritcore-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ─── Project Store ────────────────────────────────────────────────────────────

interface ProjectState {
  projects: Project[];
  current: Project | null;
  sheets: Sheet[];
  isLoading: boolean;
  setProjects: (projects: Project[]) => void;
  setProject: (project: Project) => void;
  setSheets: (sheets: Sheet[]) => void;
  setLoading: (loading: boolean) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  current: null,
  sheets: [],
  isLoading: false,
  setProjects: (projects) => set({ projects }),
  setProject: (current) => set({ current }),
  setSheets: (sheets) => set({ sheets }),
  setLoading: (isLoading) => set({ isLoading }),
  addProject: (project) => set((s) => ({ projects: [project, ...s.projects] })),
  updateProject: (id, updates) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      current: s.current?.id === id ? { ...s.current, ...updates } : s.current,
    })),
}));

// ─── Review Store ─────────────────────────────────────────────────────────────

interface ReviewState {
  activeReview: AIReview | null;
  issues: Issue[];
  activeIssue: Issue | null;
  filter: 'all' | 'critical' | 'warning' | 'info' | 'passed';
  isReviewing: boolean;
  setReview: (review: AIReview | null) => void;
  setIssues: (issues: Issue[]) => void;
  setActiveIssue: (issue: Issue | null) => void;
  setFilter: (filter: ReviewState['filter']) => void;
  setReviewing: (v: boolean) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  activeReview: null,
  issues: [],
  activeIssue: null,
  filter: 'all',
  isReviewing: false,
  setReview: (activeReview) => set({ activeReview }),
  setIssues: (issues) => set({ issues }),
  setActiveIssue: (activeIssue) => set({ activeIssue }),
  setFilter: (filter) => set({ filter }),
  setReviewing: (isReviewing) => set({ isReviewing }),
  updateIssue: (id, updates) =>
    set((s) => ({
      issues: s.issues.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      activeIssue: s.activeIssue?.id === id ? { ...s.activeIssue, ...updates } : s.activeIssue,
    })),
}));
