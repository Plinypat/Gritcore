// ─── Org ────────────────────────────────────────────────────────────────────

export type OrgPlan = 'free' | 'pro' | 'enterprise';

export interface Org {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  sheets_used: number;
  sheets_limit: number;
  created_at: string;
  updated_at: string;
}

// ─── User ───────────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'estimator' | 'viewer';

export interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Project ─────────────────────────────────────────────────────────────────

export type ProjectPhase = 'bid' | 'active' | 'rfi' | 'complete' | 'archived';

export interface Project {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  phase: ProjectPhase;
  bid_due_date: string | null;
  location: string | null;
  gcr_number: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ─── Sheet ───────────────────────────────────────────────────────────────────

export type SheetStatus = 'uploaded' | 'processing' | 'ready' | 'error';

export interface Sheet {
  id: string;
  project_id: string;
  org_id: string;
  name: string;
  sheet_number: string | null;
  discipline: string | null;
  revision: string | null;
  file_url: string;
  file_size: number;
  page_count: number;
  status: SheetStatus;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// ─── AI Review ────────────────────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface AIReview {
  id: string;
  sheet_id: string;
  org_id: string;
  status: ReviewStatus;
  model_used: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  passed_count: number;
  summary: string | null;
  quantity_estimate: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

// ─── Issue ────────────────────────────────────────────────────────────────────

export type IssueSeverity = 'critical' | 'warning' | 'info' | 'passed';
export type IssueStatus = 'open' | 'acknowledged' | 'resolved' | 'wont_fix';

export interface Issue {
  id: string;
  review_id: string;
  org_id: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  code_ref: string | null;
  grid_location: string | null;
  dollar_risk_estimate: number | null;
  status: IssueStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Markup ───────────────────────────────────────────────────────────────────

export type MarkupType = 'box' | 'arrow' | 'circle' | 'freehand' | 'text';

export interface Markup {
  id: string;
  sheet_id: string;
  issue_id: string | null;
  org_id: string;
  created_by: string;
  type: MarkupType;
  color: string;
  coords: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: Array<{ x: number; y: number }>;
  };
  label: string | null;
  created_at: string;
}

// ─── RFI ─────────────────────────────────────────────────────────────────────

export type RFIStatus = 'draft' | 'submitted' | 'answered' | 'closed';
export type RFIPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface RFI {
  id: string;
  project_id: string;
  org_id: string;
  rfi_number: string;
  subject: string;
  question: string;
  answer: string | null;
  status: RFIStatus;
  priority: RFIPriority;
  issue_id: string | null;
  sheet_id: string | null;
  submitted_by: string;
  answered_by: string | null;
  due_date: string | null;
  submitted_at: string | null;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface JWTPayload {
  userId: string;
  orgId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
